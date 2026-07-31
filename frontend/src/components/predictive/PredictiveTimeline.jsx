import React, { memo } from "react";

const PredictiveTimeline = memo(function PredictiveTimeline() {
  const events = [
    {
      time: "In 2 Hours (14:30 EST)",
      title: "Expected Latency Spike",
      component: "API Gateway Cluster",
      severity: "WARNING",
      type: "KPI Failure",
      probability: "88%",
      details: "Traffic surge pattern aligns with end-of-month billing reconciliations.",
      recommendation: "Pre-scale API Gateway pods from 8 to 16 before 14:00 EST.",
    },
    {
      time: "In 6 Hours (18:00 EST)",
      title: "Predicted DB Connection Exhaustion",
      component: "Primary DB Cluster",
      severity: "CRITICAL",
      type: "SLA Breach Risk",
      probability: "94%",
      details: "Idle connections accumulating without cleanup under sustained load.",
      recommendation: "Execute automated pool purge and restart secondary read replicas.",
    },
    {
      time: "In 14 Hours (02:00 EST)",
      title: "Scheduled Maintenance Window",
      component: "Redis In-Memory Cache",
      severity: "INFO",
      type: "Maintenance Recommendation",
      probability: "100%",
      details: "Recommended flush & cluster upgrade during lowest traffic window.",
      recommendation: "Apply Redis v7.2 patch; zero customer downtime expected.",
    },
    {
      time: "In 22 Hours (10:00 EST Tomorrow)",
      title: "Predicted Queue Backlog Surge",
      component: "RabbitMQ Event Pipeline",
      severity: "HIGH",
      type: "Expected Outage Risk",
      probability: "82%",
      details: "High event ingest rate from partner integrations expected.",
      recommendation: "Enable auto-scaling queue consumers and raise queue threshold alert.",
    },
  ];

  return (
    <div className="panel predictive-timeline-panel" role="region" aria-label="Predictive Operational Timeline">
      <div className="panel-header">
        <div>
          <h2>⏱️ Predictive Operational & Maintenance Timeline</h2>
          <p>AI-sequenced chronological forecast of upcoming incidents, SLA breach risks, and proactive maintenance windows.</p>
        </div>
      </div>

      <div className="predictive-timeline-container">
        {events.map((evt, idx) => (
          <div key={idx} className={`timeline-card severity-${evt.severity.toLowerCase()}`}>
            <div className="timeline-card-header">
              <div className="time-badge">
                <span>🕒 {evt.time}</span>
              </div>
              <span className={`priority-badge prio-${evt.severity.toLowerCase()}`}>
                {evt.type}
              </span>
            </div>

            <div className="timeline-card-body">
              <h3 className="timeline-title">{evt.title}</h3>
              <span className="timeline-component">Target Module: <strong>{evt.component}</strong> (AI Confidence: <strong>{evt.probability}</strong>)</span>
              <p className="timeline-details">{evt.details}</p>
            </div>

            <div className="timeline-card-footer">
              <span>🛠️ <strong>Recommended Action:</strong> {evt.recommendation}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default PredictiveTimeline;
