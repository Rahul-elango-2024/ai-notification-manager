import React from "react";

export default function RiskPredictionTab({ departmentRisks, overview }) {
  return (
    <div className="tab-content risk-prediction-tab">
      {/* Risk Summary Header */}
      <section className="metric-grid">
        <div className="metric-card red">
          <div className="metric-card-top">
            <div className="metric-icon red">▲</div>
            <span className="metric-label">Predicted Critical Alerts</span>
          </div>
          <strong className="metric-value">{overview?.predictedCriticalAlerts || 0}</strong>
          <span className="metric-description">High breach probability</span>
        </div>

        <div className="metric-card yellow">
          <div className="metric-card-top">
            <div className="metric-icon yellow">!</div>
            <span className="metric-label">Predicted Warning Alerts</span>
          </div>
          <strong className="metric-value">{overview?.predictedWarningAlerts || 0}</strong>
          <span className="metric-description">Moderate risk probability</span>
        </div>

        <div className="metric-card purple">
          <div className="metric-card-top">
            <div className="metric-icon purple">📊</div>
            <span className="metric-label">Enterprise Risk Index</span>
          </div>
          <strong className="metric-value">{overview?.overallRiskScore || 0} / 100</strong>
          <span className="metric-description">Level: {overview?.overallRiskLevel || "LOW"}</span>
        </div>
      </section>

      {/* Department Risk Bar Chart & Heat Map Layout */}
      <div className="overview-layout">
        {/* Department Risk Scores Panel */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Department Risk Scores</h2>
              <p>Predictive risk breakdown by operational department.</p>
            </div>
          </div>

          {departmentRisks.length > 0 ? (
            <div className="dept-risk-bar-list">
              {departmentRisks.map((d) => (
                <div className="dept-risk-item" key={d.department_id}>
                  <div className="dept-risk-info">
                    <strong>{d.department_name}</strong>
                    <span>{d.kpi_count} KPI(s) • Level: {d.risk_level}</span>
                  </div>

                  <div className="risk-bar-container">
                    <div className="risk-bar-track">
                      <div
                        className={`risk-bar-fill ${d.risk_level.toLowerCase()}`}
                        style={{ width: `${Math.min(100, d.risk_score)}%` }}
                      />
                    </div>
                    <span className={`risk-score-badge ${d.risk_level.toLowerCase()}`}>
                      {d.risk_score}/100
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🏢</div>
              <h3>No department risk data</h3>
              <p>Department risk scores will appear when KPIs are monitored.</p>
            </div>
          )}
        </div>

        {/* Department Risk Heat Map */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Department Risk Heat Map</h2>
              <p>Visual intensity matrix of predictive risk distribution.</p>
            </div>
          </div>

          <div className="risk-heatmap-grid">
            {departmentRisks.map((d) => (
              <div className={`heatmap-cell ${d.risk_level.toLowerCase()}`} key={d.department_id}>
                <div className="heatmap-header">
                  <strong>{d.department_name}</strong>
                  <span className="heatmap-score">{d.risk_score}</span>
                </div>
                <div className="heatmap-body">
                  <span className="heatmap-level">{d.risk_level} RISK</span>
                  <small>{d.kpi_count} Monitored Metrics</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
