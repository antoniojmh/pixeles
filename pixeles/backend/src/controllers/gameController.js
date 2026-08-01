const { pool } = require("../config/database");
const { createError } = require("../middleware/errorHandler");

/**
 * Obtener todos los juegos
 */
async function getAll(req, res) {
  const result = await pool.query(
    "SELECT * FROM games ORDER BY name ASC"
  );
  res.json({ games: result.rows });
}

/**
 * Crear juego
 */
async function create(req, res) {
  const { name } = req.body;
  if (!name || !name.trim()) throw createError(400, "Nombre del juego requerido");

  const existing = await pool.query("SELECT id FROM games WHERE LOWER(name) = LOWER($1)", [name.trim()]);
  if (existing.rows.length > 0) throw createError(409, "El juego ya existe");

  const result = await pool.query(
    "INSERT INTO games (name) VALUES ($1) RETURNING *",
    [name.trim()]
  );

  res.status(201).json({ game: result.rows[0] });
}

/**
 * Actualizar juego
 */
async function update(req, res) {
  const { id } = req.params;
  const { name } = req.body;
  if (!name || !name.trim()) throw createError(400, "Nombre del juego requerido");

  const result = await pool.query(
    "UPDATE games SET name = $1 WHERE id = $2 RETURNING *",
    [name.trim(), id]
  );

  if (result.rows.length === 0) {
    throw createError(404, "Juego no encontrado");
  }

  res.json({ game: result.rows[0] });
}

/**
 * Eliminar juego
 */
async function remove(req, res) {
  const { id } = req.params;

  // Verificar si está en uso
  const usage = await pool.query(
    "SELECT COUNT(*) FROM sessions WHERE game_id = $1",
    [id]
  );
  if (parseInt(usage.rows[0].count) > 0) {
    throw createError(400, "No se puede eliminar: el juego tiene sesiones registradas");
  }

  const result = await pool.query(
    "DELETE FROM games WHERE id = $1 RETURNING *",
    [id]
  );

  if (result.rows.length === 0) {
    throw createError(404, "Juego no encontrado");
  }

  res.json({ message: "Juego eliminado" });
}

module.exports = { getAll, create, update, remove };
