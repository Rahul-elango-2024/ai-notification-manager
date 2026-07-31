import React, { memo } from "react";

const CompactActivityFeed = memo(function CompactActivityFeed() {
  const events = [
    { time: "10:24", title: "Payment latency increased", type: "warning" },
    { time: "10:26", title: "AI generated recommendation", type: "info" },
    { time: "10:28", title: "Scaling approved", type: "success" },
    { time: "10:31", title: "Mitigation completed", type: "success" },
  ];

  return (
    <div className="section-card compact-activity-panel">
      <div className="section-card-header">
        <h2 className="section-title">Live Activity Feed</h2>
        <span className="caption-text">Recent audit events</span>
      </div>

      <div className="timeline-compact-list">
        {events.map((ev, idx) => (
          <div key={idx} className="timeline-compact-item">
            <span className="timeline-time">{ev.time}</span>
            <span className="timeline-dot" />
            <span className="timeline-title">{ev.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default CompactActivityFeed;
