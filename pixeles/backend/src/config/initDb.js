const fs = require("fs");
const path = require("path");
const { pool } = require("./database");

/**
 * Ejecuta el esquema + datos iniciales (init-db.sql).
 * Es idempotente: usa CREATE TABLE IF NOT EXISTS, ALTER ... IF NOT EXISTS
 * e INSERT ... ON CONFLICT. Se ejecuta en un solo client.query en modo
 * simple (sin parámetros), que admite múltiples statements.
 *
 * IMPORTANTE: no es letal. Si falla, se loguea el error pero NO se aborta
 * el arranque, para no tumbar un servicio que ya funciona.
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

module.exports = { initDb };
