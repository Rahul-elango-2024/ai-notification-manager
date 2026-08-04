import React, { useState, useEffect } from "react";
import { authService } from "../../services/authService";
import { getSocket } from "../../services/socket";

// New enterprise components
import PredictiveKpiCards from "../../components/predictive/PredictiveKpiCards";
import ForecastChart from "../../components/predictive/ForecastChart";
import AIRecommendations from "../../components/predictive/AIRecommendations";
import RiskHeatmap from "../../components/predictive/RiskHeatmap";
import ForecastHistory from "../../components/predictive/ForecastHistory";
import RecommendationModals from "../../components/predictive/RecommendationModals";

import "./PredictiveAnalyticsPage.css";

const API_URL = "http://localhost:5000";

function authHeaders() {
  const token = authService.getToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export default function PredictiveAnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [forecasts, setForecasts] = useState([]);
  const [departmentRisks, setDepartmentRisks] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [detailsModalData, setDetailsModalData] = useState(null);
  const [executeModalData, setExecuteModalData] = useState(null);

  const fetchPredictiveData = async () => {
    try {
      const [overviewRes, forecastsRes, riskRes, recsRes, histRes] = await Promise.all([
        fetch(`${API_URL}/api/predictions/overview`, { headers: authHeaders() }),
        fetch(`${API_URL}/api/predictions/forecast`, { headers: authHeaders() }),
        fetch(`${API_URL}/api/predictions/risk`, { headers: authHeaders() }),
        fetch(`${API_URL}/api/predictions/recommendations`, { headers: authHeaders() }),
        fetch(`${API_URL}/api/predictions/history?limit=10`, { headers: authHeaders() })
      ]);

      const overviewData = overviewRes.ok ? await overviewRes.json() : null;
      const forecastsData = forecastsRes.ok ? await forecastsRes.json() : [];
      const riskData = riskRes.ok ? await riskRes.json() : { departmentRisks: [] };
      const recsData = recsRes.ok ? await recsRes.json() : [];
      const histData = histRes.ok ? await histRes.json() : [];

      setOverview(overviewData);
      setForecasts(forecastsData);
      setDepartmentRisks(riskData.departmentRisks || []);
      setRecommendations(recsData);
      setHistory(histData);
    } catch (err) {
      console.error("Error fetching predictive data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictiveData();

    const socket = getSocket();
    socket.on("predictionsUpdated", fetchPredictiveData);
    
    const handlePlaybookExecuted = (data) => {
      setRecommendations(prev => prev.map(r => 
        r.id === data.recommendationId ? { ...r, status: 'COMPLETED' } : r
      ));
    };
    
    socket.on("playbook_executed", handlePlaybookExecuted);

    return () => {
      socket.off("predictionsUpdated", fetchPredictiveData);
      socket.off("playbook_executed", handlePlaybookExecuted);
    };
  }, []);

  const handleExecuteStart = (rec) => {
    setRecommendations((prev) => prev.map(r => r.id === rec.id ? { ...r, status: 'EXECUTING' } : r));
  };

  const handleExecuteSuccess = (rec) => {
    setRecommendations((prev) => prev.map(r => r.id === rec.id ? { ...r, status: 'COMPLETED' } : r));
    setExecuteModalData(null);
  };

  if (loading) {
    return <div className="loading-screen">Loading Predictive Analytics...</div>;
  }

  return (
    <div className="predictive-analytics-page full-width-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">PREDICTIVE ANALYTICS</span>
          <h1>Predictive Analytics</h1>
          <p>Forecasts, risk signals, and prescriptive recommendations that use the same dashboard design system.</p>
        </div>
      </header>

      <div className="predictive-dashboard-grid">
        {/* 1. Executive KPI Cards */}
        <PredictiveKpiCards overview={overview} />

        {/* Main 2-column layout */}
        <div className="predictive-main-content">
          <div className="predictive-col-left">
            {/* 2. Forecast Chart */}
            <ForecastChart forecasts={forecasts} />
            
            {/* 3. AI Recommendations */}
            <AIRecommendations 
              recommendations={recommendations}
              onOpenDetails={setDetailsModalData}
              onExecute={setExecuteModalData}
            />
          </div>

          <div className="predictive-col-right">
            {/* 4. Risk Heatmap */}
            <RiskHeatmap departmentRisks={departmentRisks} />
            
            {/* 5. Forecast History */}
            <ForecastHistory history={history} />
          </div>
        </div>
      </div>

      <RecommendationModals 
        detailsModalData={detailsModalData}
        executeModalData={executeModalData}
        onCloseDetails={() => setDetailsModalData(null)}
        onCloseExecute={() => setExecuteModalData(null)}
        onExecuteStart={handleExecuteStart}
        onExecuteSuccess={handleExecuteSuccess}
      />
    </div>
  );
}
