const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "pixeles",
  user: process.env.DB_USER || "pixeles",
  password: process.env.DB_PASSWORD || "pixeles_secret_2024",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

/** Helper para queries con logging opcional */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === "development") {
    console.log(`[DB] ${duration}ms | ${text.slice(0, 80)}`);
  }
  return result;
}

/** Testear conexión al arranque */
async function testConnection() {
  try {
    await pool.query("SELECT 1");
    console.log("[DB] PostgreSQL conectado ✅");
    return true;
  } catch (err) {
    console.error("[DB] Error de conexión ❌", err.message);
    return false;
  }
}

module.exports = { pool, query, testConnection };
