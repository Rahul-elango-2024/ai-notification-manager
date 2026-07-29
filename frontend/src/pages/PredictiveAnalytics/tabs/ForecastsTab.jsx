import React, { useState } from "react";

export default function ForecastsTab({ forecasts }) {
  const [period, setPeriod] = useState("24h"); // "1h" | "24h" | "7d" | "30d"
  const [selectedKpiId, setSelectedKpiId] = useState(forecasts[0]?.kpi_id || null);

  const selectedKpi = forecasts.find((f) => Number(f.kpi_id) === Number(selectedKpiId)) || forecasts[0];

  const periodLabels = {
    "1h": "Next 1 Hour",
    "24h": "Next 24 Hours",
    "7d": "Next 7 Days",
    "30d": "Next 30 Days",
  };

  return (
    <div className="tab-content forecasts-tab">
      {/* Control Bar */}
      <div className="tab-control-bar">
        <div className="period-selector-group">
          <span className="control-label">Forecast Horizon:</span>
          {["1h", "24h", "7d", "30d"].map((p) => (
            <button
              key={p}
              className={`period-button ${period === p ? "active" : ""}`}
              onClick={() => setPeriod(p)}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {forecasts.length > 0 && (
          <div className="kpi-select-group">
            <span className="control-label">Select KPI:</span>
            <select
              className="filter-select"
              value={selectedKpiId || ""}
              onChange={(e) => setSelectedKpiId(Number(e.target.value))}
            >
              {forecasts.map((f) => (
                <option key={f.kpi_id} value={f.kpi_id}>
                  {f.kpi_name} ({f.department})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Selected KPI Interactive Forecast Chart Panel */}
      {selectedKpi && (
        <div className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h2>{selectedKpi.kpi_name} — Predictive Forecast ({periodLabels[period]})</h2>
              <p>Model: {selectedKpi.model_version} • Confidence: {selectedKpi.confidence}% • Trend: {selectedKpi.trend}</p>
            </div>
            <span className={`status-badge ${(selectedKpi.risk_level || "").toLowerCase()}`}>
              {selectedKpi.risk_score}/100 {selectedKpi.risk_level} RISK
            </span>
          </div>

          <div className="forecast-chart-container">
            {/* Custom SVG Line Chart */}
            <div className="svg-chart-wrapper">
              <svg className="forecast-svg" viewBox="0 0 700 220" preserveAspectRatio="none">
                {/* Grid Lines */}
                <line x1="0" y1="40" x2="700" y2="40" stroke="#334155" strokeDasharray="4 4" />
                <line x1="0" y1="100" x2="700" y2="100" stroke="#334155" strokeDasharray="4 4" />
                <line x1="0" y1="160" x2="700" y2="160" stroke="#334155" strokeDasharray="4 4" />

                {/* Target Threshold Line */}
                <line x1="0" y1="100" x2="700" y2="100" stroke="#38bdf8" strokeWidth="2" />
                <text x="10" y="92" fill="#38bdf8" fontSize="12" fontWeight="600">Target ({selectedKpi.target_value} {selectedKpi.unit})</text>

                {/* Warning Threshold Line */}
                <line x1="0" y1="150" x2="700" y2="150" stroke="#eab308" strokeWidth="1.5" strokeDasharray="6 3" />
                <text x="10" y="144" fill="#eab308" fontSize="11">Warning ({selectedKpi.warning_threshold})</text>

                {/* Critical Threshold Line */}
                <line x1="0" y1="190" x2="700" y2="190" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6 3" />
                <text x="10" y="184" fill="#ef4444" fontSize="11">Critical ({selectedKpi.critical_threshold})</text>

                {/* Forecast Trend Line */}
                <polyline
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="3.5"
                  points={`50,110 200,${100 - (selectedKpi.periods["1h"].value - selectedKpi.target_value) * 0.2} 400,${100 - (selectedKpi.periods["24h"].value - selectedKpi.target_value) * 0.2} 580,${100 - (selectedKpi.periods["7d"].value - selectedKpi.target_value) * 0.2} 680,${100 - (selectedKpi.periods["30d"].value - selectedKpi.target_value) * 0.2}`}
                />

                {/* Data Points */}
                <circle cx="50" cy="110" r="5" fill="#a855f7" />
                <circle cx="400" cy={100 - (selectedKpi.periods["24h"].value - selectedKpi.target_value) * 0.2} r="6" fill="#ec4899" />
              </svg>
            </div>

            <div className="chart-legend">
              <div className="legend-item"><span className="legend-dot actual" /> Historical Actual</div>
              <div className="legend-item"><span className="legend-dot forecast" /> AI Predicted Trajectory</div>
              <div className="legend-item"><span className="legend-dot target" /> Target Threshold</div>
              <div className="legend-item"><span className="legend-dot warning" /> Warning Threshold</div>
            </div>
          </div>
        </div>
      )}

      {/* Forecast Data Table */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Complete Predictive Forecast Registry</h2>
            <p>Calculated Holt-Linear ensemble forecasts across all monitored KPIs.</p>
          </div>
          <span className="count-badge">{forecasts.length} Forecast(s)</span>
        </div>

        {forecasts.length > 0 ? (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>KPI Name</th>
                  <th>Department</th>
                  <th>Current Value</th>
                  <th>Target Value</th>
                  <th>Predicted ({periodLabels[period]})</th>
                  <th>Trend</th>
                  <th>Risk Score</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.map((f) => {
                  const predVal = f.periods[period]?.value ?? f.current_value;
                  return (
                    <tr key={f.kpi_id} onClick={() => setSelectedKpiId(f.kpi_id)} style={{ cursor: "pointer" }}>
                      <td><strong>{f.kpi_name}</strong></td>
                      <td>{f.department}</td>
                      <td>{f.current_value} {f.unit}</td>
                      <td>{f.target_value} {f.unit}</td>
                      <td><strong>{predVal} {f.unit}</strong></td>
                      <td>
                        <span className={`trend-badge ${(f.trend || "").toLowerCase()}`}>
                          {f.trend === "UP" ? "▲ UP" : f.trend === "DOWN" ? "▼ DOWN" : "➔ STABLE"}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${(f.risk_level || "").toLowerCase()}`}>
                          {f.risk_score}/100
                        </span>
                      </td>
                      <td>{f.confidence}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📈</div>
            <h3>No forecasts generated</h3>
            <p>Ensure KPIs are monitored to generate predictive time-series models.</p>
          </div>
        )}
      </div>
    </div>
  );
}
