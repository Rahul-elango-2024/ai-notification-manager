import React, { memo } from "react";
import PredictiveCharts from "./PredictiveCharts";

const PredictiveOverviewSection = memo(function PredictiveOverviewSection() {
  const departments = [
    { name: "Finance", low: 1, medium: 2, high: 3, critical: 1 },
    { name: "Sales", low: 3, medium: 4, high: 1, critical: 0 },
    { name: "IT Infra", low: 0, medium: 1, high: 4, critical: 2 },
    { name: "Security", low: 4, medium: 2, high: 1, critical: 0 },
    { name: "Operations", low: 2, medium: 3, high: 2, critical: 0 },
  ];

  return (
    <div className="operations-overview-grid" role="region" aria-label="Operations Overview Section">
      {/* Left Sub-Card: Interactive Recharts Telemetry Line Graph */}
      <PredictiveCharts />

      {/* Right Sub-Card: AI Risk Heatmap Matrix */}
      <div className="section-card heatmap-matrix-card">
        <div className="section-card-header">
          <h2 className="section-title">AI Risk Heatmap</h2>
          <span className="caption-text">Department Vulnerability Matrix</span>
        </div>

        <div className="heatmap-matrix-wrapper">
          <div className="heatmap-matrix-headers">
            <span className="dept-col-lbl">Dept</span>
            <span>Low</span>
            <span>Med</span>
            <span>High</span>
            <span>Crit</span>
          </div>

          <div className="heatmap-rows-stack">
            {departments.map((d, idx) => (
              <div key={idx} className="heatmap-dept-row">
                <span className="dept-name-cell">{d.name}</span>
                <span className="cell-block level-low">{d.low}</span>
                <span className="cell-block level-medium">{d.medium}</span>
                <span className="cell-block level-high">{d.high}</span>
                <span className={`cell-block ${d.critical > 0 ? "level-critical" : "level-low"}`}>{d.critical}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default PredictiveOverviewSection;
