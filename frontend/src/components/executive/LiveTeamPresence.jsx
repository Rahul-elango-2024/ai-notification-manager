import React, { memo } from "react";

const LiveTeamPresence = memo(function LiveTeamPresence({ users = [] }) {
  const defaultUsers = [
    { id: 1, user_name: "Sarah Jenkins", department: "Executive", role: "CTO", status: "Available", activity: "Reviewing Executive Dashboard" },
    { id: 2, user_name: "Alex Rivera", department: "IT Infrastructure", role: "Principal SRE", status: "Investigating", activity: "Troubleshooting DB Connection Pool" },
    { id: 3, user_name: "Elena Rostova", department: "Security", role: "CISO", status: "Busy", activity: "Security WAF Rule Audit" },
    { id: 4, user_name: "Marcus Vance", department: "Finance", role: "VP Engineering", status: "Available", activity: "Monitoring Payment SLA Metrics" },
    { id: 5, user_name: "Priya Sharma", department: "Customer Support", role: "Lead Engineer", status: "Available", activity: "Managing Escalated Ticket Queue" },
  ];

  const list = users.length > 0 ? users : defaultUsers;

  return (
    <div className="panel live-team-presence-panel">
      <div className="panel-header">
        <div>
          <h2>👥 Live Team Presence & Operational Status</h2>
          <p>Real-time availability, department assignment, and active operational status of executives and engineers.</p>
        </div>
        <span className="count-badge">{list.length} Members Online</span>
      </div>

      <div className="presence-grid">
        {list.map((u) => {
          const statusLower = (u.status || "Available").toLowerCase();
          return (
            <div key={u.id} className="presence-card">
              <div className="presence-card-top">
                <div className="user-avatar-badge">{u.user_name.charAt(0)}</div>
                <div className="user-info-block">
                  <strong className="user-name-text">{u.user_name}</strong>
                  <span className="user-role-text">{u.role} ({u.department})</span>
                </div>
              </div>

              <div className="presence-status-row">
                <span className={`status-dot dot-${statusLower}`} />
                <span className="status-label-text">{u.status}</span>
              </div>

              <p className="user-activity-text">📍 {u.activity || "Active on platform"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default LiveTeamPresence;
