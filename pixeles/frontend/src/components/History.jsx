import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";
import { formatDateTime, formatDuration } from "../utils/formatTime";
import "./History.css";

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({
    status: "",
    date_from: "",
    date_to: "",
  });

  const loadSessions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await api.getSessions({ ...filters, page, limit: 50 });
      setSessions(data.sessions);
      setPagination(data.pagination);
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

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Obtener fecha de hoy para placeholder
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="history animate-fade-in">
      <div className="page-title">
        📋 Historial de Sesiones
      </div>

      {/* Filtros */}
      <div className="history-filters section">
        <div className="section-title">Filtros</div>
        <div className="history-filters-grid">
          <div className="form-group">
            <label className="form-label">Estado</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
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
              onChange={(e) => handleFilterChange("date_from", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Hasta</label>
            <input
              type="date"
              className="form-input"
              value={filters.date_to}
              max={today}
              onChange={(e) => handleFilterChange("date_to", e.target.value)}
            />
          </div>

          <div className="form-group history-filter-actions">
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
      </div>

      {/* Tabla */}
      <div className="section">
        <div className="section-title">
          {loading ? "Cargando..." : `${pagination.total} sesiones encontradas`}
        </div>

        {error && <div className="history-error">⚠️ {error}</div>}

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-text">No hay sesiones registradas</div>
          </div>
        ) : (
          <>
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Consola</th>
                    <th>Juego</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Duración</th>
                    <th>Cliente</th>
                    <th>Monto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id}>
                      <td>{formatDateTime(s.start_time)}</td>
                      <td>
                        <span className="badge badge-occupied">
                          {s.console_name} #{s.console_number}
                        </span>
                      </td>
                      <td>{s.game_name || "—"}</td>
                      <td>{new Date(s.start_time).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}</td>
                      <td>
                        {s.end_time
                          ? new Date(s.end_time).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </td>
                      <td>{formatDuration(s.duration_minutes)}</td>
                      <td>{s.client_name || "—"}</td>
                      <td className="history-amount">Q{parseFloat(s.amount_paid || 0).toFixed(2)}</td>
                      <td>
                        <span className={`badge badge-${s.status === "completed" ? "free" : s.status === "active" ? "occupied" : "maintenance"}`}>
                          {s.status === "completed" ? "Completada" : s.status === "active" ? "Activa" : "Cancelada"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="history-pagination">
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={pagination.page <= 1}
                  onClick={() => loadSessions(pagination.page - 1)}
                >
                  ← Anterior
                </button>
                <span className="history-page-info">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadSessions(pagination.page + 1)}
                >
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
