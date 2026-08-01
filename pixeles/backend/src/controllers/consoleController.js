const { pool } = require("../config/database");
const timerService = require("../services/timerService");
const socketService = require("../services/socketService");
const { createError } = require("../middleware/errorHandler");

/**
 * Obtener todas las consolas con su sesión activa (si tiene)
 */
async function getAll(req, res) {
  const result = await pool.query(`
    SELECT
      c.id, c.name, c.number, c.status, c.created_at,
      c.current_game_id,
      c.current_session_id,
      g.name AS game_name,
      s.start_time AS session_start,
      s.end_time AS session_end,
      s.duration_minutes,
      s.client_name,
      s.amount_paid
    FROM consoles c
    LEFT JOIN games g ON g.id = c.current_game_id
    LEFT JOIN sessions s ON s.id = c.current_session_id AND s.status = 'active'
    ORDER BY c.number ASC
  `);

  // Agregar tiempo restante en ms para sesiones activas
  const consoles = result.rows.map((c) => ({
    ...c,
    remaining_ms: c.status === "occupied" ? timerService.getRemaining(c.id) : null,
  }));

  res.json({ consoles });
}

/**
 * Obtener una consola por ID
 */
async function getById(req, res) {
  const { id } = req.params;
  const result = await pool.query(
    `SELECT c.*, g.name AS game_name,
            s.start_time AS session_start, s.end_time AS session_end,
            s.duration_minutes, s.client_name
     FROM consoles c
     LEFT JOIN games g ON g.id = c.current_game_id
     LEFT JOIN sessions s ON s.id = c.current_session_id AND s.status = 'active'
     WHERE c.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw createError(404, "Consola no encontrada");
  }

  const console = result.rows[0];
  console.remaining_ms =
    console.status === "occupied" ? timerService.getRemaining(console.id) : null;

  res.json({ console });
}

/**
 * Crear nueva consola
 */
async function create(req, res) {
  const { name, number } = req.body;
  if (!name || !number) throw createError(400, "Nombre y número son requeridos");

  const result = await pool.query(
    `INSERT INTO consoles (name, number, status) VALUES ($1, $2, 'free')
     RETURNING *`,
    [name, number]
  );

  socketService.emitConsoleUpdated(result.rows[0]);
  res.status(201).json({ console: result.rows[0] });
}

/**
 * Actualizar consola
 */
async function update(req, res) {
  const { id } = req.params;
  const { name, number } = req.body;

  const result = await pool.query(
    `UPDATE consoles SET name = COALESCE($1, name), number = COALESCE($2, number),
     updated_at = NOW() WHERE id = $3 RETURNING *`,
    [name, number, id]
  );

  if (result.rows.length === 0) {
    throw createError(404, "Consola no encontrada");
  }

  socketService.emitConsoleUpdated(result.rows[0]);
  res.json({ console: result.rows[0] });
}

/**
 * Eliminar consola
 */
async function remove(req, res) {
  const { id } = req.params;
  const result = await pool.query(
    "DELETE FROM consoles WHERE id = $1 RETURNING *",
    [id]
  );
  if (result.rows.length === 0) {
    throw createError(404, "Consola no encontrada");
  }
  res.json({ message: "Consola eliminada" });
}

/**
 * Iniciar sesión en una consola
 */
async function startSession(req, res) {
  const { id } = req.params;
  const { game_id, duration_minutes, client_name, amount_paid } = req.body;

  if (!game_id) throw createError(400, "Selecciona un juego");
  if (!duration_minutes || duration_minutes < 1) {
    throw createError(400, "Duración inválida");
  }

  const client = await pool.query("SELECT * FROM consoles WHERE id = $1", [id]);
  if (client.rows.length === 0) throw createError(404, "Consola no encontrada");
  if (client.rows[0].status !== "free") {
    throw createError(400, `La consola está ${client.rows[0].status}`);
  }

  await pool.query("BEGIN");

  try {
    // Crear sesión
    const session = await pool.query(
      `INSERT INTO sessions (console_id, game_id, duration_minutes, client_name, amount_paid, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING *`,
      [id, game_id, duration_minutes, client_name || "", amount_paid || 0]
    );

    // Calcular end_time = start_time + duración
    const startTime = new Date(session.rows[0].start_time);
    const endTime = new Date(startTime.getTime() + duration_minutes * 60000);

    await pool.query(
      "UPDATE sessions SET end_time = $1 WHERE id = $2",
      [endTime, session.rows[0].id]
    );

    // Actualizar consola
    const updatedConsole = await pool.query(
      `UPDATE consoles SET status = 'occupied', current_game_id = $1,
       current_session_id = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [game_id, session.rows[0].id, id]
    );

    await pool.query("COMMIT");

    session.rows[0].end_time = endTime;
    session.rows[0].console_name = client.rows[0].name;

    // Registrar en timer service
    timerService.trackSession(
      { ...session.rows[0], end_time: endTime },
      parseInt(id)
    );

    socketService.emitSessionStarted({
      session: session.rows[0],
      console: updatedConsole.rows[0],
    });

    res.status(201).json({
      session: session.rows[0],
      console: updatedConsole.rows[0],
    });
  } catch (err) {
    await pool.query("ROLLBACK").catch(() => {});
    throw err;
  }
}

/**
 * Finalizar sesión manualmente
 */
async function endSession(req, res) {
  const { id } = req.params;

  const client = await pool.query("SELECT * FROM consoles WHERE id = $1", [id]);
  if (client.rows.length === 0) throw createError(404, "Consola no encontrada");
  if (client.rows[0].status !== "occupied") {
    throw createError(400, "La consola no está ocupada");
  }

  const sessionId = client.rows[0].current_session_id;

  await pool.query("BEGIN");
  try {
    await pool.query(
      `UPDATE sessions SET status = 'completed', end_time = NOW()
       WHERE id = $1 AND status = 'active'`,
      [sessionId]
    );

    const updatedConsole = await pool.query(
      `UPDATE consoles SET status = 'free', current_session_id = NULL,
       current_game_id = NULL, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );

    await pool.query("COMMIT");

    timerService.removeTimer(parseInt(id));

    socketService.emitSessionEnded({
      sessionId,
      consoleId: parseInt(id),
      console: updatedConsole.rows[0],
    });

    res.json({
      message: "Sesión finalizada",
      console: updatedConsole.rows[0],
    });
  } catch (err) {
    await pool.query("ROLLBACK").catch(() => {});
    throw err;
  }
}

/**
 * Reservar consola
 */
async function reserve(req, res) {
  const { id } = req.params;
  const { client_name } = req.body;

  const result = await pool.query(
    `UPDATE consoles SET status = 'reserved', updated_at = NOW()
     WHERE id = $1 AND status = 'free'
     RETURNING *`,
    [id]
  );

  if (result.rows.length === 0) {
    throw createError(400, "La consola no está disponible para reserva");
  }

  socketService.emitConsoleUpdated(result.rows[0]);
  res.json({ console: result.rows[0] });
}

/**
 * Liberar reserva
 */
async function releaseReservation(req, res) {
  const { id } = req.params;

  const result = await pool.query(
    `UPDATE consoles SET status = 'free', updated_at = NOW()
     WHERE id = $1 AND status = 'reserved'
     RETURNING *`,
    [id]
  );

  if (result.rows.length === 0) {
    throw createError(400, "La consola no está reservada");
  }

  socketService.emitConsoleUpdated(result.rows[0]);
  res.json({ console: result.rows[0] });
}

/**
 * Alternar modo mantenimiento
 */
async function toggleMaintenance(req, res) {
  const { id } = req.params;

  const current = await pool.query("SELECT status FROM consoles WHERE id = $1", [id]);
  if (current.rows.length === 0) throw createError(404, "Consola no encontrada");

  const newStatus =
    current.rows[0].status === "maintenance" ? "free" : "maintenance";

  const result = await pool.query(
    `UPDATE consoles SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [newStatus, id]
  );

  socketService.emitConsoleUpdated(result.rows[0]);
  res.json({ console: result.rows[0] });
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  startSession,
  endSession,
  reserve,
  releaseReservation,
  toggleMaintenance,
};
