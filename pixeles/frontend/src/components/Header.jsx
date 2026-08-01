import { useState, useEffect } from "react";
import { formatDate } from "../utils/formatTime";
import "./Header.css";

export default function Header({ stats }) {
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <span className="header-logo">🔥 PIXELES</span>
        <span className="header-date">{formatDate(clock.toISOString())}</span>
      </div>

      <div className="header-center">
        {stats && (
          <div className="header-stats">
            <div className="header-stat">
              <span className="header-stat-value">{stats.active_sessions ?? 0}</span>
              <span className="header-stat-label">Activas</span>
            </div>
            <div className="header-stat">
              <span className="header-stat-value" style={{ color: "var(--success)" }}>
                {stats.free_consoles ?? 0}
              </span>
              <span className="header-stat-label">Libres</span>
            </div>
            <div className="header-stat">
                <span className="header-stat-value header-stat-revenue">
                  Q{parseFloat(stats.total_revenue || 0).toFixed(2)}</span>
              <span className="header-stat-label">Total</span>
            </div>
          </div>
        )}
      </div>

      <div className="header-right">
        <span className="header-clock">
          {clock.toLocaleTimeString("es-GT", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })}
        </span>
      </div>
    </header>
  );
}
