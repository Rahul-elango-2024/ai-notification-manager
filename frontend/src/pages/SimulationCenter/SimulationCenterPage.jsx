import React, { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { authService } from "../../services/authService";
import OverviewTab from "./tabs/OverviewTab";
import ScenariosTab from "./tabs/ScenariosTab";
import LiveSimulationTab from "./tabs/LiveSimulationTab";
import HistoryTab from "./tabs/HistoryTab";
import SettingsTab from "./tabs/SettingsTab";
import "./SimulationCenterPage.css";

const API_URL = "http://localhost:5000";

function authHeaders() {
  const token = authService.getToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// Toast System
function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="toast-icon">
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
          </span>
          <span>{t.message}</span>
          <button className="toast-close" onClick={() => onDismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const addToast = useCallback((message, type = "info") => {
    counterRef.current += 1;
    const id = counterRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}

export default function SimulationCenterPage() {
  const [activeTab, setActiveTab] = useState("overview"); // overview | scenarios | live | history | settings
  const [status, setStatus] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [monitoringData, setMonitoringData] = useState([]);
  const [loading, setLoading] = useState(true);

  const { toasts, addToast, dismissToast } = useToast();

  const fetchSimulationData = async () => {
    try {
      const [statusRes, scenariosRes, monitoringRes] = await Promise.all([
        fetch(`${API_URL}/api/simulation/status`, { headers: authHeaders() }),
        fetch(`${API_URL}/api/simulation/scenarios`, { headers: authHeaders() }),
        fetch(`${API_URL}/api/monitoring`, { headers: authHeaders() }),
      ]);

      const statusData = statusRes.ok ? await statusRes.json() : null;
      const scenariosData = scenariosRes.ok ? await scenariosRes.json() : [];
      const monitoringDataRes = monitoringRes.ok ? await monitoringRes.json() : [];

      setStatus(statusData);
      setScenarios(scenariosData);
      setMonitoringData(monitoringDataRes);
    } catch (err) {
      console.error("Error fetching simulation data:", err);
      addToast("Failed to load simulation data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulationData();

    // Socket.IO Real-Time Simulation Stream Listener
    const socket = io(API_URL);
    socket.on("simulationTick", (payload) => {
      if (payload.status) setStatus(payload.status);
      if (payload.monitoringData) setMonitoringData(payload.monitoringData);
    });

    socket.on("monitoringUpdated", (data) => {
      setMonitoringData(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleStart = async (scenarioId = "NORMAL", speedSeconds = 10) => {
    try {
      const res = await fetch(`${API_URL}/api/simulation/start`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ scenarioId, speedSeconds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start simulation.");
      setStatus(data.status);
      addToast(`Simulation started: ${data.status.scenarioName}`, "success");
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handlePause = async () => {
    try {
      const res = await fetch(`${API_URL}/api/simulation/pause`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      setStatus(data.status);
      addToast("Simulation paused.", "info");
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleResume = async () => {
    try {
      const res = await fetch(`${API_URL}/api/simulation/resume`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      setStatus(data.status);
      addToast("Simulation resumed.", "success");
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleStop = async () => {
    try {
      const res = await fetch(`${API_URL}/api/simulation/stop`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      setStatus(data.status);
      addToast("Simulation stopped.", "info");
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleReset = async () => {
    try {
      const res = await fetch(`${API_URL}/api/simulation/reset`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      setStatus(data.status);
      addToast("Simulation reset to target baselines.", "success");
      fetchSimulationData();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  return (
    <div className="simulation-center-page">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <span className="eyebrow">ENTERPRISE EVENT SIMULATOR</span>
          <h1>Simulation Center & Scenario Engine</h1>
          <p>Generate stochastic time-series KPI trends to test threshold evaluation, AI alerts, notifications, and predictive analytics.</p>
        </div>

        <button className="secondary-button" onClick={fetchSimulationData}>
          ↻ Refresh Status
        </button>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="hub-tabs-header">
        <button
          className={`hub-tab-button ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <span className="tab-icon">🌐</span> Overview
        </button>

        <button
          className={`hub-tab-button ${activeTab === "scenarios" ? "active" : ""}`}
          onClick={() => setActiveTab("scenarios")}
        >
          <span className="tab-icon">🕹</span> Scenarios ({scenarios.length})
        </button>

        <button
          className={`hub-tab-button ${activeTab === "live" ? "active" : ""}`}
          onClick={() => setActiveTab("live")}
        >
          <span className="tab-icon">📈</span> Live Simulation
        </button>

        <button
          className={`hub-tab-button ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <span className="tab-icon">📜</span> History
        </button>

        <button
          className={`hub-tab-button ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          <span className="tab-icon">⚙</span> Settings
        </button>
      </div>

      {/* Main Tab Content Body */}
      {loading ? (
        <div className="loading-screen">Initializing Simulation Engine...</div>
      ) : (
        <div className="hub-tab-body">
          {activeTab === "overview" && (
            <OverviewTab
              status={status}
              scenarios={scenarios}
              monitoringData={monitoringData}
              onStart={handleStart}
              onPause={handlePause}
              onResume={handleResume}
              onStop={handleStop}
              onReset={handleReset}
              onRefresh={fetchSimulationData}
            />
          )}

          {activeTab === "scenarios" && (
            <ScenariosTab
              scenarios={scenarios}
              currentScenario={status?.currentScenario}
              speedSeconds={status?.speedSeconds}
              onStart={handleStart}
            />
          )}

          {activeTab === "live" && (
            <LiveSimulationTab monitoringData={monitoringData} />
          )}

          {activeTab === "history" && (
            <HistoryTab authHeaders={authHeaders} apiUrl={API_URL} addToast={addToast} />
          )}

          {activeTab === "settings" && (
            <SettingsTab
              status={status}
              authHeaders={authHeaders}
              apiUrl={API_URL}
              addToast={addToast}
              onRefresh={fetchSimulationData}
            />
          )}
        </div>
      )}
    </div>
  );
}
