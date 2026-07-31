import React, { memo } from "react";

const TeamPerformanceLeaderboard = memo(function TeamPerformanceLeaderboard() {
  const leaders = [
    { rank: 1, name: "Alex Rivera", role: "Principal SRE", resolved: 24, mttr: "14.2m", sla: "99.9%", aiAcceptance: "96.4%" },
    { rank: 2, name: "Elena Rostova", role: "CISO / SecOps", resolved: 19, mttr: "16.8m", sla: "99.8%", aiAcceptance: "94.0%" },
    { rank: 3, name: "Priya Sharma", role: "Lead Support Engineer", resolved: 18, mttr: "18.5m", sla: "99.5%", aiAcceptance: "91.2%" },
    { rank: 4, name: "Marcus Vance", role: "VP Engineering", resolved: 14, mttr: "21.0m", sla: "99.2%", aiAcceptance: "89.5%" },
  ];

  return (
    <div className="panel leaderboard-panel">
      <div className="panel-header">
        <div>
          <h2>🏆 Response Team Performance Leaderboard</h2>
          <p>Recognizing top engineering response speed, MTTR efficiency, SLA compliance, and AI recommendation adoption.</p>
        </div>
      </div>

      <div className="leaderboard-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Engineer / Leader</th>
              <th>Role</th>
              <th>Resolved Incidents</th>
              <th>Avg MTTR</th>
              <th>SLA Compliance</th>
              <th>AI Acceptance</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((l) => (
              <tr key={l.rank}>
                <td><strong>#{l.rank}</strong></td>
                <td><strong>{l.name}</strong></td>
                <td>{l.role}</td>
                <td><strong>{l.resolved}</strong></td>
                <td><span className="green-text">{l.mttr}</span></td>
                <td><span className="green-text">{l.sla}</span></td>
                <td><span className="blue-text">{l.aiAcceptance}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default TeamPerformanceLeaderboard;
