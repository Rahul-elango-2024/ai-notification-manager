import React from "react";

export default function OverviewTab({
  status,
  scenarios,
  monitoringData,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  onRefresh,
}) {
  const isRunning = status?.status === "RUNNING";
  const isPaused = status?.status === "PAUSED";
  const isStopped = status?.status === "STOPPED";

  const currentScenarioObj = scenarios.find((s) => s.id === status?.currentScenario) || scenarios[0];

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="tab-content overview-tab">
      {/* Live Simulation Controls & Status Panel */}
      <div className="panel sim-control-panel">
        <div className="sim-status-header">
          <div className="sim-status-badge-group">
            <span className={`status-pill ${status?.status?.toLowerCase()}`}>
              <span className="pulse-dot" /> {status?.status || "STOPPED"}
            </span>
            <span className="scenario-tag">Scenario: <strong>{status?.scenarioName}</strong></span>
          </div>

          {/* Controls Bar */}
          <div className="sim-action-buttons">
            {isStopped && (
              <button className="primary-button green" onClick={() => onStart(status?.currentScenario || "NORMAL", status?.speedSeconds || 10)}>
                ▶ Start Simulation
              </button>
            )}

            {isRunning && (
              <button className="secondary-button yellow" onClick={onPause}>
                ⏸ Pause
              </button>
            )}

            {isPaused && (
              <button className="primary-button green" onClick={onResume}>
                ▶ Resume
              </button>

            )}

            {!isStopped && (
              <button className="secondary-button red" onClick={onStop}>
                ⏹ Stop
              </button>
            )}

            <button className="secondary-button" onClick={onReset}>
              ↺ Reset to Baselines
            </button>

            <button className="secondary-button" onClick={onRefresh}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <section className="metric-grid">
          <div className="metric-card blue">
            <div className="metric-card-top">
              <div className="metric-icon blue">⏱</div>
              <span className="metric-label">Elapsed Time</span>
            </div>
            <strong className="metric-value">{formatTime(status?.elapsedSeconds || 0)}</strong>
            <span className="metric-description">Active run timer</span>
          </div>

          <div className="metric-card purple">
            <div className="metric-card-top">
              <div className="metric-icon purple">⚡</div>
              <span className="metric-label">Cycle Speed</span>
            </div>
            <strong className="metric-value">{status?.speedSeconds || 10}s</strong>
            <span className="metric-description">Tick frequency</span>
          </div>

          <div className="metric-card yellow">
            <div className="metric-card-top">
              <div className="metric-icon yellow">📊</div>
              <span className="metric-label">Readings Ingested</span>
            </div>
            <strong className="metric-value">{status?.readingsGeneratedCount || 0}</strong>
            <span className="metric-description">Total metric updates</span>
          </div>

          <div className="metric-card red">
            <div className="metric-card-top">
              <div className="metric-icon red">▲</div>
              <span className="metric-label">Alerts Triggered</span>
            </div>
            <strong className="metric-value">{status?.alertsGeneratedCount || 0}</strong>
            <span className="metric-description">Pipeline alerts created</span>
          </div>
        </section>
      </div>

      {/* Main Layout Grid */}
      <div className="overview-layout">
        {/* Active Scenario Card */}
        {currentScenarioObj && (
          <div className="panel scenario-active-card">
            <div className="panel-header">
              <div>
                <h2>Active Scenario Specification</h2>
                <p>Mathematical trend and operational event parameters.</p>
              </div>
              <span className={`status-badge ${(currentScenarioObj.targetRisk || "").toLowerCase()}`}>
                {currentScenarioObj.targetRisk} TARGET RISK
              </span>
            </div>

            <div className="scenario-details-body">
              <h3>{currentScenarioObj.name}</h3>
              <p>{currentScenarioObj.description}</p>
            </div>
          </div>
        )}

        {/* Live KPI Monitoring Snapshot Feed */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Live Monitored KPI Trajectories</h2>
              <p>Real-time values being processed by the monitoring pipeline.</p>
            </div>
            <span className="count-badge">{monitoringData.length} Monitored Metric(s)</span>
          </div>

          {monitoringData.length > 0 ? (
            <div className="compact-kpi-list">
              {monitoringData.map((kpi) => (
                <div className="compact-kpi-row" key={kpi.id}>
                  <div className="kpi-identity">
                    <div>
                      <strong>{kpi.kpi_name}</strong>
                      <span>{kpi.department}</span>
                    </div>
                  </div>

                  <div className="compact-value">
                    <span>Target: {kpi.target_value} {kpi.unit}</span>
                    <strong>Current: {kpi.current_value} {kpi.unit}</strong>
                  </div>

                  <div className="risk-score-pill">
                    <span className={`status-badge ${(kpi.status || "").toLowerCase()}`}>
                      {kpi.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>No monitoring data stream</h3>
              <p>Start simulation to begin generating real-time KPI trajectories.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
