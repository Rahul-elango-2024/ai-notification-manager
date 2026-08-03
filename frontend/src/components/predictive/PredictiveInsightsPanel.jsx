import React, { memo } from "react";

const PredictiveInsightsPanel = memo(function PredictiveInsightsPanel({ anomalies = [] }) {
  const defaultInsights = [
    {
      id: 1,
      title: "Database Latency Threshold Breach",
      insight: "Database query latency will likely exceed 850ms threshold within 12 hours due to unindexed join queries on the telemetry table.",
      severity: "CRITICAL",
      confidence: 96,
      estimatedTime: "Within 12 Hours",
      service: "PostgreSQL Database Cluster",
    },
    {
      id: 2,
      title: "API Gateway Traffic Degradation",
      insight: "API Gateway has an 87% chance of degradation under predicted peak morning traffic surges between 09:00 - 11:00 AM.",
      severity: "HIGH",
      confidence: 87,
      estimatedTime: "Tomorrow 09:00 AM",
      service: "API Gateway Ingestion",
    },
    {
      id: 3,
      title: "Revenue KPI SLA Drop Risk",
      insight: "Payment processing throughput may drop below the 99.5% SLA threshold by Friday if webhook retries remain elevated.",
      severity: "HIGH",
      confidence: 91,
      estimatedTime: "By Friday EOD",
      service: "Payments & Webhooks",
    },
    {
      id: 4,
      title: "Redis Memory Fragmentation Alert",
      insight: "Redis Cache node 3 memory allocation trend indicates possible eviction of cached session keys within 36 hours.",
      severity: "MEDIUM",
      confidence: 78,
      estimatedTime: "Within 36 Hours",
      service: "Redis Session Store",
    },
  ];

  const activeInsights = anomalies.length > 0 ? anomalies : defaultInsights;

  return (
    <div className="panel predictive-insights-panel" role="region" aria-label="Gemini AI Diagnostic Insights">
      <div className="panel-header">
        <div>
          <h2>🤖 AI Diagnostics</h2>
          <p>Priority signals.</p>
        </div>
        <span className="ai-live-badge">⚡ Live</span>
      </div>

      <div className="insights-grid-container">
        {activeInsights.map((item) => (
          <div key={item.id || item.kpi_id} className={`insight-card severity-${(item.severity || "HIGH").toLowerCase()}`}>
            <div className="insight-card-header">
              <div className="insight-title-group">
                <span className="insight-icon">💡</span>
                <strong className="insight-title-text">{item.title || item.kpi_name || "AI Diagnostic Alert"}</strong>
              </div>
              <span className={`status-pill stat-${(item.severity || "HIGH").toLowerCase()}`}>
                {item.severity || "HIGH"}
              </span>
            </div>

            <p className="insight-body-text">{item.insight || item.ai_recommendation || "Potential anomaly detected."}</p>

            <div className="insight-meta-footer">
              <span className="meta-tag">🎯 Confidence: <strong>{item.confidence || item.risk_percentage || 90}%</strong></span>
              <span className="meta-tag">⏱️ Target: <strong>{item.estimatedTime || "Near Future"}</strong></span>
              <span className="meta-tag">🖥️ Service: <strong>{item.service || item.department || "Infrastructure"}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default PredictiveInsightsPanel;
