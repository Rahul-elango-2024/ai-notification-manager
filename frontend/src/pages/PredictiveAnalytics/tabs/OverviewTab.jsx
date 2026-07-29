import React from "react";

export default function OverviewTab({ overview, forecasts, departmentRisks, onNavigateTab }) {
  const riskScore = overview?.overallRiskScore || 0;
  const riskLevel = overview?.overallRiskLevel || "LOW";
  const criticalAlerts = overview?.predictedCriticalAlerts || 0;
  const warningAlerts = overview?.predictedWarningAlerts || 0;
  const anomaliesCount = overview?.predictedAnomaliesCount || 0;

  // Filter top 5 at-risk KPIs
  const sortedAtRiskKpis = [...forecasts]
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 5);

  return (
    <div className="tab-content overview-tab">
      {/* Metric Cards Grid */}
      <section className="metric-grid">
        <div className="metric-card blue">
          <div className="metric-card-top">
            <div className="metric-icon blue">📊</div>
            <span className="metric-label">Monitored KPIs</span>
          </div>
          <strong className="metric-value">{overview?.totalKpisMonitored || 0}</strong>
          <span className="metric-description">Active time-series models</span>
        </div>

        <div className="metric-card red">
          <div className="metric-card-top">
            <div className="metric-icon red">▲</div>
            <span className="metric-label">Predicted Critical Alerts</span>
          </div>
          <strong className="metric-value">{criticalAlerts}</strong>
          <span className="metric-description">Projected breaches (24h)</span>
        </div>

        <div className="metric-card yellow">
          <div className="metric-card-top">
            <div className="metric-icon yellow">!</div>
            <span className="metric-label">Predicted Warning Alerts</span>
          </div>
          <strong className="metric-value">{warningAlerts}</strong>
          <span className="metric-description">Moderate trajectory risks</span>
        </div>

        <div className="metric-card purple">
          <div className="metric-card-top">
            <div className="metric-icon purple">⚡</div>
            <span className="metric-label">Early Anomalies Detected</span>
          </div>
          <strong className="metric-value">{anomaliesCount}</strong>
          <span className="metric-description">Pre-threshold breaches</span>
        </div>
      </section>

      {/* Main Layout Grid */}
      <div className="overview-layout">
        {/* Risk Gauge Panel */}
        <div className="panel risk-gauge-panel">
          <div className="panel-header">
            <div>
              <h2>Enterprise Overall Risk Score</h2>
              <p>Aggregated predictive risk index across all department metrics.</p>
            </div>
          </div>

          <div className="gauge-container">
            <div className="gauge-circle-outer">
              <div
                className={`gauge-circle-inner ${riskLevel.toLowerCase()}`}
                style={{
                  background: `conic-gradient(
                    ${riskLevel === "CRITICAL" ? "#ef4444" : riskLevel === "HIGH" ? "#f97316" : riskLevel === "MEDIUM" ? "#eab308" : "#22c55e"} ${riskScore * 3.6}deg,
                    #1e293b 0deg
                  )`
                }}
              >
                <div className="gauge-center-content">
                  <span className="gauge-number">{riskScore}</span>
                  <span className="gauge-max">/ 100</span>
                  <span className={`gauge-badge ${riskLevel.toLowerCase()}`}>{riskLevel} RISK</span>
                </div>
              </div>
            </div>

            <div className="risk-level-breakdown">
              <div className="risk-level-item">
                <span className="dot low" /> 0-34: Normal
              </div>
              <div className="risk-level-item">
                <span className="dot medium" /> 35-54: Medium
              </div>
              <div className="risk-level-item">
                <span className="dot high" /> 55-74: High
              </div>
              <div className="risk-level-item">
                <span className="dot critical" /> 75-100: Critical
              </div>
            </div>
          </div>
        </div>

        {/* Top At-Risk KPIs Panel */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Top At-Risk KPI Forecasts</h2>
              <p>KPIs showing highest projected deviation over next 24 hours.</p>
            </div>
            <button className="text-button" onClick={() => onNavigateTab("forecasts")}>
              View All Forecasts ➔
            </button>
          </div>

          {sortedAtRiskKpis.length > 0 ? (
            <div className="compact-kpi-list">
              {sortedAtRiskKpis.map((f) => (
                <div className="compact-kpi-row" key={f.kpi_id}>
                  <div className="kpi-identity">
                    <div>
                      <strong>{f.kpi_name}</strong>
                      <span>{f.department}</span>
                    </div>
                  </div>

                  <div className="compact-value">
                    <span>Target: {f.target_value} {f.unit}</span>
                    <strong>Predicted 24h: {f.periods["24h"].value} {f.unit}</strong>
                  </div>

                  <div className="risk-score-pill">
                    <span className={`status-badge ${(f.risk_level || "").toLowerCase()}`}>
                      {f.risk_score}/100 {f.risk_level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">✓</div>
              <h3>All KPIs Stable</h3>
              <p>No high-risk trajectories detected across enterprise metrics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
