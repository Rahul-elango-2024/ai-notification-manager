import React, { memo } from "react";

const RootCausePrediction = memo(function RootCausePrediction() {
  const rootCauses = [
    {
      id: 1,
      cause: "PostgreSQL Connection Pool Starvation",
      probability: "94% Probability",
      impact: "High Latency & HTTP 500 Errors",
      triggerCondition: "Concurrent API traffic > 1,200 requests/sec",
      remediation: "Scale pool size to 250 connections & enable idle client pruning.",
      severity: "CRITICAL",
    },
    {
      id: 2,
      cause: "Memory Leak in Background Telemetry Worker",
      probability: "82% Probability",
      impact: "Node.js Process Eviction / OOM Kills",
      triggerCondition: "Heap memory allocation > 1.8 GB",
      remediation: "Restart worker process cluster & release unreferenced Socket.IO event listeners.",
      severity: "HIGH",
    },
    {
      id: 3,
      cause: "Third-Party Payment Webhook Rate Limiting",
      probability: "76% Probability",
      impact: "Checkout Transaction Timeouts",
      triggerCondition: "Stripe webhook retry rate > 5%",
      remediation: "Activate exponential backoff queue in RabbitMQ message broker.",
      severity: "HIGH",
    },
  ];

  return (
    <div className="panel root-cause-prediction-panel" role="region" aria-label="Preemptive Root Cause Prediction">
      <div className="panel-header">
        <div>
          <h2>🔍 Preemptive Root Cause Prediction</h2>
          <p>Machine learning classification identifying probable failure points before incident escalation.</p>
        </div>
      </div>

      <div className="root-cause-list">
        {rootCauses.map((rc) => (
          <div key={rc.id} className={`root-cause-card severity-${rc.severity.toLowerCase()}`}>
            <div className="rc-header">
              <div className="rc-title-group">
                <span className="rc-icon">⚡</span>
                <strong className="rc-name">{rc.cause}</strong>
              </div>
              <span className="rc-prob-badge">{rc.probability}</span>
            </div>

            <div className="rc-grid-details">
              <div className="rc-cell">
                <span className="rc-label">Predicted Impact</span>
                <span className="rc-val red-text">{rc.impact}</span>
              </div>
              <div className="rc-cell">
                <span className="rc-label">Trigger Condition</span>
                <span className="rc-val">{rc.triggerCondition}</span>
              </div>
              <div className="rc-cell full-width">
                <span className="rc-label">Suggested Preemptive Remediation</span>
                <span className="rc-val green-text">🔧 {rc.remediation}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default RootCausePrediction;
