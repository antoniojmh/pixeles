const { pool } = require("../config/database");
const socketService = require("./socketService");

/**
 * TimerService - Gestiona los temporizadores de sesiones activas
 *
 * Mantiene un mapa en memoria de sesiones activas con sus tiempos de finalización.
 * Cada 10 segundos verifica si alguna sesión está por terminar (alerta 5 min)
 * o si ya terminó (time up + auto finalización).
 */
class TimerService {
  constructor() {
    this.activeTimers = new Map();
    this.interval = null;
    this.isRunning = false;
  }

  /**
   * Inicializar: carga sesiones activas desde DB y arranca el verificador
   */
  async init() {
    try {
      const result = await pool.query(`
        SELECT s.id, s.console_id, s.start_time, s.end_time, s.duration_minutes,
               c.name AS console_name, c.number AS console_number
        FROM sessions s
        JOIN consoles c ON c.id = s.console_id
        WHERE s.status = 'active'
      `);

      const now = Date.now();
      for (const session of result.rows) {
        const endTime = new Date(session.end_time).getTime();
        if (endTime > now) {
          this.activeTimers.set(session.console_id, {
            sessionId: session.id,
            endTime,
            alertSent: false,
            timeUpSent: false,
          });
        }
      }

      console.log(`[Timer] ${this.activeTimers.size} sesiones activas cargadas ✅`);
    } catch (err) {
      console.error("[Timer] Error cargando sesiones activas:", err.message);
    }

    // Verificar cada 10 segundos
    this.interval = setInterval(() => this.check(), 10000);
    this.isRunning = true;
    console.log("[Timer] Servicio iniciado ✅");
  }

  /**
   * Registrar una nueva sesión activa
   */
  trackSession(session, consoleId) {
    const endTime = new Date(session.end_time).getTime();
    this.activeTimers.set(consoleId, {
      sessionId: session.id,
      endTime,
      alertSent: false,
      timeUpSent: false,
    });
  }

  /**
   * Remover temporizador (sesión finalizada manualmente)
   */
  removeTimer(consoleId) {
    this.activeTimers.delete(consoleId);
  }

  /**
   * Obtener tiempo restante en ms para una consola
   */
  getRemaining(consoleId) {
    const timer = this.activeTimers.get(consoleId);
    if (!timer) return null;
    return Math.max(0, timer.endTime - Date.now());
  }

  /**
   * Verificación periódica de temporizadores
   */
  async check() {
    const now = Date.now();
    const alertMinutes = 5;
    const alertMs = alertMinutes * 60 * 1000;

    for (const [consoleId, timer] of this.activeTimers) {
      const remaining = timer.endTime - now;

      // Tiempo terminado
      if (remaining <= 0 && !timer.timeUpSent) {
        timer.timeUpSent = true;
        console.log(`[Timer] ⏰ Time up: consola ${consoleId}`);
        socketService.emitTimeUp({ consoleId, sessionId: timer.sessionId });
        await this.autoEndSession(timer.sessionId, consoleId);
      }
      // Alerta de 5 minutos
      else if (remaining <= alertMs && remaining > 0 && !timer.alertSent) {
        timer.alertSent = true;
        console.log(`[Timer] ⚠️ Alerta 5min: consola ${consoleId}`);
        socketService.emitTimeAlert({
          consoleId,
          sessionId: timer.sessionId,
          remaining,
        });
      }
    }
  }

  /**
   * Auto-finalizar sesión vencida
   */
  async autoEndSession(sessionId, consoleId) {
    try {
      await pool.query("BEGIN");

      await pool.query(
        `UPDATE sessions SET status = 'completed', end_time = NOW()
         WHERE id = $1 AND status = 'active'`,
        [sessionId]
      );

      const updateResult = await pool.query(
        `UPDATE consoles SET status = 'free', current_session_id = NULL, current_game_id = NULL
         WHERE id = $1 AND status = 'occupied'
         RETURNING *`,
        [consoleId]
      );

      await pool.query("COMMIT");

      this.removeTimer(consoleId);

      if (updateResult.rows.length > 0) {
        socketService.emitSessionEnded({
          sessionId,
          consoleId,
          console: updateResult.rows[0],
        });
      }
    } catch (err) {
      await pool.query("ROLLBACK").catch(() => {});
      console.error("[Timer] Error auto-ending session:", err.message);
    }
  }

  /**
   * Detener el servicio
   */
  destroy() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    this.activeTimers.clear();
    console.log("[Timer] Servicio detenido");
  }
}

module.exports = new TimerService();
