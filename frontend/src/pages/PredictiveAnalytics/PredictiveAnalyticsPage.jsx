import React, { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { authService } from "../../services/authService";
import OverviewTab from "./tabs/OverviewTab";
import ForecastsTab from "./tabs/ForecastsTab";
import RiskPredictionTab from "./tabs/RiskPredictionTab";
import AnomalyPredictionTab from "./tabs/AnomalyPredictionTab";
import RecommendationsTab from "./tabs/RecommendationsTab";
import PredictionHistoryTab from "./tabs/PredictionHistoryTab";
import "./PredictiveAnalyticsPage.css";

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

export default function PredictiveAnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview"); // overview | forecasts | risk | anomalies | recommendations | history
  const [overview, setOverview] = useState(null);
  const [forecasts, setForecasts] = useState([]);
  const [departmentRisks, setDepartmentRisks] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { toasts, addToast, dismissToast } = useToast();

  const fetchPredictiveData = async (isBackground = false) => {
    if (isBackground) setRefreshing(true);
    else setLoading(true);

    try {
      const [overviewRes, forecastsRes, riskRes, anomaliesRes, recsRes] = await Promise.all([
        fetch(`${API_URL}/api/predictions/overview`, { headers: authHeaders() }),
        fetch(`${API_URL}/api/predictions/forecast`, { headers: authHeaders() }),
        fetch(`${API_URL}/api/predictions/risk`, { headers: authHeaders() }),
        fetch(`${API_URL}/api/predictions/anomalies`, { headers: authHeaders() }),
        fetch(`${API_URL}/api/predictions/recommendations`, { headers: authHeaders() }),
      ]);

      const overviewData = overviewRes.ok ? await overviewRes.json() : null;
      const forecastsData = forecastsRes.ok ? await forecastsRes.json() : [];
      const riskData = riskRes.ok ? await riskRes.json() : { departmentRisks: [] };
      const anomaliesData = anomaliesRes.ok ? await anomaliesRes.json() : [];
      const recsData = recsRes.ok ? await recsRes.json() : [];

      setOverview(overviewData);
      setForecasts(forecastsData);
      setDepartmentRisks(riskData.departmentRisks || []);
      setAnomalies(anomaliesData);
      setRecommendations(recsData);
    } catch (err) {
      console.error("Error fetching predictive data:", err);
      addToast("Failed to load predictive analytics data.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPredictiveData();

    // Socket.IO Real-Time Updates
    const socket = io(API_URL);
    socket.on("predictionsUpdated", () => {
      console.log("Real-time prediction update received!");
      fetchPredictiveData(true);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="predictive-analytics-page">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <span className="eyebrow">ENTERPRISE AI PREDICTIVE ANALYTICS</span>
          <h1>Predictive Analytics & Forecasting</h1>
          <p>AI time-series models predict KPI trajectories, business risks, and early anomalies before operational thresholds are breached.</p>
        </div>

        <button className="secondary-button" onClick={() => fetchPredictiveData(true)} disabled={refreshing}>
          {refreshing ? "Refreshing AI Models..." : "↻ Refresh Forecasts"}
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
          className={`hub-tab-button ${activeTab === "forecasts" ? "active" : ""}`}
          onClick={() => setActiveTab("forecasts")}
        >
          <span className="tab-icon">📈</span> Forecasts ({forecasts.length})
        </button>

        <button
          className={`hub-tab-button ${activeTab === "risk" ? "active" : ""}`}
          onClick={() => setActiveTab("risk")}
        >
          <span className="tab-icon">📊</span> Risk Prediction
        </button>

        <button
          className={`hub-tab-button ${activeTab === "anomalies" ? "active" : ""}`}
          onClick={() => setActiveTab("anomalies")}
        >
          <span className="tab-icon">⚡</span> Anomaly Prediction ({anomalies.length})
        </button>

        <button
          className={`hub-tab-button ${activeTab === "recommendations" ? "active" : ""}`}
          onClick={() => setActiveTab("recommendations")}
        >
          <span className="tab-icon">💡</span> AI Recommendations ({recommendations.length})
        </button>

        <button
          className={`hub-tab-button ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <span className="tab-icon">📜</span> Prediction History
        </button>
      </div>

      {/* Main Tab Content Body */}
      {loading ? (
        <div className="loading-screen">Calculating AI time-series predictions...</div>
      ) : (
        <div className="hub-tab-body">
          {activeTab === "overview" && (
            <OverviewTab
              overview={overview}
              forecasts={forecasts}
              departmentRisks={departmentRisks}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === "forecasts" && (
            <ForecastsTab forecasts={forecasts} />
          )}

          {activeTab === "risk" && (
            <RiskPredictionTab departmentRisks={departmentRisks} overview={overview} />
          )}

          {activeTab === "anomalies" && (
            <AnomalyPredictionTab anomalies={anomalies} />
          )}

          {activeTab === "recommendations" && (
            <RecommendationsTab recommendations={recommendations} />
          )}

          {activeTab === "history" && (
            <PredictionHistoryTab
              authHeaders={authHeaders}
              apiUrl={API_URL}
              addToast={addToast}
            />
          )}
        </div>
      )}
    </div>
  );
}
