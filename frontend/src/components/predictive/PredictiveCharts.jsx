import React, { useState, memo } from "react";

const PredictiveCharts = memo(function PredictiveCharts({ forecasts = [] }) {
  const [timeframe, setTimeframe] = useState("7d"); // "7d", "30d", "90d"

  // Mock forecast series generator depending on active timeframe
  const periodMultiplier = timeframe === "7d" ? 1 : timeframe === "30d" ? 3.5 : 8;

  // 1. KPI Forecast Data
  const kpiForecastSeries = [
    { label: "Day 1", value: 92 },
    { label: "Day 2", value: 89 },
    { label: "Day 3", value: 85 },
    { label: "Day 4", value: 78 },
    { label: "Day 5", value: 72 },
    { label: "Day 6", value: 68 },
    { label: "Day 7", value: 64 },
  ];

  // 2. Incident Prediction Trend
  const incidentTrendSeries = [
    { label: "Mon", count: 2 },
    { label: "Tue", count: 3 },
    { label: "Wed", count: 6 },
    { label: "Thu", count: 4 },
    { label: "Fri", count: 8 },
    { label: "Sat", count: 3 },
    { label: "Sun", count: 2 },
  ];

  // 3. Alert Volume Prediction
  const alertVolumeSeries = [
    { time: "00:00", volume: 120 },
    { time: "04:00", volume: 180 },
    { time: "08:00", volume: 450 },
    { time: "12:00", volume: 890 },
    { time: "16:00", volume: 620 },
    { time: "20:00", volume: 310 },
  ];

  // 4. Revenue Impact Forecast ($k)
  const revenueSeries = [
    { name: "Payments API", current: "$450k", predictedLoss: "$35k", risk: "HIGH" },
    { name: "Checkout Pipeline", current: "$890k", predictedLoss: "$82k", risk: "CRITICAL" },
    { name: "Auth Service", current: "$230k", predictedLoss: "$8k", risk: "MEDIUM" },
    { name: "Notification Engine", current: "$120k", predictedLoss: "$2k", risk: "LOW" },
  ];

  // 5. Infrastructure Load Forecast
  const infraLoadSeries = [
    { service: "Database Cluster", load: 88, status: "WARNING" },
    { service: "API Gateway", load: 94, status: "CRITICAL" },
    { service: "Redis Cache", load: 62, status: "NORMAL" },
    { service: "RabbitMQ Queue", load: 76, status: "NORMAL" },
  ];

  return (
    <div className="incident-charts-section panel predictive-charts-section" role="region" aria-label="AI Forecasting Dashboards">
      <div className="panel-header">
        <div>
          <h2>AI Forecasting & Risk Projections</h2>
          <p>Ensemble predictive models forecasting telemetry trends, incident volume, revenue impact, and server load.</p>
        </div>
        
        {/* Timeframe Selector */}
        <div className="chart-tab-selector">
          <button
            className={`tab-btn ${timeframe === "7d" ? "active" : ""}`}
            onClick={() => setTimeframe("7d")}
          >
            7 Days
          </button>
          <button
            className={`tab-btn ${timeframe === "30d" ? "active" : ""}`}
            onClick={() => setTimeframe("30d")}
          >
            30 Days
          </button>
          <button
            className={`tab-btn ${timeframe === "90d" ? "active" : ""}`}
            onClick={() => setTimeframe("90d")}
          >
            90 Days
          </button>
        </div>
      </div>

      <div className="charts-grid-layout">
        {/* Chart 1: KPI Forecast Line */}
        <div className="chart-box rounded-chart-box">
          <div className="chart-box-header">
            <h3 className="chart-title">KPI Degradation Forecast ({timeframe})</h3>
            <span className="chart-subtitle">Predicted average performance trajectory</span>
          </div>
          <div className="line-chart-container tall-line-container-220">
            <svg className="trend-svg" viewBox="0 0 600 220" preserveAspectRatio="none">
              <line x1="40" y1="40" x2="560" y2="40" stroke="var(--border)" strokeDasharray="4 4" opacity="0.6" />
              <line x1="40" y1="110" x2="560" y2="110" stroke="var(--border)" strokeDasharray="4 4" opacity="0.6" />
              <line x1="40" y1="180" x2="560" y2="180" stroke="var(--border)" strokeOpacity="0.8" />

              <polyline
                fill="none"
                stroke="#ef4444"
                strokeWidth="3.5"
                points="40,50 120,70 200,95 280,130 360,155 440,170 520,185"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {kpiForecastSeries.map((item, idx) => {
                const x = 40 + idx * 80;
                const y = 50 + idx * 22;
                return (
                  <g key={idx}>
                    <circle cx={x} cy={y} r="5" fill="#ef4444" stroke="var(--card)" strokeWidth="2" />
                    <text x={x} y={y - 12} textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="700">
                      {Math.round(item.value / periodMultiplier)}%
                    </text>
                    <text x={x} y="205" textAnchor="middle" fill="var(--text-muted)" fontSize="11">
                      {item.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Chart 2: Incident Prediction Trend Bar */}
        <div className="chart-box rounded-chart-box">
          <div className="chart-box-header">
            <h3 className="chart-title">Incident Volume Prediction</h3>
            <span className="chart-subtitle">Forecasted incident creation density</span>
          </div>
          <div className="bar-chart-container tall-bar-container-220">
            {incidentTrendSeries.map((item, idx) => {
              const val = Math.round(item.count * (timeframe === "30d" ? 3 : timeframe === "90d" ? 7 : 1));
              const heightPercent = Math.min(100, val * 12);
              return (
                <div key={idx} className="bar-column">
                  <span className="bar-count-tag">{val}</span>
                  <div className="bar-track bar-track-220">
                    <div
                      className="bar-fill"
                      style={{
                        height: `${Math.max(heightPercent, 14)}%`,
                        background: val >= 6 ? "linear-gradient(180deg, #ef4444, #b91c1c)" : "linear-gradient(180deg, #f59e0b, #b45309)",
                      }}
                    />
                  </div>
                  <span className="bar-label">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 3: Revenue Impact Forecast */}
        <div className="chart-box rounded-chart-box">
          <div className="chart-box-header">
            <h3 className="chart-title">Revenue & SLA Impact Forecast</h3>
            <span className="chart-subtitle">Estimated financial risk per service module</span>
          </div>
          <div className="revenue-impact-list">
            {revenueSeries.map((rev, idx) => (
              <div key={idx} className="revenue-impact-row">
                <div className="impact-name-group">
                  <strong className="impact-service-name">{rev.name}</strong>
                  <span className="impact-current-val">Base Revenue: {rev.current}</span>
                </div>
                <div className="impact-risk-group">
                  <span className={`impact-risk-badge risk-${rev.risk.toLowerCase()}`}>
                    -{rev.predictedLoss} Est. Loss
                  </span>
                  <span className="impact-risk-level">{rev.risk} Risk</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 4: Infrastructure Load Forecast */}
        <div className="chart-box rounded-chart-box">
          <div className="chart-box-header">
            <h3 className="chart-title">Infrastructure Load Forecast</h3>
            <span className="chart-subtitle">Predicted resource utilization thresholds</span>
          </div>
          <div className="infra-load-container">
            {infraLoadSeries.map((infra, idx) => (
              <div key={idx} className="infra-load-row">
                <div className="infra-label-bar">
                  <span className="infra-name">{infra.service}</span>
                  <span className="infra-percent">{infra.load}% Load</span>
                </div>
                <div className="infra-progress-track">
                  <div
                    className="infra-progress-fill"
                    style={{
                      width: `${infra.load}%`,
                      background: infra.load > 90 ? "#ef4444" : infra.load > 75 ? "#f59e0b" : "#3b82f6",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default PredictiveCharts;
