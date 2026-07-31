import React, { useCallback, useEffect, useState } from "react";
import {
  fetchAnomalies,
  fetchPredictiveOverview,
  fetchRecommendations,
} from "../services/predictiveApi";

import PredictiveHeader from "../components/predictive/PredictiveHeader";
import PredictiveKpis from "../components/predictive/PredictiveKpis";
import PredictiveOverviewSection from "../components/predictive/PredictiveOverviewSection";
import PredictiveRecommendationsTable from "../components/predictive/PredictiveRecommendationsTable";
import ExecutiveAIAssistant from "../components/executive/ExecutiveAIAssistant";
import ActivityFeed from "../components/executive/ActivityFeed";
import PredictiveDetailDrawer from "../components/predictive/PredictiveDetailDrawer";
import AIReportModal from "../components/predictive/AIReportModal";

import "./PredictiveAnalytics.css";

export default function PredictiveAnalytics() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [drawerData, setDrawerData] = useState(null);
  const [drawerType, setDrawerType] = useState(null);

  const loadPredictiveData = useCallback(async () => {
    try {
      const [ovData, recData] = await Promise.all([
        fetchPredictiveOverview(),
        fetchRecommendations(),
      ]);

      setRecommendations(recData || []);
    } catch (err) {
      console.error("Error loading predictive telemetry:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPredictiveData();
    const interval = setInterval(loadPredictiveData, 30000);
    return () => clearInterval(interval);
  }, [loadPredictiveData]);

  const handleOpenDrawer = (data, type) => {
    setDrawerData(data);
    setDrawerType(type);
  };

  return (
    <div className="predictive-analytics-page full-width-page">
      {/* 1. Header */}
      <PredictiveHeader
        onRefresh={loadPredictiveData}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {loading ? (
        <div className="skeleton-container">
          <div className="skeleton-row-4" />
          <div className="skeleton-box" />
        </div>
      ) : (
        <div className="dashboard-layout-flow">
          {/* 2. Top Sparkline Summary KPI Cards (4 Cards ONLY) */}
          <PredictiveKpis />

          {/* 3. Main 70% / 30% Operations Split */}
          <div className="main-content-split-70-30">
            {/* Left 70% Column */}
            <div className="left-70-col-flow">
              {/* Operations Overview: Incident Trend (7 Days) + AI Risk Heatmap */}
              <PredictiveOverviewSection />

              {/* Top AI Recommendations Datatable */}
              <PredictiveRecommendationsTable
                recommendations={recommendations}
                onOpenDetails={(rec) => handleOpenDrawer(rec, "RECOMMENDATION")}
              />
            </div>

            {/* Right 30% Column */}
            <div className="right-30-col-flow">
              {/* Gemini AI Assistant */}
              <ExecutiveAIAssistant />

              {/* Live Activity Feed */}
              <ActivityFeed />
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      <PredictiveDetailDrawer
        isOpen={Boolean(drawerData)}
        onClose={() => setDrawerData(null)}
        data={drawerData}
        type={drawerType}
      />

      {/* Report Modal */}
      <AIReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
    </div>
  );
}
