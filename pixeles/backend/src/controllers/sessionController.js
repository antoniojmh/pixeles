const { pool } = require("../config/database");
const { createError } = require("../middleware/errorHandler");

/**
 * Listar sesiones con filtros y paginación
 * Query params: page, limit, status, console_id, game_id, date_from, date_to
 */
async function getAll(req, res) {
  const {
    page = 1,
    limit = 50,
    status,
    console_id,
    game_id,
    date_from,
    date_to,
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  const conditions = [];
  let paramIndex = 1;

  if (status) {
    conditions.push(`s.status = $${paramIndex++}`);
    params.push(status);
  }
  if (console_id) {
    conditions.push(`s.console_id = $${paramIndex++}`);
    params.push(console_id);
  }
  if (game_id) {
    conditions.push(`s.game_id = $${paramIndex++}`);
    params.push(game_id);
  }
  if (date_from) {
    conditions.push(`s.start_time >= $${paramIndex++}`);
    params.push(date_from);
  }
  if (date_to) {
    conditions.push(`s.start_time <= $${paramIndex++}`);
    params.push(date_to);
  }

  const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  // Total count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM sessions s ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // Data
  const result = await pool.query(
    `SELECT s.*, c.name AS console_name, c.number AS console_number,
            g.name AS game_name
     FROM sessions s
     JOIN consoles c ON c.id = s.console_id
     LEFT JOIN games g ON g.id = s.game_id
     ${where}
     ORDER BY s.start_time DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, parseInt(limit), offset]
  );

  res.json({
    sessions: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
}

/**
 * Obtener sesión por ID
 */
async function getById(req, res) {
  const { id } = req.params;
  const result = await pool.query(
    `SELECT s.*, c.name AS console_name, c.number AS console_number,
            g.name AS game_name
     FROM sessions s
     JOIN consoles c ON c.id = s.console_id
     LEFT JOIN games g ON g.id = s.game_id
     WHERE s.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw createError(404, "Sesión no encontrada");
  }

  res.json({ session: result.rows[0] });
}

module.exports = { getAll, getById };
