import React, { memo } from "react";

const NotificationCenter = memo(function NotificationCenter() {
  const notifications = [
    { id: 1, type: "CRITICAL", title: "Latency Anomaly Alert", msg: "Payment Webhook latency reached 940ms threshold.", time: "10m ago" },
    { id: 2, type: "SUCCESS", title: "Approval Executed", msg: "Cloudflare Rate Limiting Rule #402 deployed successfully.", time: "25m ago" },
    { id: 3, type: "WARNING", title: "DB Pool Saturation", msg: "PostgreSQL connection pool utilization at 88%.", time: "40m ago" },
    { id: 4, type: "INFO", title: "AI Model Retrained", msg: "Gemini Ensemble v2.4 predictive weights updated.", time: "1h ago" },
  ];

  return (
    <div className="panel notification-center-panel">
      <div className="panel-header">
        <div>
          <h2>🔔 Live Operational Notification Center</h2>
          <p>Real-time system notification stream classified by severity.</p>
        </div>
      </div>

      <div className="notification-list">
        {notifications.map((n) => (
          <div key={n.id} className={`notification-item type-${n.type.toLowerCase()}`}>
            <div className="notif-top">
              <strong className="notif-title">{n.title}</strong>
              <span className="notif-time">{n.time}</span>
            </div>
            <p className="notif-msg">{n.msg}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

export default NotificationCenter;
