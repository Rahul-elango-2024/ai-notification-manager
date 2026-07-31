import React, { useEffect, useState, memo } from "react";

function useAnimatedCounter(targetValue, duration = 700) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const target = Number(targetValue) || 0;
    const startValue = 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * (target - startValue) + startValue));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [targetValue, duration]);

  return count;
}

const IncidentStats = memo(function IncidentStats({ incidents = [] }) {
  const total = incidents.length;
  const openCount = incidents.filter((i) => i.status === "OPEN").length;
  const inProgressCount = incidents.filter((i) => i.status === "IN_PROGRESS").length;
  const resolvedCount = incidents.filter((i) => i.status === "RESOLVED" || i.status === "CLOSED").length;
  const criticalCount = incidents.filter(
    (i) => (i.severity || i.priority) === "CRITICAL"
  ).length;

  const animTotal = useAnimatedCounter(total);
  const animOpen = useAnimatedCounter(openCount);
  const animProgress = useAnimatedCounter(inProgressCount);
  const animResolved = useAnimatedCounter(resolvedCount);
  const animCritical = useAnimatedCounter(criticalCount);

  return (
    <div className="incident-stats-grid" role="region" aria-label="Incident Summary Key Performance Indicators">
      {/* Total Incidents */}
      <div className="inc-stat-card card-total accent-blue glow-blue">
        <div className="stat-header">
          <span className="stat-label">Total Incidents</span>
          <div className="stat-icon icon-blue-large">🛡️</div>
        </div>
        <div className="stat-value-group">
          <span className="stat-number">{animTotal}</span>
          <span className="stat-trend badge-neutral">Registered</span>
        </div>
        <span className="stat-subtext">Active & historical records</span>
      </div>

      {/* Open Incidents */}
      <div className="inc-stat-card card-open accent-red glow-red">
        <div className="stat-header">
          <span className="stat-label">Open</span>
          <div className="stat-icon icon-red-large">🚨</div>
        </div>
        <div className="stat-value-group">
          <span className="stat-number">{animOpen}</span>
          <span className={`stat-trend ${openCount > 0 ? "badge-urgent" : "badge-good"}`}>
            {openCount > 0 ? "Action Required" : "All Handled"}
          </span>
        </div>
        <span className="stat-subtext">Pending triage & response</span>
      </div>

      {/* In Progress */}
      <div className="inc-stat-card card-progress accent-indigo glow-indigo">
        <div className="stat-header">
          <span className="stat-label">In Progress</span>
          <div className="stat-icon icon-indigo-large">⚙️</div>
        </div>
        <div className="stat-value-group">
          <span className="stat-number">{animProgress}</span>
          <span className="stat-trend badge-active">Active Triage</span>
        </div>
        <span className="stat-subtext">Under active investigation</span>
      </div>

      {/* Resolved */}
      <div className="inc-stat-card card-resolved accent-emerald glow-emerald">
        <div className="stat-header">
          <span className="stat-label">Resolved</span>
          <div className="stat-icon icon-emerald-large">✅</div>
        </div>
        <div className="stat-value-group">
          <span className="stat-number">{animResolved}</span>
          <span className="stat-trend badge-success">Resolved</span>
        </div>
        <span className="stat-subtext">Verified & closed items</span>
      </div>

      {/* Critical Priority */}
      <div className="inc-stat-card card-critical accent-purple glow-purple">
        <div className="stat-header">
          <span className="stat-label">Critical</span>
          <div className="stat-icon icon-purple-large">🔥</div>
        </div>
        <div className="stat-value-group">
          <span className="stat-number">{animCritical}</span>
          <span className={`stat-trend ${criticalCount > 0 ? "badge-critical" : "badge-normal"}`}>
            {criticalCount > 0 ? "Sev 1 Alert" : "Zero Critical"}
          </span>
        </div>
        <span className="stat-subtext">Critical priority outages</span>
      </div>
    </div>
  );
});

export default IncidentStats;
