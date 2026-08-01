const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { pool } = require("./database");

/**
 * Ejecuta el esquema + datos iniciales (init-db.sql).
 * Es idempotente. No letal: si falla, loguea pero no aborta el arranque.
 */
async function initDb() {
  const candidates = [
    path.join(__dirname, "..", "..", "scripts", "init-db.sql"),
    path.join(__dirname, "..", "..", "..", "scripts", "init-db.sql"),
    path.join(__dirname, "..", "init-db.sql"),
    path.join(process.cwd(), "init-db.sql"),
  ];

  let sqlPath = candidates.find((p) => fs.existsSync(p));
  if (!sqlPath) {
    console.warn("[DB] init-db.sql no encontrado. Se omite inicialización del esquema.");
    return false;
  }

  const sql = fs.readFileSync(sqlPath, "utf8");
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("[DB] Esquema y datos iniciales aplicados ✅");
  } catch (err) {
    console.error("[DB] init-db: error NO letal aplicando esquema →", err.message);
  } finally {
    client.release();
  }
  return true;
}

/**
 * Crea el usuario admin por defecto (admin / admin123) si no existe.
 */
async function seedAdmin() {
  try {
    const existing = await pool.query("SELECT id FROM users WHERE username = 'admin'");
    if (existing.rows.length > 0) return;

    const hash = await bcrypt.hash("admin123", 10);
    await pool.query(
      `INSERT INTO users (username, password_hash, full_name, role)
       VALUES ('admin', $1, 'Administrador', 'superadmin')`,
      [hash]
    );
    console.log("[DB] Admin inicial creado ✅ (admin / admin123)");
  } catch (err) {
    console.error("[DB] Error creando admin →", err.message);
  }
}

module.exports = { initDb, seedAdmin };
