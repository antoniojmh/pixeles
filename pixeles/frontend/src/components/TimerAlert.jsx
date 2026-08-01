import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "../hooks/useSocket";
import "./TimerAlert.css";

/**
 * Alerta global de temporizador
 *
 * Escucha eventos de socket:
 * - alert:5min → notificación de 5 minutos
 * - alert:timeup → pantalla roja de tiempo terminado
 *
 * Reproduce sonido usando Web Audio API
 */
export default function TimerAlert() {
  const [alerts, setAlerts] = useState([]); // { id, type: 'warning'|'timeup', consoleId, message, timestamp }
  const audioCtxRef = useRef(null);
  const { on } = useSocket();
  const idCounter = useRef(0);

  // Inicializar AudioContext (requiere interacción del usuario)
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  // Reproducir sonido
  const playBeep = useCallback(
    (frequency = 880, duration = 0.3, repeat = 1) => {
      try {
        const ctx = getAudioContext();
        for (let i = 0; i < repeat; i++) {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = frequency;
            osc.type = "square";
            gain.gain.value = 0.15;
            gain.gain.exponentialRampToValueAtTime(
              0.001,
              ctx.currentTime + duration
            );
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration);
          }, i * (duration * 1000 + 200));
        }
      } catch {}
    },
    [getAudioContext]
  );

  // Escuchar eventos de socket
  useEffect(() => {
    const unsub1 = on("alert:5min", (data) => {
      const id = ++idCounter.current;
      setAlerts((prev) => [
        ...prev,
        {
          id,
          type: "warning",
          consoleId: data.consoleId,
          message: `Consola #${data.consoleId} — ⏰ ¡5 minutos restantes!`,
          timestamp: Date.now(),
        },
      ]);
      playBeep(660, 0.2, 3);
      // Auto-remove after 8 seconds
      setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      }, 8000);
    });

    const unsub2 = on("alert:timeup", (data) => {
      const id = ++idCounter.current;
      setAlerts((prev) => [
        ...prev,
        {
          id,
          type: "timeup",
          consoleId: data.consoleId,
          message: `⏰ ¡TIEMPO TERMINADO! — Consola #${data.consoleId}`,
          timestamp: Date.now(),
        },
      ]);
      playBeep(440, 0.3, 5);
      // Auto-remove after 12 seconds
      setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      }, 12000);
    });

    return () => {
      unsub1?.();
      unsub2?.();
    };
  }, [on, playBeep]);

  // Eliminar alerta manualmente
  const dismissAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <>
      {/* Alertas tipo toast (warning) */}
      {alerts
        .filter((a) => a.type === "warning")
        .map((alert) => (
          <div key={alert.id} className="alert-toast alert-toast-warning animate-slide-up">
            <div className="alert-toast-content">
              <span className="alert-toast-icon">⚠️</span>
              <span className="alert-toast-text">{alert.message}</span>
            </div>
            <button className="alert-toast-close" onClick={() => dismissAlert(alert.id)}>
              ✕
            </button>
            <div className="alert-toast-progress" />
          </div>
        ))}

      {/* Pantalla de tiempo terminado (timeup) - overlay fullscreen rojo */}
      {alerts
        .filter((a) => a.type === "timeup")
        .map((alert) => (
          <div key={alert.id} className="timeup-overlay animate-fade-in" onClick={() => dismissAlert(alert.id)}>
            <div className="timeup-content" onClick={(e) => e.stopPropagation()}>
              <div className="timeup-icon">⏰</div>
              <div className="timeup-title">¡TIEMPO TERMINADO!</div>
              <div className="timeup-console">Consola #{alert.consoleId}</div>
              <button className="timeup-dismiss btn btn-lg btn-primary" onClick={() => dismissAlert(alert.id)}>
                OK ✓
              </button>
            </div>
          </div>
        ))}
    </>
  );
}
