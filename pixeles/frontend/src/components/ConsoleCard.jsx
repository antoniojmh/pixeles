import { useState } from "react";
import { useTimer } from "../hooks/useTimer";
import { STATUS_LABELS } from "../utils/constants";
import { formatDuration } from "../utils/formatTime";
import "./ConsoleCard.css";

export default function ConsoleCard({
  console,
  onStart,
  onEnd,
  onPause,
  onResume,
  onAddTime,
  onMaintenance,
}) {
  const { formatted, isTimeUp, isNearEnd, progress, isPaused } = useTimer(
    console.session_end,
    console.session_start,
    console.duration_minutes,
    console._paused
  );
  const [showAddTime, setShowAddTime] = useState(false);

  const label = STATUS_LABELS[console.status] || "Desconocido";

  const statusEmoji = {
    free: "⚪",
    occupied: isPaused ? "⏸️" : "🟢",
    reserved: "🟡",
    maintenance: "🔴",
  };

  return (
    <div
      className={`cs-card cs-${console.status} ${isTimeUp ? "cs-timeup" : ""} ${isNearEnd ? "cs-near-end" : ""}`}
    >
      {/* Glow decorativo */}
      <div className="cs-glow" />

      {/* Header */}
      <div className="cs-header">
        <div className="cs-title">
          <span className="cs-number">#{console.number}</span>
          <span className="cs-name">{console.name}</span>
        </div>
        <span className={`badge badge-${console.status}`}>
          {statusEmoji[console.status] || "⚪"} {label}
        </span>
      </div>

      {/* Timer — solo cuando está ocupado */}
      {console.status === "occupied" && (
        <div className="cs-timer-section">
          <div className={`cs-timer ${isTimeUp ? "t-up" : isNearEnd ? "t-warn" : ""} ${isPaused ? "t-paused" : ""}`}>
            <span className="cs-time">{formatted}</span>
            {console.duration_minutes && (
              <span className="cs-duration">
                / {formatDuration(console.duration_minutes)}
              </span>
            )}
          </div>

          {/* Barra de progreso */}
          <div className="cs-progress-wrap">
            <div
              className="cs-progress"
              style={{
                width: `${Math.min(100, progress)}%`,
                background: isNearEnd
                  ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                  : "linear-gradient(90deg, var(--accent), var(--accent-light))",
              }}
            />
          </div>

          {/* Info de sesión */}
          <div className="cs-session-info">
            {console.game_name && (
              <span className="cs-game">🎮 {console.game_name}</span>
            )}
            {console.client_name && (
              <span className="cs-client">👤 {console.client_name}</span>
            )}
          </div>
        </div>
      )}

      {/* Cuerpo vacío para libres */}
      {console.status === "free" && (
        <div className="cs-free-body">
          <span className="cs-free-icon">🎮</span>
          <span className="cs-free-text">Disponible</span>
        </div>
      )}

      {console.status === "reserved" && (
        <div className="cs-reserved-body">
          <span className="cs-free-icon">⏳</span>
          <span className="cs-free-text">Reservada</span>
          {console.client_name && (
            <span className="cs-client">👤 {console.client_name}</span>
          )}
        </div>
      )}

      {console.status === "maintenance" && (
        <div className="cs-maint-body">
          <span className="cs-free-icon">🔧</span>
          <span className="cs-free-text">En mantenimiento</span>
        </div>
      )}

      {/* Acciones */}
      <div className="cs-actions">
        {console.status === "free" && (
          <button className="btn btn-success cs-btn-main" onClick={onStart}>
            ▶ Iniciar sesión
          </button>
        )}

        {console.status === "occupied" && (
          <>
            {!isPaused ? (
              <button className="btn cs-btn-pause" onClick={onPause}>
                ⏸ Pausar
              </button>
            ) : (
              <button className="btn cs-btn-resume" onClick={onResume}>
                ▶ Reanudar
              </button>
            )}
            <button className="btn cs-btn-time" onClick={() => setShowAddTime(!showAddTime)}>
              ⏱ +Tiempo
            </button>
            <button className="btn btn-danger cs-btn-end" onClick={onEnd}>
              ⏹ Finalizar
            </button>
          </>
        )}

        {showAddTime && (
          <div className="cs-addtime">
            {[15, 30, 60].map((mins) => (
              <button
                key={mins}
                className="cs-addtime-btn"
                onClick={() => {
                  onAddTime(mins);
                  setShowAddTime(false);
                }}
              >
                +{mins} min
              </button>
            ))}
          </div>
        )}

        {console.status !== "occupied" && (
          <button
            className={`btn cs-btn-maint ${
              console.status === "maintenance" ? "btn-success" : "btn-ghost"
            }`}
            onClick={onMaintenance}
          >
            {console.status === "maintenance" ? "✅ Habilitar" : "🔧 Mantenimiento"}
          </button>
        )}
      </div>
    </div>
  );
}
