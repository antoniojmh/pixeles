const { pool } = require("../config/database");
const socketService = require("./socketService");

/**
 * TimerService - Gestiona temporizadores de sesiones activas
 * Soporta: track, remove, pause, resume, addTime, getRemaining, alertas 10/5/1min, auto-end
 */
class TimerService {
  constructor() {
    this.activeTimers = new Map(); // consoleId → { sessionId, endTime, alertSent10, alertSent5, alertSent1, timeUpSent, paused }
    this.interval = null;
  }

  async init() {
    try {
      const result = await pool.query(`
        SELECT s.id, s.console_id, s.end_time, s.status
        FROM sessions s WHERE s.status IN ('active','paused')
      `);
      const now = Date.now();
      for (const s of result.rows) {
        this.activeTimers.set(s.console_id, {
          sessionId: s.id,
          endTime: new Date(s.end_time).getTime(),
          alertSent10: false, alertSent5: false, alertSent1: false,
          timeUpSent: false,
          paused: s.status === "paused",
          pausedAt: s.status === "paused" ? now : null,
        });
      }
      console.log(`[Timer] ${this.activeTimers.size} sesiones cargadas ✅`);
    } catch (err) {
      console.error("[Timer] Error cargando sesiones:", err.message);
    }
    this.interval = setInterval(() => this.check(), 10000);
    console.log("[Timer] Servicio iniciado ✅");
  }

  trackSession(session, consoleId) {
    this.activeTimers.set(consoleId, {
      sessionId: session.id,
      endTime: new Date(session.end_time).getTime(),
      alertSent10: false, alertSent5: false, alertSent1: false,
      timeUpSent: false,
      paused: false, pausedAt: null,
    });
  }

  removeTimer(consoleId) {
    this.activeTimers.delete(consoleId);
  }

  /** Pausar: congela el countdown */
  pauseTimer(consoleId) {
    const t = this.activeTimers.get(consoleId);
    if (t) { t.paused = true; t.pausedAt = Date.now(); }
  }

  /** Reanudar: extiende endTime por el tiempo pausado */
  resumeTimer(consoleId, pausedMs = 0) {
    const t = this.activeTimers.get(consoleId);
    if (t) {
      t.endTime += pausedMs;
      t.paused = false;
      t.pausedAt = null;
      t.alertSent10 = false; t.alertSent5 = false; t.alertSent1 = false;
      t.timeUpSent = false;
    }
  }

  /** Agregar tiempo: extiende endTime por ms */
  addTime(consoleId, ms) {
    const t = this.activeTimers.get(consoleId);
    if (t) t.endTime += ms;
  }

  getRemaining(consoleId) {
    const t = this.activeTimers.get(consoleId);
    if (!t) return null;
    if (t.paused) return Math.max(0, t.endTime - (t.pausedAt || Date.now()));
    return Math.max(0, t.endTime - Date.now());
  }

  async check() {
    const now = Date.now();
    for (const [consoleId, timer] of this.activeTimers) {
      if (timer.paused) continue;
      const remaining = timer.endTime - now;
      const minLeft = remaining / 60000;

      // Time up
      if (remaining <= 0 && !timer.timeUpSent) {
        timer.timeUpSent = true;
        socketService.emitTimeUp({ consoleId, sessionId: timer.sessionId });
        await this.autoEndSession(timer.sessionId, consoleId);
      }
      // Alertas progresivas
      else if (minLeft <= 1 && !timer.alertSent1) {
        timer.alertSent1 = true;
        socketService.emitTimeAlert({ consoleId, sessionId: timer.sessionId, remaining, level: 1 });
      }
      else if (minLeft <= 5 && !timer.alertSent5) {
        timer.alertSent5 = true;
        socketService.emitTimeAlert({ consoleId, sessionId: timer.sessionId, remaining, level: 5 });
      }
      else if (minLeft <= 10 && !timer.alertSent10) {
        timer.alertSent10 = true;
        socketService.emitTimeAlert({ consoleId, sessionId: timer.sessionId, remaining, level: 10 });
      }
    }
  }

  async autoEndSession(sessionId, consoleId) {
    try {
      await pool.query("BEGIN");
      await pool.query(
        "UPDATE sessions SET status='completed', end_time=NOW() WHERE id=$1 AND status='active'",
        [sessionId]
      );
      const r = await pool.query(
        `UPDATE consoles SET status='free', current_session_id=NULL, current_game_id=NULL
         WHERE id=$1 AND status='occupied' RETURNING *`, [consoleId]
      );
      await pool.query("COMMIT");
      this.removeTimer(consoleId);
      if (r.rows.length > 0) {
        socketService.emitSessionEnded({ sessionId, consoleId, console: r.rows[0] });
      }
    } catch (err) {
      await pool.query("ROLLBACK").catch(() => {});
      console.error("[Timer] Error auto-ending:", err.message);
    }
  }

  destroy() {
    if (this.interval) { clearInterval(this.interval); this.interval = null; }
    this.activeTimers.clear();
    console.log("[Timer] Servicio detenido");
  }
}

module.exports = new TimerService();
