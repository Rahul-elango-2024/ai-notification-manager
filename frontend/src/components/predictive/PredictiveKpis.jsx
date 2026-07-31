import React, { memo } from "react";

const PredictiveKpis = memo(function PredictiveKpis() {
  return (
    <div className="summary-kpis-grid" role="region" aria-label="Predictive Analytics Summary Cards">
      {/* Card 1: AI Health Score */}
      <div className="kpi-card">
        <div className="kpi-card-header">
          <span className="kpi-title">AI Health Score</span>
          <span className="badge badge-success">Optimal</span>
        </div>
        <div className="kpi-card-body">
          <span className="kpi-metric">94.4%</span>
          <span className="caption-text">System performance is healthy</span>
          <div className="sparkline-container">
            <svg viewBox="0 0 100 20" className="sparkline-svg">
              <path d="M0,15 Q25,8 50,12 T80,5 T100,10" fill="none" stroke="#16A34A" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>

      {/* Card 2: Predicted Incidents */}
      <div className="kpi-card">
        <div className="kpi-card-header">
          <span className="kpi-title">Predicted Incidents</span>
          <span className="badge badge-danger">↑ 12%</span>
        </div>
        <div className="kpi-card-body">
          <span className="kpi-metric">5</span>
          <span className="caption-text">In next 24 hours</span>
          <div className="sparkline-container">
            <svg viewBox="0 0 100 20" className="sparkline-svg">
              <path d="M0,18 Q25,12 50,15 T80,4 T100,8" fill="none" stroke="#7C3AED" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>

      {/* Card 3: Business Risk Score */}
      <div className="kpi-card">
        <div className="kpi-card-header">
          <span className="kpi-title">Business Risk Score</span>
          <span className="badge badge-warning">High</span>
        </div>
        <div className="kpi-card-body">
          <span className="kpi-metric">80/100</span>
          <span className="caption-text">Across all departments</span>
          <div className="sparkline-container">
            <svg viewBox="0 0 100 20" className="sparkline-svg">
              <path d="M0,12 Q25,18 50,10 T80,16 T100,6" fill="none" stroke="#F59E0B" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>

      {/* Card 4: AI Confidence */}
      <div className="kpi-card">
        <div className="kpi-card-header">
          <span className="kpi-title">AI Confidence</span>
          <span className="badge badge-primary">High</span>
        </div>
        <div className="kpi-card-body">
          <span className="kpi-metric">96.8%</span>
          <span className="caption-text">Model accuracy score</span>
          <div className="sparkline-container">
            <svg viewBox="0 0 100 20" className="sparkline-svg">
              <path d="M0,16 Q25,10 50,14 T80,6 T100,12" fill="none" stroke="#2563EB" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PredictiveKpis;
