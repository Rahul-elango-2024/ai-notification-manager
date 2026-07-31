import React, { memo } from "react";

const PredictiveAnomalies = memo(function PredictiveAnomalies({ anomalies = [] }) {
  const defaultAnomalies = [
    {
      id: 1,
      department: "Finance",
      kpiName: "Payment Webhook Latency",
      currentValue: "940 ms",
      expectedValue: "180 ms",
      confidence: 96.4,
      severity: "CRITICAL",
      impact: "Payment processing delays may breach 99.9% SLA within 6 hours.",
      suggestedAction: "Scale Payment Webhook worker replicas from 4 to 12.",
    },
    {
      id: 2,
      department: "IT Infrastructure",
      kpiName: "PostgreSQL DB Connection Pool",
      currentValue: "88% Pool",
      expectedValue: "42% Pool",
      confidence: 94.1,
      severity: "HIGH",
      impact: "Risk of connection starvation during 09:00 AM peak traffic surge.",
      suggestedAction: "Increase PgBouncer max_client_conn limit & clear idle sessions.",
    },
    {
      id: 3,
      department: "Security",
      kpiName: "Auth Service Rate Limits",
      currentValue: "4,200 req/min",
      expectedValue: "1,100 req/min",
      confidence: 91.8,
      severity: "HIGH",
      impact: "Potential brute-force or credential stuffing pattern detected.",
      suggestedAction: "Enable Cloudflare IP rate limiting rule #402 for /api/v1/auth.",
    },
    {
      id: 4,
      department: "Customer Support",
      kpiName: "Ticket Queue Backlog",
      currentValue: "142 Tickets",
      expectedValue: "45 Tickets",
      confidence: 89.2,
      severity: "MEDIUM",
      impact: "CSAT score predicted to drop from 4.8 to 4.1 if unhandled.",
      suggestedAction: "Reassign 3 tier-2 support engineers to high-priority queue.",
    },
  ];

  const displayList = anomalies.length > 0 ? anomalies : defaultAnomalies;

  return (
    <div className="panel predictive-anomalies-panel" role="region" aria-label="AI Anomaly Detection">
      <div className="panel-header">
        <div>
          <h2>⚡ AI Anomaly Detection & Early Warning</h2>
          <p>Real-time machine learning telemetry detection comparing active metrics against predicted historical baselines.</p>
        </div>
        <span className="count-badge">{displayList.length} Anomalies Detected</span>
      </div>

      <div className="anomaly-cards-grid">
        {displayList.map((item) => (
          <div key={item.id} className={`anomaly-card ${item.severity.toLowerCase()}`}>
            <div className="anomaly-card-header">
              <div>
                <span className="anomaly-dept">{item.department}</span>
                <h3>{item.kpiName}</h3>
              </div>
              <span className={`priority-badge prio-${item.severity.toLowerCase()}`}>
                {item.severity}
              </span>
            </div>

            <div className="anomaly-stat-row">
              <div className="anomaly-stat">
                <span>Current</span>
                <strong>{item.currentValue}</strong>
              </div>
              <div className="anomaly-stat">
                <span>Expected</span>
                <strong className="predicted-val">{item.expectedValue}</strong>
              </div>
              <div className="anomaly-stat">
                <span>AI Confidence</span>
                <strong className="diff-val">{item.confidence}%</strong>
              </div>
            </div>

            <div className="anomaly-impact-block">
              <span className="anomaly-impact-label">Business Impact:</span>
              <p className="anomaly-impact-text">{item.impact}</p>
            </div>

            <div className="anomaly-meta">
              <span className="suggested-action">💡 <strong>Suggested Action:</strong> {item.suggestedAction}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default PredictiveAnomalies;
