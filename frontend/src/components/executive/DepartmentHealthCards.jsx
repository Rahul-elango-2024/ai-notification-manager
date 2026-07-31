import React, { memo } from "react";

const DepartmentHealthCards = memo(function DepartmentHealthCards({ departments = [] }) {
  const defaultDepts = [
    { id: 1, department_name: "Finance", risk_score: 88, incident_count: 3, status: "CRITICAL", ai_health: 84.2, trend: "UP" },
    { id: 2, department_name: "Sales", risk_score: 72, incident_count: 2, status: "HIGH", ai_health: 89.1, trend: "UP" },
    { id: 3, department_name: "IT Infrastructure", risk_score: 94, incident_count: 4, status: "CRITICAL", ai_health: 78.5, trend: "UP" },
    { id: 4, department_name: "Security", risk_score: 64, incident_count: 1, status: "MEDIUM", ai_health: 91.8, trend: "STABLE" },
    { id: 5, department_name: "Operations", risk_score: 52, incident_count: 1, status: "MEDIUM", ai_health: 94.0, trend: "STABLE" },
    { id: 6, department_name: "Marketing", risk_score: 34, incident_count: 0, status: "LOW", ai_health: 98.4, trend: "STABLE" },
    { id: 7, department_name: "Customer Support", risk_score: 76, incident_count: 2, status: "HIGH", ai_health: 87.6, trend: "UP" },
    { id: 8, department_name: "Legal", risk_score: 18, incident_count: 0, status: "LOW", ai_health: 99.2, trend: "STABLE" },
  ];

  const list = departments.length > 0 ? departments : defaultDepts;

  return (
    <div className="panel department-health-panel">
      <div className="panel-header">
        <div>
          <h2>🏢 8-Department Operational Health & Risk Scores</h2>
          <p>Real-time telemetry health scores, active incident count, risk index, and AI health rating per department.</p>
        </div>
      </div>

      <div className="dept-health-grid">
        {list.map((d) => {
          const statusLower = (d.status || "LOW").toLowerCase();
          return (
            <div key={d.id} className={`dept-health-card status-${statusLower}`}>
              <div className="dept-card-top">
                <strong className="dept-name-title">{d.department_name}</strong>
                <span className={`priority-badge prio-${statusLower}`}>{d.status}</span>
              </div>

              <div className="dept-score-row">
                <div className="dept-metric">
                  <span className="metric-lbl">Risk Score</span>
                  <strong className="metric-val">{d.risk_score}/100</strong>
                </div>
                <div className="dept-metric">
                  <span className="metric-lbl">AI Health</span>
                  <strong className="metric-val green-val">{d.ai_health}%</strong>
                </div>
              </div>

              <div className="dept-card-footer">
                <span>🚨 <strong>{d.incident_count}</strong> Active Incidents</span>
                <span>Trend: <strong>{d.trend === "UP" ? "▲ Escalating" : "▼ Stable"}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default DepartmentHealthCards;
