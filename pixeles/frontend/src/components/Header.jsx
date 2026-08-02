import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "./Header.css";

export default function Header({ stats }) {
  const { user } = useAuth();
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="hd">
      <div className="hd-left">
        <div className="hd-brand">
          <span className="hd-logo">🔥</span>
          <span className="hd-name">PIXELES</span>
        </div>
        <span className="hd-subsystem">Centro de Videojuegos</span>
      </div>

      <div className="hd-center">
        {stats && (
          <div className="hd-stats">
            <div className="hd-stat">
              <span className="hd-stat-v">{stats.active_sessions ?? 0}</span>
              <span className="hd-stat-l">Activas</span>
            </div>
            <div className="hd-stat">
              <span className="hd-stat-v hd-stat-free">{stats.free_consoles ?? 0}</span>
              <span className="hd-stat-l">Libres</span>
            </div>
            <div className="hd-stat">
              <span className="hd-stat-v hd-stat-money">
                Q{parseFloat(stats.total_revenue || 0).toFixed(2)}
              </span>
              <span className="hd-stat-l">Total</span>
            </div>
          </div>
        )}
      </div>

      <div className="hd-right">
        <span className="hd-clock">
          {clock.toLocaleTimeString("es-GT", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })}
        </span>
        {user && (
          <div className="hd-user">
            <span className="hd-user-avatar">{user.username?.charAt(0).toUpperCase()}</span>
            <span className="hd-user-name">{user.username}</span>
          </div>
        )}
      </div>
    </header>
  );
}
