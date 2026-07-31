import React from "react";

export default function Timeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="timeline-empty">
        <p>No timeline records recorded for this incident yet.</p>
      </div>
    );
  }

  const getActionIcon = (action = "") => {
    const act = action.toLowerCase();
    if (act.includes("created")) return "🚀";
    if (act.includes("resolved")) return "✅";
    if (act.includes("status")) return "🔄";
    if (act.includes("priority")) return "⚡";
    if (act.includes("assign")) return "👤";
    if (act.includes("description") || act.includes("update")) return "📝";
    return "📌";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="timeline-container">
      <div className="timeline-track">
        {timeline.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === timeline.length - 1;

          return (
            <div key={item.id || index} className="timeline-item">
              <div className="timeline-marker-wrapper">
                <div className={`timeline-icon-badge ${isFirst ? "first" : ""} ${isLast ? "last" : ""}`}>
                  {getActionIcon(item.action)}
                </div>
                {!isLast && <div className="timeline-connector-line" />}
              </div>

              <div className="timeline-content-card">
                <div className="timeline-card-header">
                  <span className="timeline-action-title">{item.action}</span>
                  <span className="timeline-timestamp">{formatDate(item.created_at)}</span>
                </div>

                {item.notes && (
                  <p className="timeline-notes">{item.notes}</p>
                )}

                <div className="timeline-author">
                  <span className="author-icon">👤</span>
                  <span className="author-name">
                    {item.performed_by_name || (item.performed_by ? `User ID ${item.performed_by}` : "System Automated")}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
