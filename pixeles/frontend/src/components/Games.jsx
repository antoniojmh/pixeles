import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";
import "./Games.css";

export default function Games() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newGameName, setNewGameName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadGames = useCallback(async () => {
    try {
      const data = await api.getGames();
      setGames(data.games);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newGameName.trim()) return;

    setSaving(true);
    try {
      await api.createGame({ name: newGameName.trim() });
      setNewGameName("");
      setAdding(false);
      await loadGames();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id) => {
    if (!editName.trim()) return;

    setSaving(true);
    try {
      await api.updateGame(id, { name: editName.trim() });
      setEditingId(null);
      setEditName("");
      await loadGames();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este juego? Las sesiones existentes no se verán afectadas.")) {
      return;
    }

    try {
      await api.deleteGame(id);
      await loadGames();
    } catch (err) {
      alert(err.message);
    }
  };

  const startEdit = (game) => {
    setEditingId(game.id);
    setEditName(game.name);
  };

  return (
    <div className="games animate-fade-in">
      <div className="page-title">
        🎮 Catálogo de Juegos
        <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>
          + Agregar Juego
        </button>
      </div>

      {error && (
        <div className="games-error">
          ⚠️ {error}
          <button className="btn btn-sm btn-primary" onClick={loadGames}>
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      ) : (
        <div className="section">
          {games.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎮</div>
              <div className="empty-state-text">
                No hay juegos en el catálogo. Agrega el primero.
              </div>
            </div>
          ) : (
            <div className="games-list">
              {games.map((game) => (
                <div key={game.id} className="game-item">
                  {editingId === game.id ? (
                    <div className="game-edit-form">
                      <input
                        type="text"
                        className="form-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleEdit(game.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        disabled={saving}
                      />
                      <button className="btn btn-success btn-sm" onClick={() => handleEdit(game.id)} disabled={saving}>
                        💾 Guardar
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)} disabled={saving}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="game-name">{game.name}</span>
                      <div className="game-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => startEdit(game)}>
                          ✏️
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(game.id)}>
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de agregar juego */}
      {adding && (
        <div className="modal-overlay" onClick={() => setAdding(false)}>
          <div className="modal-content animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">🎮 Agregar Juego</h2>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Nombre del juego</label>
                <input
                  type="text"
                  className="form-input"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  placeholder="Ej: Fortnite"
                  autoFocus
                  maxLength={100}
                  disabled={saving}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setAdding(false)} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving || !newGameName.trim()}>
                  {saving ? "Guardando..." : "✅ Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
