/**
 * POST /api/consoles/:id/pause  — Pausar sesión activa
 */
async function pauseSession(req, res) {
  const { id } = req.params;
  const console = await pool.query("SELECT * FROM consoles WHERE id=$1", [id]);
  if (console.rows.length === 0) throw createError(404, "Consola no encontrada");
  if (console.rows[0].status !== "occupied") {
    throw createError(400, "Solo se puede pausar una consola ocupada");
  }

  const sid = console.rows[0].current_session_id;
  await pool.query(
    `UPDATE sessions SET status='paused', pause_started_at=NOW() WHERE id=$1 AND status='active'`,
    [sid]
  );

  timerService.pauseTimer(parseInt(id));

  socketService.emit("session:paused", { sessionId: sid, consoleId: parseInt(id) });
  res.json({ message: "Sesión pausada" });
}

/**
 * POST /api/consoles/:id/resume  — Reanudar sesión pausada
 */
async function resumeSession(req, res) {
  const { id } = req.params;
  const console = await pool.query("SELECT * FROM consoles WHERE id=$1", [id]);
  if (console.rows.length === 0) throw createError(404, "Consola no encontrada");

  const sid = console.rows[0].current_session_id;
  const session = await pool.query(
    "SELECT * FROM sessions WHERE id=$1 AND status='paused'", [sid]
  );
  if (session.rows.length === 0) throw createError(400, "No hay sesión pausada");

  // Calcular tiempo pausado y acumularlo
  const pausedMs = Date.now() - new Date(session.rows[0].pause_started_at).getTime();
  const pausedSeconds = Math.floor(pausedMs / 1000);

  // Extender end_time por el tiempo pausado
  await pool.query(
    `UPDATE sessions SET status='active', pause_started_at=NULL,
     paused_seconds=paused_seconds+$1,
     end_time=end_time + ($1 || '1 second')::interval
     WHERE id=$2`,
    [pausedSeconds, sid]
  );

  timerService.resumeTimer(parseInt(id), pausedMs);

  socketService.emit("session:resumed", { sessionId: sid, consoleId: parseInt(id) });
  res.json({ message: "Sesión reanudada", paused_seconds: pausedSeconds });
}

/**
 * POST /api/consoles/:id/add-time  — Agregar minutos a sesión activa
 * Body: { minutes: number }
 */
async function addTime(req, res) {
  const { id } = req.params;
  const { minutes } = req.body;
  if (!minutes || minutes < 1) throw createError(400, "Minutos inválidos");

  const console = await pool.query("SELECT * FROM consoles WHERE id=$1", [id]);
  if (console.rows.length === 0) throw createError(404, "Consola no encontrada");

  const sid = console.rows[0].current_session_id;
  const session = await pool.query(
    "SELECT * FROM sessions WHERE id=$1 AND status IN ('active','paused')", [sid]
  );
  if (session.rows.length === 0) throw createError(400, "No hay sesión activa para agregar tiempo");

  await pool.query(
    `UPDATE sessions SET duration_minutes=duration_minutes+$1,
     end_time=end_time + ($1 || '1 minute')::interval WHERE id=$2`,
    [minutes, sid]
  );

  timerService.addTime(parseInt(id), minutes * 60000);

  socketService.emit("session:timeAdded", { sessionId: sid, consoleId: parseInt(id), minutes });
  res.json({ message: `${minutes} min agregados` });
}

/**
 * POST /api/consoles/:id/status  — Cambiar estado manualmente
 * Body: { status: 'off' | 'no_internet' | 'error' | 'maintenance' | 'free' }
 */
async function setStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  const valid = ["free", "maintenance", "off", "no_internet", "error"];
  if (!valid.includes(status)) throw createError(400, `Estado inválido. Válidos: ${valid.join(", ")}`);

  // Si está ocupada y se fuerza free, finalizar sesión
  const console = await pool.query("SELECT * FROM consoles WHERE id=$1", [id]);
  if (console.rows.length === 0) throw createError(404, "Consola no encontrada");

  if (status === "free" && console.rows[0].status === "occupied") {
    const sid = console.rows[0].current_session_id;
    await pool.query(
      "UPDATE sessions SET status='cancelled', end_time=NOW() WHERE id=$1",
      [sid]
    );
    timerService.removeTimer(parseInt(id));
  }

  const result = await pool.query(
    `UPDATE consoles SET status=$1, 
     current_session_id=CASE WHEN $1 IN ('free','maintenance','off','no_internet','error') THEN NULL ELSE current_session_id END,
     current_game_id=CASE WHEN $1 IN ('free','maintenance','off','no_internet','error') THEN NULL ELSE current_game_id END,
     updated_at=NOW() WHERE id=$2 RETURNING *`,
    [status, id]
  );

  socketService.emitConsoleUpdated(result.rows[0]);
  res.json({ console: result.rows[0] });
}
