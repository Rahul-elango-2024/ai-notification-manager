import React, { useCallback, useEffect, useState } from "react";
import {
  fetchAnomalies,
  fetchPredictiveForecasts,
  fetchPredictiveOverview,
  fetchRecommendations,
  fetchRiskPredictions,
} from "../services/predictiveApi";

import ExecutiveForecast from "../components/predictive/ExecutiveForecast";
import PredictiveCharts from "../components/predictive/PredictiveCharts";
import PredictiveHeatmap from "../components/predictive/PredictiveHeatmap";
import PredictiveInsightsPanel from "../components/predictive/PredictiveInsightsPanel";
import PredictiveRecommendations from "../components/predictive/PredictiveRecommendations";
import PredictiveStats from "../components/predictive/PredictiveStats";
import RootCausePrediction from "../components/predictive/RootCausePrediction";
import TrendAnalysis from "../components/predictive/TrendAnalysis";
import "./PredictiveAnalytics.css";

export default function PredictiveAnalytics() {
  const [overview, setOverview] = useState({});
  const [forecasts, setForecasts] = useState([]);
  const [riskData, setRiskData] = useState({});
  const [anomalies, setAnomalies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadAllPredictiveData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const [ovData, fcData, rskData, anomData, recData] = await Promise.all([
        fetchPredictiveOverview(),
        fetchPredictiveForecasts(),
        fetchRiskPredictions(),
        fetchAnomalies(),
        fetchRecommendations(),
      ]);

      setOverview(ovData || {});
      setForecasts(fcData || []);
      setRiskData(rskData || {});
      setAnomalies(anomData || []);
      setRecommendations(recData || []);
    } catch (err) {
      console.error("Error loading predictive telemetry:", err);
      setError(err.message || "Failed to load predictive analytics telemetry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllPredictiveData();
  }, [loadAllPredictiveData]);

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

  const handleExportCSV = () => {
    handleExportExcel();
  };

  return (
    <div className="predictive-analytics-page full-width-page">
      {/* ENTERPRISE TOP HERO HEADER */}
      <header className="page-heading predictive-header enterprise-header-bar">
        <div className="header-title-block">
          <span className="eyebrow">ENTERPRISE AI PREDICTIVE ENGINE</span>
          <h1 className="main-title">Predictive AI Analytics</h1>
          <p className="main-subtitle">
            Forecasting telemetry trends, risk anomalies, revenue impact, and automated AI mitigation recommendations.
          </p>
        </div>

        <div className="header-action-group">
          <button className="secondary-button header-ctrl-btn" onClick={handleExportPDF} title="Print or save PDF report">
            📄 Export PDF
          </button>
          <button className="secondary-button header-ctrl-btn" onClick={handleExportExcel} title="Export data to Excel/CSV">
            📊 Export Excel
          </button>
          <button className="secondary-button header-ctrl-btn" onClick={handleExportCSV} title="Export CSV file">
            📥 Export CSV
          </button>

          <button
            className="primary-button header-ctrl-btn"
            onClick={() => loadAllPredictiveData(true)}
            disabled={refreshing}
          >
            {refreshing ? "↻ Refreshing..." : "↻ Refresh Telemetry"}
          </button>
        </div>
      </header>

      {/* ERROR STATE */}
      {error ? (
        <div className="panel error-panel-box">
          <div className="error-icon">⚠️</div>
          <h3 className="error-title">Unable to Load Predictive Analytics</h3>
          <p className="error-msg">{error}</p>
          <button className="primary-button" onClick={() => loadAllPredictiveData(false)}>
            ↻ Retry Connection
          </button>
        </div>
      ) : loading ? (
        <div className="predictive-skeleton-flow">
          <div className="skeleton-grid-5" />
          <div className="skeleton-box-large" />
          <div className="skeleton-box-large" />
        </div>
      ) : (
        <div className="dashboard-content-flow">
          {/* 1. AI Overview Dashboard Cards */}
          <PredictiveStats overview={overview} />

          {/* 2. AI Forecast Charts */}
          <PredictiveCharts forecasts={forecasts} />

          {/* 3. Gemini AI Insights Panel */}
          <PredictiveInsightsPanel anomalies={anomalies} />

          {/* 4. Department Risk Predictive Heatmap */}
          <PredictiveHeatmap departmentRisks={riskData.departmentRisks || []} />

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
    </div>
  );
}
