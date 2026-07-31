import React, { memo } from "react";

const ExecutiveTimeline = memo(function ExecutiveTimeline() {
  const steps = [
    { stage: "Incident Detected", time: "10:14 AM", status: "COMPLETED", detail: "940ms Payment Webhook latency spike triggered telemetry threshold alert." },
    { stage: "AI Root Cause Analysis", time: "10:15 AM", status: "COMPLETED", detail: "Gemini AI identified PgBouncer connection pool starvation (88% saturation)." },
    { stage: "Executive Approval", time: "10:20 AM", status: "COMPLETED", detail: "CTO approved pod scaling replica increase from 4 to 12." },
    { stage: "Automated Mitigation", time: "10:24 AM", status: "IN_PROGRESS", detail: "Kubernetes HPA scaling replica pods to 12." },
    { stage: "Telemetry Recovery", time: "Pending", status: "PENDING", detail: "Monitoring latency drop below 200ms target threshold." },
    { stage: "Incident Resolution", time: "Pending", status: "PENDING", detail: "Post-incident audit log generation and retrospective sign-off." },
  ];

  return (
    <div className="panel executive-timeline-panel">
      <div className="panel-header">
        <div>
          <h2>📉 Incident Lifecycle & Executive Progress Timeline</h2>
          <p>Chronological stage progression tracking active incidents from detection to automated recovery.</p>
        </div>
      </div>

      <div className="lifecycle-stepper-grid">
        {steps.map((stg, idx) => (
          <div key={idx} className={`stepper-card status-${stg.status.toLowerCase()}`}>
            <div className="stepper-head">
              <span className="step-num">{idx + 1}</span>
              <span className="step-time">{stg.time}</span>
            </div>
            <strong className="step-stage-title">{stg.stage}</strong>
            <p className="step-detail-text">{stg.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

export default ExecutiveTimeline;
