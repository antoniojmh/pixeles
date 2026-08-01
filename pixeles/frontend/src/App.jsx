import { useState, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import History from "./components/History";
import Reports from "./components/Reports";
import Games from "./components/Games";
import TimerAlert from "./components/TimerAlert";
import "./App.css";

export default function App() {
  const [headerStats, setHeaderStats] = useState(null);

  const handleStatsUpdate = useCallback((stats) => {
    setHeaderStats(stats);
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Header stats={headerStats} />
        <div className="app-content">
          <Routes>
            <Route
              path="/"
              element={<Dashboard onStatsUpdate={handleStatsUpdate} />}
            />
            <Route path="/history" element={<History />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/games" element={<Games />} />
          </Routes>
        </div>
      </main>

      {/* Alertas globales de temporizador */}
      <TimerAlert />
    </div>
  );
}
