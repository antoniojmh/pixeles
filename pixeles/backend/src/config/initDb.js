const fs = require("fs");
const path = require("path");
const { query } = require("./database");

/**
 * Ejecuta el esquema + datos iniciales (init-db.sql).
 * Es idempotente: usa CREATE TABLE IF NOT EXISTS e INSERT ON CONFLICT.
 * Se llama al arrancar el servidor.
 */
async function initDb() {
  // Localizar el archivo SQL (robusto ante distintos root dirs en Render)
  const candidates = [
    path.join(__dirname, "..", "..", "scripts", "init-db.sql"), // repo/scripts
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

  // Dividir por statements (el cliente pg no acepta multi-statement en una query)
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await query(stmt);
  }

  console.log("[DB] Esquema y datos iniciales aplicados ✅ (%d statements)", statements.length);
  return true;
}

module.exports = { initDb };
