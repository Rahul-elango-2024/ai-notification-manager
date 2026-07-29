import React, { useState } from "react";

export default function ScenariosTab({ scenarios, currentScenario, speedSeconds, onStart }) {
  const [selectedSpeed, setSelectedSpeed] = useState(speedSeconds || 10);

  const speedOptions = [
    { label: "5 Seconds", value: 5 },
    { label: "10 Seconds", value: 10 },
    { label: "30 Seconds", value: 30 },
    { label: "1 Minute", value: 60 },
    { label: "5 Minutes", value: 300 },
  ];

  return (
    <div className="tab-content scenarios-tab">
      {/* Controls Bar */}
      <div className="tab-control-bar">
        <div className="speed-selector-group">
          <span className="control-label">Simulation Speed / Frequency:</span>
          {speedOptions.map((opt) => (
            <button
              key={opt.value}
              className={`period-button ${selectedSpeed === opt.value ? "active" : ""}`}
              onClick={() => setSelectedSpeed(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scenario Gallery Cards Grid */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Simulation Scenario Preset Gallery</h2>
            <p>Pre-configured stochastic mathematical models for enterprise risk testing.</p>
          </div>
        </div>

        <div className="scenarios-grid">
          {scenarios.map((s) => {
            const isActive = currentScenario === s.id;
            return (
              <div className={`scenario-card ${isActive ? "active-scenario" : ""}`} key={s.id}>
                <div className="scenario-card-header">
                  <h3>{s.name}</h3>
                  <span className={`status-badge ${(s.targetRisk || "").toLowerCase()}`}>
                    {s.targetRisk} RISK
                  </span>
                </div>

                <p className="scenario-desc">{s.description}</p>

                <div className="scenario-card-footer">
                  {isActive ? (
                    <span className="active-badge">✓ CURRENTLY ACTIVE</span>
                  ) : (
                    <button
                      className="primary-button blue"
                      onClick={() => onStart(s.id, selectedSpeed)}
                    >
                      ▶ Activate Scenario
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
