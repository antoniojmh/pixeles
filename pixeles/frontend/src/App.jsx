import { useState, useCallback } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import History from "./components/History";
import Reports from "./components/Reports";
import Games from "./components/Games";
import TimerAlert from "./components/TimerAlert";
import LoginPage from "./components/LoginPage";
import "./App.css";

function AuthGuard({ children }) {
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { token } = useAuth();
  const [headerStats, setHeaderStats] = useState(null);

  const handleStatsUpdate = useCallback((stats) => {
    setHeaderStats(stats);
  }, []);

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Header stats={headerStats} />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard onStatsUpdate={handleStatsUpdate} />} />
            <Route path="/history" element={<History />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/games" element={<Games />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      <TimerAlert />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
