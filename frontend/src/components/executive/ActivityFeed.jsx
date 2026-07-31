import React, { memo } from "react";

const ActivityFeed = memo(function ActivityFeed({ feed = [], onSelectActivity }) {
  const defaultFeed = [
    { id: 1, event_type: "INCIDENT_CREATED", actor_name: "AI Telemetry Engine", description: "Critical incident INC-9042 detected in Payment Gateway", category: "INCIDENT", created_at: "10:14 AM" },
    { id: 2, event_type: "TASK_ASSIGNED", actor_name: "Sarah Jenkins (CTO)", description: "Assigned DB Connection Pool tuning to Alex Rivera", category: "TASK", created_at: "10:18 AM" },
    { id: 3, event_type: "APPROVAL_REQUESTED", actor_name: "DevOps Bot", description: "Requested approval for auto-scaling API pod replicas to 16", category: "APPROVAL", created_at: "10:22 AM" },
    { id: 4, event_type: "AI_RECOMMENDATION", actor_name: "Gemini AI", description: "Generated prescriptive mitigation for Auth Service rate limits", category: "AI", created_at: "10:25 AM" },
  ];

  const list = feed.length > 0 ? feed : defaultFeed;

  return (
    <div className="panel activity-feed-panel" role="region" aria-label="Activity Feed">
      <div className="panel-header">
        <div>
          <h2>⚡ Live Activity Feed</h2>
          <p>Real-time operational events. Click any activity for details.</p>
        </div>
      </div>

      <div className="activity-feed-timeline">
        {list.map((item) => (
          <div
            key={item.id}
            className="feed-item-card clickable-card"
            onClick={() => onSelectActivity && onSelectActivity(item)}
          >
            <div className="feed-icon-marker">📌</div>
            <div className="feed-content-block">
              <div className="feed-top-row">
                <strong className="feed-actor">{item.actor_name}</strong>
                <span className="feed-cat-badge">{item.category}</span>
                <span className="feed-time">{item.created_at}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default ActivityFeed;
