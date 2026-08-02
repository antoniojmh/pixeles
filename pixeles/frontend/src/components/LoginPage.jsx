import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setError("");
    setBusy(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-bg">
      {/* Partículas de fondo decorativas */}
      <div className="login-particles">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="login-particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${3 + Math.random() * 6}s`,
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
          }} />
        ))}
      </div>

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="18" width="14" height="14" rx="3" fill="currentColor" opacity="0.9"/>
              <rect x="25" y="10" width="14" height="14" rx="3" fill="currentColor" opacity="0.7"/>
              <rect x="42" y="18" width="14" height="14" rx="3" fill="currentColor" opacity="0.5"/>
              <rect x="8" y="35" width="14" height="14" rx="3" fill="currentColor" opacity="0.6"/>
              <rect x="25" y="38" width="14" height="14" rx="3" fill="currentColor" opacity="0.85"/>
              <rect x="42" y="35" width="14" height="14" rx="3" fill="currentColor" opacity="0.45"/>
              <path d="M32 56l-8-10h16l-8 10z" fill="currentColor" opacity="0.3"/>
            </svg>
          </div>
          <h1>PIXELES</h1>
          <p className="login-subtitle">Centro de Videojuegos</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="login-field">
            <label htmlFor="login-username">Usuario</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="login-btn" disabled={busy}>
            {busy ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
