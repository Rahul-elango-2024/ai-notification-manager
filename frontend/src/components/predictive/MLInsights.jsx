import React, { memo } from "react";

const MLInsights = memo(function MLInsights() {
  const correlationMatrix = [
    { metricA: "DB Connection Pool", metricB: "API Response Time", correlation: "0.94 (Strong Positive)" },
    { metricA: "Error Log Volume", metricB: "CPU Utilization", correlation: "0.87 (Strong Positive)" },
    { metricA: "Memory Usage", metricB: "Cache Hit Ratio", correlation: "-0.79 (Strong Inverse)" },
    { metricA: "Active Users", metricB: "Queue Processing Time", correlation: "0.68 (Moderate)" },
  ];

  const seasonality = [
    { period: "Daily Peak", time: "14:00 - 16:00 EST", pattern: "+45% Ingest Traffic", recommendation: "Auto-scale API pod instances at 13:30." },
    { period: "Weekly Peak", time: "Thursdays & Fridays", pattern: "+80% Report Export Requests", recommendation: "Allocate extra read-replica resources." },
    { period: "Monthly Peak", time: "Last 2 Days of Month", pattern: "+140% Payment Webhooks", recommendation: "Pre-warm Payment Gateway connections." },
  ];

  return (
    <div className="panel ml-insights-panel" role="region" aria-label="Machine Learning Insights & Correlation Matrix">
      <div className="panel-header">
        <div>
          <h2>🧠 Machine Learning Insights & Telemetry Correlation Matrix</h2>
          <p>Pattern recognition, historical seasonality analysis, and multi-variable correlation modeling.</p>
        </div>
      </div>

      <div className="ml-insights-grid">
        {/* Correlation Matrix Box */}
        <div className="ml-box correlation-box">
          <h3 className="ml-box-title">🔗 Telemetry Correlation Matrix</h3>
          <div className="correlation-list">
            {correlationMatrix.map((item, idx) => (
              <div key={idx} className="correlation-row">
                <div className="corr-metrics">
                  <strong>{item.metricA}</strong>
                  <span className="corr-vs">vs</span>
                  <strong>{item.metricB}</strong>
                </div>
                <span className="corr-value-badge">{item.correlation}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Seasonality Box */}
        <div className="ml-box seasonality-box">
          <h3 className="ml-box-title">📅 Historical Seasonality Patterns</h3>
          <div className="seasonality-list">
            {seasonality.map((item, idx) => (
              <div key={idx} className="seasonality-row">
                <div className="season-header">
                  <span className="season-period">{item.period}</span>
                  <span className="season-time">{item.time}</span>
                </div>
                <strong className="season-pattern">{item.pattern}</strong>
                <p className="season-rec">💡 <strong>Action:</strong> {item.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default MLInsights;
