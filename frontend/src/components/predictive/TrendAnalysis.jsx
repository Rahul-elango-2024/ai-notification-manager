import React, { memo } from "react";

const TrendAnalysis = memo(function TrendAnalysis() {
  const increasingKpis = [
    { name: "API Response Latency", value: "340ms → 890ms", change: "+161%", status: "UP_ALERT" },
    { name: "Database Pool Usage", value: "65% → 94%", change: "+44%", status: "UP_ALERT" },
    { name: "Error Log Ingestion", value: "1.2k/min → 4.8k/min", change: "+300%", status: "UP_ALERT" },
  ];

  const decliningKpis = [
    { name: "Checkout Conversion Rate", value: "98.2% → 91.4%", change: "-6.8%", status: "DOWN_ALERT" },
    { name: "SLA Availability Rate", value: "99.9% → 98.6%", change: "-1.3%", status: "DOWN_ALERT" },
    { name: "Cache Hit Ratio", value: "94.0% → 81.2%", change: "-12.8%", status: "DOWN_ALERT" },
  ];

  return (
    <div className="panel trend-analysis-panel" role="region" aria-label="KPI Trend Analysis & Seasonality">
      <div className="panel-header">
        <div>
          <h2>📈 KPI Trend Analysis & Seasonality Comparison</h2>
          <p>Statistical comparison of accelerating metrics, declining performance indicators, and temporal seasonality pattern shifts.</p>
        </div>
      </div>

      <div className="trend-grid-layout">
        {/* Increasing Metrics */}
        <div className="trend-box accent-red-box">
          <h3 className="trend-box-title">🔺 Rapidly Increasing Metrics (Risk Vectors)</h3>
          <div className="trend-list">
            {increasingKpis.map((kpi, idx) => (
              <div key={idx} className="trend-item-row">
                <div className="trend-item-info">
                  <strong className="trend-item-name">{kpi.name}</strong>
                  <span className="trend-item-val">{kpi.value}</span>
                </div>
                <span className="trend-badge badge-red">{kpi.change}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Declining Metrics */}
        <div className="trend-box accent-amber-box">
          <h3 className="trend-box-title">🔻 Declining Performance Indicators</h3>
          <div className="trend-list">
            {decliningKpis.map((kpi, idx) => (
              <div key={idx} className="trend-item-row">
                <div className="trend-item-info">
                  <strong className="trend-item-name">{kpi.name}</strong>
                  <span className="trend-item-val">{kpi.value}</span>
                </div>
                <span className="trend-badge badge-amber">{kpi.change}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Seasonality & Period Comparison */}
        <div className="trend-box accent-blue-box full-width-trend-box">
          <h3 className="trend-box-title">🗓️ Temporal Seasonality & Historical Comparison</h3>
          <div className="comparison-metrics-grid">
            <div className="comp-card">
              <span className="comp-label">Weekly Comparison (WoW)</span>
              <span className="comp-value val-red">+24.5% Incident Volume</span>
              <span className="comp-sub">Compared to previous 7 days</span>
            </div>
            <div className="comp-card">
              <span className="comp-label">Monthly Comparison (MoM)</span>
              <span className="comp-value val-amber">+12.1% SLA Variance</span>
              <span className="comp-sub">Compared to previous month</span>
            </div>
            <div className="comp-card">
              <span className="comp-label">Yearly Comparison (YoY)</span>
              <span className="comp-value val-green">-18.4% Average MTTR</span>
              <span className="comp-sub">Improved resolution velocity</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TrendAnalysis;
