import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";
import { useSocket } from "../hooks/useSocket";
import ConsoleCard from "./ConsoleCard";
import SessionForm from "./SessionForm";
import "./Dashboard.css";

export default function Dashboard({ onStatsUpdate }) {
  const [consoles, setConsoles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionForm, setSessionForm] = useState(null);
  const { on } = useSocket();

  const loadConsoles = useCallback(async () => {
    try {
      const data = await api.getConsoles();
      setConsoles(data.consoles || data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await api.getStats();
      const s = data.stats || data;
      setStats(s);
      if (onStatsUpdate) onStatsUpdate(s);
    } catch {}
  }, [onStatsUpdate]);

  useEffect(() => {
    loadConsoles();
    loadStats();
  }, [loadConsoles, loadStats]);

  useEffect(() => {
    const unsub1 = on("console:updated", (data) => {
      setConsoles((prev) =>
        prev.map((c) => (c.id === data.id ? { ...c, ...data } : c))
      );
      loadStats();
    });
    const unsub2 = on("session:started", () => { loadConsoles(); loadStats(); });
    const unsub3 = on("session:ended", (data) => {
      setConsoles((prev) =>
        prev.map((c) =>
          c.id === data.consoleId
            ? { ...c, ...data.console, remaining_ms: null, session_end: null, session_start: null }
            : c
        )
      );
      loadStats();
    });
    return () => { unsub1?.(); unsub2?.(); unsub3?.(); };
  }, [on, loadConsoles, loadStats]);

  useEffect(() => {
    const interval = setInterval(loadConsoles, 30000);
    return () => clearInterval(interval);
  }, [loadConsoles]);

  const handleStartSession = async (consoleId, data) => {
    try {
      await api.startSession(consoleId, data);
      setSessionForm(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEndSession = async (consoleId) => {
    try {
      await api.endSession(consoleId);
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePauseSession = async (consoleId) => {
    try {
      await api.pauseSession(consoleId);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResumeSession = async (consoleId) => {
    try {
      await api.resumeSession(consoleId);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddTime = async (consoleId, minutes) => {
    try {
      await api.addTime(consoleId, minutes);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleMaintenance = async (consoleId) => {
    try {
      await api.toggleMaintenance(consoleId);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  // Computar stats
  const total = consoles.length;
  const active = consoles.filter((c) => c.status === "occupied").length;
  const free = consoles.filter((c) => c.status === "free").length;
  const maint = consoles.filter((c) => c.status === "maintenance").length;

  return (
    <div className="dashboard animate-fade-in">
      {/* Stats row */}
      <div className="dash-stats-row">
        <div className="dash-stat">
          <div className="dash-stat-icon">🕹️</div>
          <div className="dash-stat-info">
            <div className="dash-stat-value">{total}</div>
            <div className="dash-stat-label">Total</div>
          </div>
        </div>
        <div className="dash-stat dash-stat-active">
          <div className="dash-stat-icon">🟢</div>
          <div className="dash-stat-info">
            <div className="dash-stat-value">{active}</div>
            <div className="dash-stat-label">En juego</div>
          </div>
        </div>
        <div className="dash-stat dash-stat-free">
          <div className="dash-stat-icon">⚪</div>
          <div className="dash-stat-info">
            <div className="dash-stat-value">{free}</div>
            <div className="dash-stat-label">Libres</div>
          </div>
        </div>
        <div className="dash-stat dash-stat-maint">
          <div className="dash-stat-icon">🔧</div>
          <div className="dash-stat-info">
            <div className="dash-stat-value">{maint}</div>
            <div className="dash-stat-label">Mantenimiento</div>
          </div>
        </div>
        {stats?.todayRevenue !== undefined && (
          <div className="dash-stat dash-stat-money">
            <div className="dash-stat-icon">💰</div>
            <div className="dash-stat-info">
              <div className="dash-stat-value">
                Q{parseFloat(stats.todayRevenue || 0).toFixed(2)}
              </div>
              <div className="dash-stat-label">Hoy</div>
            </div>
          </div>
        )}
        {stats?.todaySessions !== undefined && (
          <div className="dash-stat dash-stat-sessions">
            <div className="dash-stat-icon">🎮</div>
            <div className="dash-stat-info">
              <div className="dash-stat-value">{stats.todaySessions || 0}</div>
              <div className="dash-stat-label">Sesiones hoy</div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="dashboard-error">
          ⚠️ Error al cargar: {error}
          <button className="btn btn-sm btn-primary" onClick={loadConsoles}>
            Reintentar
          </button>
        </div>
      )}

      {/* Grid de consolas */}
      <div className="dashboard-grid">
        {consoles.map((c) => (
          <ConsoleCard
            key={c.id}
            console={c}
            onStart={() => setSessionForm(c)}
            onEnd={() => handleEndSession(c.id)}
            onPause={() => handlePauseSession(c.id)}
            onResume={() => handleResumeSession(c.id)}
            onAddTime={(mins) => handleAddTime(c.id, mins)}
            onMaintenance={() => handleToggleMaintenance(c.id)}
          />
        ))}
      </div>

      {consoles.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">🕹️</div>
          <div className="empty-state-text">
            No hay consolas configuradas
          </div>
        </div>
      )}

      {sessionForm && (
        <SessionForm
          console={sessionForm}
          onClose={() => setSessionForm(null)}
          onStart={(data) => handleStartSession(sessionForm.id, data)}
        />
      )}
    </div>
  );
}
