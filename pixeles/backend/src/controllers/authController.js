const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/database");
const { JWT_SECRET, JWT_EXPIRES } = require("../middleware/authMiddleware");

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña requeridos" });
  }

  const result = await pool.query(
    "SELECT id, username, password_hash, full_name, role, branch_id FROM users WHERE username = $1 AND is_active = true",
    [username]
  );
  if (result.rows.length === 0) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, branch_id: user.branch_id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      branch_id: user.branch_id,
    },
  });
}

/**
 * POST /api/auth/register
 * Body: { username, password, full_name, role, branch_id }
 * Solo superadmin/admin pueden registrar.
 */
async function register(req, res) {
  const { username, password, full_name, role, branch_id } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña requeridos" });
  }

  const existing = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: "El usuario ya existe" });
  }

  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (username, password_hash, full_name, role, branch_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, username, full_name, role, branch_id`,
    [username, hash, full_name || username, role || "operator", branch_id || null]
  );

  res.status(201).json({ user: result.rows[0] });
}

/**
 * GET /api/auth/me — usuario actual desde token
 */
async function me(req, res) {
  const result = await pool.query(
    "SELECT id, username, full_name, role, branch_id FROM users WHERE id = $1",
    [req.user.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }
  res.json({ user: result.rows[0] });
}

module.exports = { login, register, me };
