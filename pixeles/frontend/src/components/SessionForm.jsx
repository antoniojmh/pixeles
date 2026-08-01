import { useState, useEffect } from "react";
import { api } from "../api/client";
import { DURATION_OPTIONS, DEFAULT_PRICES } from "../utils/constants";
import "./SessionForm.css";

export default function SessionForm({ console, onClose, onStart }) {
  const [games, setGames] = useState([]);
  const [gameId, setGameId] = useState("");
  const [duration, setDuration] = useState(60);
  const [customDuration, setCustomDuration] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [clientName, setClientName] = useState("");
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getGames().then((data) => {
      setGames(data.games);
      if (data.games.length > 0) setGameId(data.games[0].id);
    }).catch(() => {});

    api.getSettings().then((data) => {
      if (data.settings?.prices) setPrices(data.settings.prices);
    }).catch(() => {});
  }, []);

  const handleDurationSelect = (mins) => {
    setCustomMode(false);
    setDuration(mins);
    setCustomDuration("");
  };

  const handleCustomDuration = (e) => {
    const val = e.target.value;
    setCustomDuration(val);
    setCustomMode(true);
    const mins = parseInt(val);
    if (mins > 0) setDuration(mins);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!gameId) {
      setError("Selecciona un juego");
      return;
    }

    const finalDuration = customMode ? parseInt(customDuration) : duration;
    if (!finalDuration || finalDuration < 1) {
      setError("Duración inválida");
      return;
    }

    // Calcular precio: usar precio predefinido o calcular proporcional
    const pricePerMin = prices[finalDuration]
      ? prices[finalDuration] / finalDuration
      : prices[60] / 60 || 0.17;
    const amount = prices[finalDuration] || Math.round(finalDuration * pricePerMin);

    setLoading(true);
    try {
      await onStart({
        game_id: parseInt(gameId),
        duration_minutes: finalDuration,
        client_name: clientName.trim(),
        amount_paid: amount,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Obtener precio para mostrar
  const getPrice = (mins) => {
    if (prices[mins]) return `Q${prices[mins]}`;
    const perMin = prices[60] ? prices[60] / 60 : 0.17;
    return `Q${Math.round(mins * perMin)}`;
  };

  const currentPrice = customMode
    ? getPrice(duration)
    : getPrice(duration);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content session-form animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="session-form-header">
          <h2 className="modal-title">▶ Iniciar Sesión</h2>
          <span className="badge" style={{ fontSize: "0.85rem" }}>
            {console.name} #{console.number}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Juego */}
          <div className="form-group">
            <label className="form-label">🎮 Juego</label>
            <select
              className="form-select"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              required
            >
              <option value="">Seleccionar juego...</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Duración */}
          <div className="form-group">
            <label className="form-label">⏱ Duración</label>
            <div className="duration-options">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`duration-btn ${!customMode && duration === opt.value ? "duration-btn-active" : ""}`}
                  onClick={() => handleDurationSelect(opt.value)}
                >
                  {opt.label}
                  <span className="duration-price">{getPrice(opt.value)}</span>
                </button>
              ))}
              <button
                type="button"
                className={`duration-btn duration-custom ${customMode ? "duration-btn-active" : ""}`}
                onClick={() => setCustomMode(true)}
              >
                Personalizado
              </button>
            </div>
          </div>

          {/* Tiempo personalizado */}
          {customMode && (
            <div className="form-group">
              <label className="form-label">Minutos personalizados</label>
              <input
                type="number"
                className="form-input"
                min="1"
                max="480"
                value={customDuration}
                onChange={handleCustomDuration}
                placeholder="Ingresa los minutos..."
              />
            </div>
          )}

          {/* Precio */}
          <div className="session-form-price">
            <span>Total: </span>
            <span className="session-form-price-value">{currentPrice}</span>
          </div>

          {/* Cliente */}
          <div className="form-group">
            <label className="form-label">👤 Cliente (opcional)</label>
            <input
              type="text"
              className="form-input"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nombre del cliente..."
              maxLength={100}
            />
          </div>

          {error && <div className="session-form-error">⚠️ {error}</div>}

          {/* Acciones */}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? "🔄 Iniciando..." : "🚀 Iniciar Sesión"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
