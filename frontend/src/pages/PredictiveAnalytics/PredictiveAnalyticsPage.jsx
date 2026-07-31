import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { authService } from "../../services/authService";

import PredictiveStats from "../../components/predictive/PredictiveStats";
import PredictiveCharts from "../../components/predictive/PredictiveCharts";
import PredictiveInsightsPanel from "../../components/predictive/PredictiveInsightsPanel";
import PredictiveHeatmap from "../../components/predictive/PredictiveHeatmap";
import PredictiveRecommendations from "../../components/predictive/PredictiveRecommendations";
import TrendAnalysis from "../../components/predictive/TrendAnalysis";
import RootCausePrediction from "../../components/predictive/RootCausePrediction";
import ExecutiveForecast from "../../components/predictive/ExecutiveForecast";

import OverviewTab from "./tabs/OverviewTab";
import ForecastsTab from "./tabs/ForecastsTab";
import RiskPredictionTab from "./tabs/RiskPredictionTab";
import AnomalyPredictionTab from "./tabs/AnomalyPredictionTab";
import RecommendationsTab from "./tabs/RecommendationsTab";
import PredictionHistoryTab from "./tabs/PredictionHistoryTab";
import "../PredictiveAnalytics.css";

const API_URL = "http://localhost:5000";

function authHeaders() {
  const token = authService.getToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export default function PredictiveAnalyticsPage() {
  const [activeTab, setActiveTab] = useState("all-dashboard"); // "all-dashboard" | "overview" | "forecasts" | "risk" | "anomalies" | "recommendations" | "history"
  const [overview, setOverview] = useState(null);
  const [forecasts, setForecasts] = useState([]);
  const [departmentRisks, setDepartmentRisks] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

      setOverview(overviewData || {
        overallRiskScore: 78,
        overallRiskLevel: "HIGH",
        predictedCriticalAlerts: 4,
        predictedSlaBreaches: 2,
        systemHealthScore: 91.4,
        aiConfidenceScore: 94.8,
      });
      setForecasts(forecastsData);
      setDepartmentRisks(riskData.departmentRisks || []);
      setAnomalies(anomaliesData);
      setRecommendations(recsData);
    } catch (err) {
      console.error("Error fetching predictive data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPredictiveData();

    const socket = io(API_URL);
    socket.on("predictionsUpdated", () => {
      fetchPredictiveData(true);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Export handlers
  const handleExportPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Category,Metric,Score,Details\n" +
      "AI Overview,Overall Risk Score,78,High Risk\n" +
      "AI Overview,Predicted Incidents 24h,4,Action Needed\n" +
      "AI Overview,System Health,91.4%,Optimal\n" +
      "Department Risk,Infrastructure,84,Critical\n" +
      "Department Risk,Payments,72,High\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `predictive_analytics_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="predictive-analytics-page full-width-page">
      {/* Page Heading */}
      <header className="page-heading predictive-header enterprise-header-bar">
        <div className="header-title-block">
          <span className="eyebrow">ENTERPRISE AI PREDICTIVE ENGINE</span>
          <h1 className="main-title">Predictive AI Analytics & Forecasting</h1>
          <p className="main-subtitle">
            AI time-series models predict KPI trajectories, business risks, and early anomalies before operational thresholds are breached.
          </p>
        </div>

        <div className="header-action-group">
          <button className="secondary-button header-ctrl-btn" onClick={handleExportPDF} title="Print or save PDF report">
            📄 Export PDF
          </button>
          <button className="secondary-button header-ctrl-btn" onClick={handleExportExcel} title="Export data to Excel/CSV">
            📊 Export Excel
          </button>
          <button
            className="primary-button header-ctrl-btn"
            onClick={() => fetchPredictiveData(true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing AI Models..." : "↻ Refresh Forecasts"}
          </button>
        </div>
      </header>

      {/* Navigation Sub-Tabs */}
      <div className="hub-tabs-header">
        <button
          className={`hub-tab-button ${activeTab === "all-dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("all-dashboard")}
        >
          <span className="tab-icon">✨</span> AI Executive Dashboard
        </button>

        <button
          className={`hub-tab-button ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <span className="tab-icon">🌐</span> KPI Overview
        </button>

        <button
          className={`hub-tab-button ${activeTab === "forecasts" ? "active" : ""}`}
          onClick={() => setActiveTab("forecasts")}
        >
          <span className="tab-icon">📈</span> Forecast Models ({forecasts.length})
        </button>

        <button
          className={`hub-tab-button ${activeTab === "risk" ? "active" : ""}`}
          onClick={() => setActiveTab("risk")}
        >
          <span className="tab-icon">📊</span> Risk Heatmap
        </button>

        <button
          className={`hub-tab-button ${activeTab === "anomalies" ? "active" : ""}`}
          onClick={() => setActiveTab("anomalies")}
        >
          <span className="tab-icon">⚡</span> Anomaly Alerts ({anomalies.length})
        </button>

        <button
          className={`hub-tab-button ${activeTab === "recommendations" ? "active" : ""}`}
          onClick={() => setActiveTab("recommendations")}
        >
          <span className="tab-icon">💡</span> AI Actions ({recommendations.length})
        </button>

        <button
          className={`hub-tab-button ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <span className="tab-icon">📜</span> Prediction Log
        </button>
      </div>

      {/* Content Body */}
      {loading ? (
        <div className="loading-screen">Calculating AI time-series predictions...</div>
      ) : (
        <div className="hub-tab-body">
          {activeTab === "all-dashboard" && (
            <div className="dashboard-content-flow">
              {/* 1. AI Overview Dashboard Cards */}
              <PredictiveStats overview={overview || {}} />

              {/* 2. AI Forecast Charts */}
              <PredictiveCharts forecasts={forecasts} />

              {/* 3. Gemini AI Insights Panel */}
              <PredictiveInsightsPanel anomalies={anomalies} />

              {/* 4. Department Risk Predictive Heatmap */}
              <PredictiveHeatmap departmentRisks={departmentRisks} />

              {/* 5. AI Prescriptive Recommendations */}
              <PredictiveRecommendations recommendations={recommendations} />

              {/* 6. Trend Analysis & Seasonality */}
              <TrendAnalysis />

              {/* 7. Preemptive Root Cause Prediction */}
              <RootCausePrediction />

              {/* 8. Executive Forecast Matrix */}
              <ExecutiveForecast />
            </div>
          )}

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
              addToast={() => {}}
            />
          )}
        </div>
      )}
    </div>
  );
}
