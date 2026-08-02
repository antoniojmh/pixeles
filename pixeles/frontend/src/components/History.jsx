import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";
import { formatDateTime, formatDuration } from "../utils/formatTime";
import "./History.css";

const STATUS_MAP = {
  completed: { label: "Completada", cls: "badge-free" },
  active: { label: "Activa", cls: "badge-occupied" },
  cancelled: { label: "Cancelada", cls: "badge-maintenance" },
};

const LIMIT = 50;

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: "", date_from: "", date_to: "" });

  const loadSessions = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const data = await api.getSessions({ ...filters, page: p, limit: LIMIT });
      setSessions(data.sessions || []);
      setTotal(data.pagination?.total || 0);
      setPage(data.pagination?.page || p);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadSessions(1);
  }, [loadSessions]);

  const totalPages = Math.ceil(total / LIMIT);
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="hist animate-fade-in">
      <div className="page-title">📋 Historial de Sesiones</div>

      {/* Filtros */}
      <div className="hist-filters">
        <div className="form-group">
          <label className="form-label">Estado</label>
          <select
            className="form-select"
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
          >
            <option value="">Todos</option>
            <option value="active">Activas</option>
            <option value="completed">Completadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Desde</label>
          <input
            type="date"
            className="form-input"
            value={filters.date_from}
            max={today}
            onChange={(e) => setFilters((p) => ({ ...p, date_from: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Hasta</label>
          <input
            type="date"
            className="form-input"
            value={filters.date_to}
            max={today}
            onChange={(e) => setFilters((p) => ({ ...p, date_to: e.target.value }))}
          />
        </div>
        <div className="hist-filter-btns">
          <button className="btn btn-primary" onClick={() => loadSessions(1)}>
            🔍 Buscar
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setFilters({ status: "", date_from: "", date_to: "" });
            }}
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="hist-table-wrap">
        {error && <div className="hist-error">⚠️ {error}</div>}

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-text">No hay sesiones registradas</div>
          </div>
        ) : (
          <>
            <table className="hist-table">
              <thead>
                <tr>
                  <th>Consola</th>
                  <th>Juego</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Duración</th>
                  <th>Cliente</th>
                  <th className="hist-col-amount">Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const st = STATUS_MAP[s.status] || STATUS_MAP.completed;
                  return (
                    <tr key={s.id}>
                      <td>
                        <span className="hist-console">
                          #{s.console_number} {s.console_name}
                        </span>
                      </td>
                      <td>{s.game_name || "—"}</td>
                      <td className="hist-time">
                        {new Date(s.start_time).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="hist-time">
                        {s.end_time
                          ? new Date(s.end_time).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </td>
                      <td>
                        <span className="hist-duration">{formatDuration(s.duration_minutes)}</span>
                      </td>
                      <td>{s.client_name || "—"}</td>
                      <td className="hist-amount">Q{parseFloat(s.amount_paid || 0).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${st.cls}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="hist-pagination">
                <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => loadSessions(page - 1)}>
                  ← Anterior
                </button>
                <span className="hist-page">Página {page} de {totalPages} ({total} registros)</span>
                <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => loadSessions(page + 1)}>
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
