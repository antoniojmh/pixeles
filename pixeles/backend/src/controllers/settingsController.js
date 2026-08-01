const { pool } = require("../config/database");
const { createError } = require("../middleware/errorHandler");

/**
 * Obtener todos los settings
 */
async function getAll(req, res) {
  const result = await pool.query("SELECT * FROM settings ORDER BY key");
  const settings = {};
  for (const row of result.rows) {
    // Intentar parsear JSON
    try {
      settings[row.key] = JSON.parse(row.value);
    } catch {
      settings[row.key] = row.value;
    }
  }
  res.json({ settings });
}

/**
 * Actualizar un setting
 */
async function update(req, res) {
  const { key, value } = req.body;
  if (!key) throw createError(400, "Key es requerida");

  const serialized = typeof value === "object" ? JSON.stringify(value) : String(value);

  const result = await pool.query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key)
     DO UPDATE SET value = $2, updated_at = NOW()
     RETURNING *`,
    [key, serialized]
  );

  res.json({ setting: result.rows[0] });
}

module.exports = { getAll, update };
