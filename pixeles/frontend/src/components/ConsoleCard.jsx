import { useTimer } from "../hooks/useTimer";
import { STATUS_LABELS, STATUS_COLORS } from "../utils/constants";
import { formatDuration } from "../utils/formatTime";
import "./ConsoleCard.css";

export default function ConsoleCard({ console, onStart, onEnd, onMaintenance }) {
  const { formatted, isTimeUp, isNearEnd, progress } = useTimer(
    console.session_end,
    console.session_start,
    console.duration_minutes
  );

  const colors = STATUS_COLORS[console.status] || STATUS_COLORS.free;
  const label = STATUS_LABELS[console.status] || "Desconocido";

  return (
    <div
      className={`console-card console-card-${console.status} animate-slide-up`}
      style={{ "--status-color": colors.border, "--status-bg": colors.bg }}
    >
      {/* Header */}
      <div className="console-card-header">
        <div className="console-card-title">
          <span className="console-card-number">#{console.number}</span>
          <span className="console-card-name">{console.name}</span>
        </div>
        <span className={`badge badge-${console.status}`}>
          {console.status === "occupied" && "🟢"}
          {console.status === "free" && "⚪"}
          {console.status === "reserved" && "🟡"}
          {console.status === "maintenance" && "🔴"}
          {label}
        </span>
      </div>

      {/* Cuerpo */}
      <div className="console-card-body">
        {/* Juego actual */}
        {console.status === "occupied" && console.game_name && (
          <div className="console-card-game">
            <span className="console-card-game-icon">🎮</span>
            <span className="console-card-game-name">{console.game_name}</span>
          </div>
        )}

        {/* Temporizador */}
        {console.status === "occupied" && (
          <div
            className={`console-card-timer ${
              isTimeUp ? "timer-timeup" : isNearEnd ? "timer-warning" : ""
            }`}
          >
            <span className="console-card-time">{formatted}</span>
            {console.duration_minutes && (
              <span className="console-card-duration">
                / {formatDuration(console.duration_minutes)}
              </span>
            )}
          </div>
        )}

        {/* Barra de progreso */}
        {console.status === "occupied" && !isTimeUp && (
          <div className="console-card-progress">
            <div
              className="console-card-progress-bar"
              style={{
                width: `${Math.min(100, progress)}%`,
                background: isNearEnd
                  ? "var(--warning)"
                  : "var(--accent)",
              }}
            />
          </div>
        )}

        {/* Cliente */}
        {console.status === "occupied" && console.client_name && (
          <div className="console-card-client">
            👤 {console.client_name}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="console-card-actions">
        {console.status === "free" && (
          <button className="btn btn-success btn-sm console-card-btn" onClick={onStart}>
            ▶ Iniciar
          </button>
        )}

        {console.status === "occupied" && (
          <button className="btn btn-danger btn-sm console-card-btn" onClick={onEnd}>
            ⏹ Finalizar
          </button>
        )}

        {console.status === "reserved" && (
          <span className="console-card-waiting">⏳ Esperando...</span>
        )}

        {console.status !== "occupied" && (
          <button
            className={`btn btn-sm console-card-btn ${
              console.status === "maintenance" ? "btn-success" : "btn-ghost"
            }`}
            onClick={onMaintenance}
          >
            {console.status === "maintenance" ? "✅ Activar" : "🔧 Manten"}
          </button>
        )}
      </div>
    </div>
  );
}
