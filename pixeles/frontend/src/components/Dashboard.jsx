import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";
import { useSocket } from "../hooks/useSocket";
import ConsoleCard from "./ConsoleCard";
import SessionForm from "./SessionForm";
import "./Dashboard.css";

export default function Dashboard({ onStatsUpdate }) {
  const [consoles, setConsoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionForm, setSessionForm] = useState(null); // console object or null
  const { on } = useSocket();

  // Cargar consolas
  const loadConsoles = useCallback(async () => {
    try {
      const data = await api.getConsoles();
      setConsoles(data.consoles);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar stats para el header
  const loadStats = useCallback(async () => {
    try {
      const data = await api.getStats();
      if (onStatsUpdate) onStatsUpdate(data.stats);
    } catch {}
  }, [onStatsUpdate]);

  useEffect(() => {
    loadConsoles();
    loadStats();
  }, [loadConsoles, loadStats]);

  // Socket events
  useEffect(() => {
    const unsub1 = on("console:updated", (data) => {
      setConsoles((prev) =>
        prev.map((c) => (c.id === data.id ? { ...c, ...data } : c))
      );
      loadStats();
    });

    const unsub2 = on("session:started", (data) => {
      loadConsoles();
      loadStats();
    });

    const unsub3 = on("session:ended", (data) => {
      setConsoles((prev) =>
        prev.map((c) =>
          c.id === data.consoleId
            ? { ...c, ...data.console, remaining_ms: null }
            : c
        )
      );
      loadStats();
    });

    return () => {
      unsub1?.();
      unsub2?.();
      unsub3?.();
    };
  }, [on, loadConsoles, loadStats]);

  // Refrescar consolas cada 30s como fallback
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

  return (
    <div className="dashboard animate-fade-in">
      <div className="page-title">
        📊 Dashboard
        <button className="btn btn-ghost btn-sm" onClick={loadConsoles}>
          🔄 Refrescar
        </button>
      </div>

      {error && (
        <div className="dashboard-error">
          ⚠️ Error al cargar: {error}
          <button className="btn btn-sm btn-primary" onClick={loadConsoles}>
            Reintentar
          </button>
        </div>
      )}

      <div className="dashboard-grid">
        {consoles.map((console) => (
          <ConsoleCard
            key={console.id}
            console={console}
            onStart={() => setSessionForm(console)}
            onEnd={() => handleEndSession(console.id)}
            onMaintenance={() => handleToggleMaintenance(console.id)}
          />
        ))}
      </div>

      {consoles.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">🕹️</div>
          <div className="empty-state-text">
            No hay consolas configuradas. Agrega una desde la API.
          </div>
        </div>
      )}

      {/* Modal de inicio de sesión */}
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
