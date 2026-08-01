const { pool } = require("../config/database");

/**
 * Reporte del día
 */
async function dailyReport(req, res) {
  const { date } = req.query;
  const reportDate = date || new Date().toISOString().split("T")[0];

  const result = await pool.query(
    `SELECT
       COUNT(*) AS total_sessions,
       COALESCE(SUM(amount_paid), 0) AS total_revenue,
       COALESCE(SUM(duration_minutes), 0) AS total_minutes,
       COUNT(DISTINCT client_name) FILTER (WHERE client_name != '') AS unique_clients
     FROM sessions
     WHERE DATE(start_time) = $1 AND status = 'completed'`,
    [reportDate]
  );

  // Sesiones por consola
  const byConsole = await pool.query(
    `SELECT c.name, c.number, COUNT(*) AS sessions,
            COALESCE(SUM(s.amount_paid), 0) AS revenue
     FROM sessions s
     JOIN consoles c ON c.id = s.console_id
     WHERE DATE(s.start_time) = $1 AND s.status = 'completed'
     GROUP BY c.id, c.name, c.number
     ORDER BY c.number`,
    [reportDate]
  );

  res.json({
    date: reportDate,
    stats: result.rows[0],
    by_console: byConsole.rows,
  });
}

/**
 * Reporte del mes
 */
async function monthlyReport(req, res) {
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const month = parseInt(req.query.month) || new Date().getMonth() + 1;

  const result = await pool.query(
    `SELECT
       COUNT(*) AS total_sessions,
       COALESCE(SUM(amount_paid), 0) AS total_revenue,
       COALESCE(SUM(duration_minutes), 0) AS total_minutes,
       COUNT(DISTINCT client_name) FILTER (WHERE client_name != '') AS unique_clients
     FROM sessions
     WHERE EXTRACT(YEAR FROM start_time) = $1
       AND EXTRACT(MONTH FROM start_time) = $2
       AND status = 'completed'`,
    [year, month]
  );

  // Ingresos por día del mes
  const dailyRevenue = await pool.query(
    `SELECT DATE(start_time) AS day,
            COUNT(*) AS sessions,
            COALESCE(SUM(amount_paid), 0) AS revenue
     FROM sessions
     WHERE EXTRACT(YEAR FROM start_time) = $1
       AND EXTRACT(MONTH FROM start_time) = $2
       AND status = 'completed'
     GROUP BY DATE(start_time)
     ORDER BY day`,
    [year, month]
  );

  res.json({
    year,
    month,
    stats: result.rows[0],
    daily_revenue: dailyRevenue.rows,
  });
}

/**
 * Estadísticas generales
 */
async function stats(req, res) {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM consoles) AS total_consoles,
      (SELECT COUNT(*) FROM consoles WHERE status = 'free') AS free_consoles,
      (SELECT COUNT(*) FROM consoles WHERE status = 'occupied') AS occupied_consoles,
      (SELECT COUNT(*) FROM consoles WHERE status = 'maintenance') AS maintenance_consoles,
      (SELECT COUNT(*) FROM sessions WHERE status = 'completed') AS total_sessions,
      (SELECT COUNT(*) FROM sessions WHERE status = 'active') AS active_sessions,
      COALESCE((SELECT SUM(amount_paid) FROM sessions WHERE status = 'completed'), 0) AS total_revenue,
      COALESCE((SELECT SUM(duration_minutes) FROM sessions WHERE status = 'completed'), 0) AS total_hours_sold,
      COALESCE((SELECT COUNT(DISTINCT client_name) FROM sessions WHERE client_name != ''), 0) AS total_clients
  `);

  res.json({ stats: result.rows[0] });
}

/**
 * Juegos más usados
 */
async function topGames(req, res) {
  const limit = parseInt(req.query.limit) || 10;

  const result = await pool.query(
    `SELECT g.id, g.name, COUNT(*) AS sessions_count,
            COALESCE(SUM(s.duration_minutes), 0) AS total_minutes
     FROM sessions s
     JOIN games g ON g.id = s.game_id
     WHERE s.status = 'completed'
     GROUP BY g.id, g.name
     ORDER BY sessions_count DESC
     LIMIT $1`,
    [limit]
  );

  res.json({ games: result.rows });
}

/**
 * Consolas más usadas
 */
async function topConsoles(req, res) {
  const limit = parseInt(req.query.limit) || 10;

  const result = await pool.query(
    `SELECT c.id, c.name, c.number, COUNT(*) AS sessions_count,
            COALESCE(SUM(s.duration_minutes), 0) AS total_minutes,
            COALESCE(SUM(s.amount_paid), 0) AS total_revenue
     FROM sessions s
     JOIN consoles c ON c.id = s.console_id
     WHERE s.status = 'completed'
     GROUP BY c.id, c.name, c.number
     ORDER BY sessions_count DESC
     LIMIT $1`,
    [limit]
  );

  res.json({ consoles: result.rows });
}

module.exports = { dailyReport, monthlyReport, stats, topGames, topConsoles };
