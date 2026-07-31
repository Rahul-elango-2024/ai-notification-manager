import React, { memo } from "react";

const PredictiveHeatmap = memo(function PredictiveHeatmap({ departmentRisks = [] }) {
  const defaultDepts = [
    { department_name: "Infrastructure", risk_score: 84, risk_level: "CRITICAL", kpi_count: 6, trend: "UP", status: "Action Needed" },
    { department_name: "Payments", risk_score: 72, risk_level: "HIGH", kpi_count: 4, trend: "UP", status: "Elevated Risk" },
    { department_name: "Security", risk_score: 48, risk_level: "MEDIUM", kpi_count: 5, trend: "STABLE", status: "Moderate" },
    { department_name: "Finance", risk_score: 32, risk_level: "LOW", kpi_count: 3, trend: "DOWN", status: "Stable" },
    { department_name: "Sales", risk_score: 28, risk_level: "LOW", kpi_count: 3, trend: "STABLE", status: "Optimal" },
    { department_name: "HR", risk_score: 15, risk_level: "LOW", kpi_count: 3, trend: "STABLE", status: "Optimal" },
  ];

  const depts = departmentRisks.length > 0 ? departmentRisks : defaultDepts;

  return (
    <div className="panel predictive-heatmap-panel" role="region" aria-label="Department Risk Predictive Heatmap">
      <div className="panel-header">
        <div>
          <h2>🔥 Department Risk Predictive Heatmap</h2>
          <p>Multi-department future risk score matrix predicting vulnerability across core business units over the next 30 days.</p>
        </div>
      </div>

      <div className="heatmap-grid-container">
        {depts.map((d, idx) => {
          const levelClass = (d.risk_level || "LOW").toLowerCase();
          return (
            <div key={idx} className={`heatmap-card heat-level-${levelClass}`}>
              <div className="heatmap-card-top">
                <span className="heatmap-dept-name">{d.department_name}</span>
                <span className={`priority-badge prio-${levelClass}`}>{d.risk_level}</span>
              </div>

              <div className="heatmap-score-row">
                <span className="heatmap-score-num">{d.risk_score}</span>
                <span className="heatmap-score-max">/100 Risk</span>
              </div>

              <div className="heatmap-progress-track">
                <div
                  className="heatmap-progress-fill"
                  style={{ width: `${Math.min(d.risk_score, 100)}%` }}
                />
              </div>

              <div className="heatmap-card-footer">
                <span className="heatmap-kpi-count">📊 {d.kpi_count || 4} Monitored KPIs</span>
                <span className="heatmap-trend-tag">Trend: {d.trend || (d.risk_score > 60 ? "▲ Escalating" : "▼ Stable")}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default PredictiveHeatmap;
