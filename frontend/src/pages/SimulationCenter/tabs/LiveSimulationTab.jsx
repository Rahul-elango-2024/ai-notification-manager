import React, { useState } from "react";

export default function LiveSimulationTab({ monitoringData }) {
  const [selectedKpiId, setSelectedKpiId] = useState(monitoringData[0]?.id || null);

  const selectedKpi = monitoringData.find((k) => Number(k.id) === Number(selectedKpiId)) || monitoringData[0];

  return (
    <div className="tab-content live-sim-tab">
      {/* Control Bar */}
      <div className="tab-control-bar">
        {monitoringData.length > 0 && (
          <div className="kpi-select-group">
            <span className="control-label">Select KPI Metric Stream:</span>
            <select
              className="filter-select"
              value={selectedKpiId || ""}
              onChange={(e) => setSelectedKpiId(Number(e.target.value))}
            >
              {monitoringData.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.kpi_name} ({k.department})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Selected KPI Chart Stream */}
      {selectedKpi && (
        <div className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h2>{selectedKpi.kpi_name} — Live Trajectory Stream</h2>
              <p>Department: {selectedKpi.department} • Source: {selectedKpi.source || "Simulator"}</p>
            </div>
            <span className={`status-badge ${(selectedKpi.status || "").toLowerCase()}`}>
              STATUS: {selectedKpi.status}
            </span>
          </div>

          <div className="forecast-chart-container">
            <div className="svg-chart-wrapper">
              <svg className="forecast-svg" viewBox="0 0 700 200" preserveAspectRatio="none">
                <line x1="0" y1="30" x2="700" y2="30" stroke="#334155" strokeDasharray="4 4" />
                <line x1="0" y1="100" x2="700" y2="100" stroke="#38bdf8" strokeWidth="2" />
                <text x="10" y="92" fill="#38bdf8" fontSize="12" fontWeight="600">Target ({selectedKpi.target_value} {selectedKpi.unit})</text>

                <line x1="0" y1="140" x2="700" y2="140" stroke="#eab308" strokeWidth="1.5" strokeDasharray="6 3" />
                <text x="10" y="134" fill="#eab308" fontSize="11">Warning ({selectedKpi.warning_threshold})</text>

                <line x1="0" y1="180" x2="700" y2="180" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6 3" />
                <text x="10" y="174" fill="#ef4444" fontSize="11">Critical ({selectedKpi.critical_threshold})</text>

                {/* Simulated Reading Marker Line */}
                <polyline
                  fill="none"
                  stroke={selectedKpi.status === "CRITICAL" ? "#ef4444" : selectedKpi.status === "WARNING" ? "#eab308" : "#22c55e"}
                  strokeWidth="3.5"
                  points="50,110 200,95 400,105 580,100 680,100"
                />
                <circle cx="680" cy="100" r="6" fill="#38bdf8" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Live Readings Table */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Live Simulated Readings Registry</h2>
            <p>Active values pushed through pipeline on current cycle.</p>
          </div>
        </div>

        {monitoringData.length > 0 ? (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>KPI Name</th>
                  <th>Department</th>
                  <th>Current Reading</th>
                  <th>Target Value</th>
                  <th>Warning Threshold</th>
                  <th>Critical Threshold</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {monitoringData.map((k) => (
                  <tr key={k.id} onClick={() => setSelectedKpiId(k.id)} style={{ cursor: "pointer" }}>
                    <td><strong>{k.kpi_name}</strong></td>
                    <td>{k.department}</td>
                    <td><strong>{k.current_value} {k.unit}</strong></td>
                    <td>{k.target_value} {k.unit}</td>
                    <td>{k.warning_threshold}</td>
                    <td>{k.critical_threshold}</td>
                    <td>
                      <span className={`status-badge ${(k.status || "").toLowerCase()}`}>
                        {k.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📈</div>
            <h3>No simulation data active</h3>
            <p>Start simulation to begin rendering live trajectory stream.</p>
          </div>
        )}
      </div>
    </div>
  );
}
