import React, { memo } from "react";

const PredictiveHeatmap = memo(function PredictiveHeatmap({ departmentRisks = [], onSelectDepartment }) {
  const defaultDepts = [
    { department_name: "Finance", risk_score: 88, risk_level: "CRITICAL", kpi_count: 6, trend: "▲ Escalating", status: "Action Needed", ai_health: 84.2 },
    { department_name: "Sales", risk_score: 72, risk_level: "HIGH", kpi_count: 5, trend: "▲ Escalating", status: "Elevated Risk", ai_health: 89.1 },
    { department_name: "IT Infrastructure", risk_score: 94, risk_level: "CRITICAL", kpi_count: 8, trend: "▲ Escalating", status: "Action Needed", ai_health: 78.5 },
    { department_name: "Security", risk_score: 64, risk_level: "MEDIUM", kpi_count: 5, trend: "▼ Stable", status: "Moderate", ai_health: 91.8 },
    { department_name: "Operations", risk_score: 52, risk_level: "MEDIUM", kpi_count: 6, trend: "▼ Stable", status: "Moderate", ai_health: 94.0 },
    { department_name: "Marketing", risk_score: 34, risk_level: "LOW", kpi_count: 4, trend: "▼ Stable", status: "Optimal", ai_health: 98.4 },
    { department_name: "Customer Support", risk_score: 76, risk_level: "HIGH", kpi_count: 5, trend: "▲ Escalating", status: "Elevated Risk", ai_health: 87.6 },
    { department_name: "HR", risk_score: 18, risk_level: "LOW", kpi_count: 3, trend: "▼ Stable", status: "Optimal", ai_health: 99.2 },
  ];

  const depts = departmentRisks.length > 0 ? departmentRisks : defaultDepts;

  return (
    <div className="panel predictive-heatmap-panel" role="region" aria-label="Department Risk Predictive Heatmap">
      <div className="panel-header">
        <div>
          <h2>🔥 Risk Heatmap</h2>
        </div>
      </div>

      <div className="heatmap-grid-container grid-4-col">
        {depts.map((d, idx) => {
          const levelClass = (d.risk_level || "LOW").toLowerCase();
          return (
            <div
              key={idx}
              className={`heatmap-card heat-level-${levelClass} clickable-card`}
              onClick={() => onSelectDepartment && onSelectDepartment(d)}
            >
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
                <span className="heatmap-trend-tag">{d.trend || "▼ Stable"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default PredictiveHeatmap;
