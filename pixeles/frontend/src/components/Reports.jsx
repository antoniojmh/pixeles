import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";
import { formatDuration } from "../utils/formatTime";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import "./Reports.css";

const COLORS = [
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [daily, setDaily] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [topGames, setTopGames] = useState([]);
  const [topConsoles, setTopConsoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const [statsData, dailyData, monthlyData, gamesData, consolesData] =
        await Promise.all([
          api.getStats(),
          api.getDailyReport(today),
          api.getMonthlyReport(year, month),
          api.getTopGames(8),
          api.getTopConsoles(8),
        ]);

      setStats(statsData.stats);
      setDaily(dailyData);
      setMonthly(monthlyData);
      setTopGames(gamesData.games);
      setTopConsoles(consolesData.consoles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading) {
    return (
      <div className="reports animate-fade-in">
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  // Preparar datos para gráficos
  const dailyChartData = (daily?.by_console || []).map((c) => ({
    name: `${c.name} #${c.number}`,
    sesiones: parseInt(c.sessions),
    ingresos: parseFloat(c.revenue),
  }));

  const monthlyChartData = (monthly?.daily_revenue || []).map((d) => ({
    day: new Date(d.day).getDate().toString(),
    sesiones: parseInt(d.sessions),
    ingresos: parseFloat(d.revenue),
  }));

  const gamesChartData = topGames.map((g) => ({
    name: g.name,
    value: parseInt(g.sessions_count),
  }));

  const consolesChartData = topConsoles.map((c) => ({
    name: `${c.name} #${c.number}`,
    value: parseInt(c.sessions_count),
  }));

  return (
    <div className="reports animate-fade-in">
      <div className="page-title">
        📈 Reportes
        <button className="btn btn-ghost btn-sm" onClick={loadAll}>
          🔄 Refrescar
        </button>
      </div>

      {error && (
        <div className="reports-error">
          ⚠️ {error}
          <button className="btn btn-sm btn-primary" onClick={loadAll}>
            Reintentar
          </button>
        </div>
      )}

      {/* KPI Cards */}
      {stats && (
        <div className="reports-kpi-grid">
          <div className="report-kpi">
            <div className="report-kpi-icon">💰</div>
            <div className="report-kpi-value">
              Q{parseFloat(stats.total_revenue).toFixed(2)}
            </div>
            <div className="report-kpi-label">Ingresos Totales</div>
          </div>
          <div className="report-kpi">
            <div className="report-kpi-icon">🕐</div>
            <div className="report-kpi-value">
              {formatDuration(parseInt(stats.total_hours_sold))}
            </div>
            <div className="report-kpi-label">Horas Vendidas</div>
          </div>
          <div className="report-kpi">
            <div className="report-kpi-icon">🎮</div>
            <div className="report-kpi-value">{stats.total_sessions}</div>
            <div className="report-kpi-label">Sesiones Totales</div>
          </div>
          <div className="report-kpi">
            <div className="report-kpi-icon">👥</div>
            <div className="report-kpi-value">{stats.total_clients}</div>
            <div className="report-kpi-label">Clientes Atendidos</div>
          </div>
        </div>
      )}

      {/* Sección de dos columnas */}
      <div className="reports-grid-2">
        {/* Ingresos del día por consola */}
        <div className="section">
          <div className="section-title">📊 Ingresos del Día por Consola</div>
          {dailyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  stroke="var(--text-muted)"
                  fontSize={11}
                />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                  }}
                />
                <Bar dataKey="ingresos" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-state-text">Sin datos del día</div>
            </div>
          )}
        </div>

        {/* Ingresos del mes */}
        <div className="section">
          <div className="section-title">📈 Ingresos del Mes</div>
          {monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                  }}
                />
                <Bar dataKey="ingresos" fill="var(--success)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-state-text">Sin datos del mes</div>
            </div>
          )}
        </div>
      </div>

      {/* Juegos más usados */}
      <div className="section">
        <div className="section-title">🎮 Juegos Más Populares</div>
        {gamesChartData.length > 0 ? (
          <div className="reports-chart-pie">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gamesChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {gamesChartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-text">Sin datos de juegos</div>
          </div>
        )}
      </div>

      {/* Resumen diario */}
      {daily && (
        <div className="section">
          <div className="section-title">📋 Resumen del Día</div>
          <div className="reports-summary-grid">
            <div className="report-summary-item">
              <span className="report-summary-label">Sesiones hoy</span>
              <span className="report-summary-value">{daily.stats.total_sessions}</span>
            </div>
            <div className="report-summary-item">
              <span className="report-summary-label">Ingresos hoy</span>
              <span className="report-summary-value" style={{ color: "var(--success)" }}>
                Q{parseFloat(daily.stats.total_revenue).toFixed(2)}
              </span>
            </div>
            <div className="report-summary-item">
              <span className="report-summary-label">Clientes únicos</span>
              <span className="report-summary-value">{daily.stats.unique_clients}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
