import React, { useEffect, useState, memo } from "react";

function useAnimatedCounter(targetValue, duration = 800) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const target = Number(targetValue) || 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [targetValue, duration]);

  return count;
}

const ExecutiveKpis = memo(function ExecutiveKpis({ overview = {} }) {
  const onlineUsers = overview.onlineUsers || 18;
  const pendingTasks = overview.pendingTasks || 7;
  const criticalIncidents = overview.criticalIncidents || 3;
  const pendingApprovals = overview.pendingApprovals || 4;

  const animUsers = useAnimatedCounter(onlineUsers);
  const animTasks = useAnimatedCounter(pendingTasks);
  const animIncidents = useAnimatedCounter(criticalIncidents);
  const animApprovals = useAnimatedCounter(pendingApprovals);

  return (
    <div className="summary-kpis-grid" role="region" aria-label="Summary KPI Cards">
      {/* 1. Online Users */}
      <div className="kpi-card">
        <div className="kpi-card-header">
          <span className="kpi-title">Online Users</span>
          <span className="badge badge-success">5 Active Rooms</span>
        </div>
        <div className="kpi-card-body">
          <span className="kpi-metric">{animUsers}</span>
          <div className="sparkline-container">
            <svg viewBox="0 0 100 24" className="sparkline-svg">
              <path d="M0,18 Q20,12 40,16 T80,8 T100,12" fill="none" stroke="#16A34A" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. Pending Tasks */}
      <div className="kpi-card">
        <div className="kpi-card-header">
          <span className="kpi-title">Pending Tasks</span>
          <span className="badge badge-warning">2 Critical</span>
        </div>
        <div className="kpi-card-body">
          <span className="kpi-metric">{animTasks}</span>
          <div className="sparkline-container">
            <svg viewBox="0 0 100 24" className="sparkline-svg">
              <path d="M0,14 Q25,20 50,10 T80,18 T100,8" fill="none" stroke="#7C3AED" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Critical Incidents */}
      <div className="kpi-card">
        <div className="kpi-card-header">
          <span className="kpi-title">Critical Incidents</span>
          <span className="badge badge-danger">1 New</span>
        </div>
        <div className="kpi-card-body">
          <span className="kpi-metric">{animIncidents}</span>
          <div className="sparkline-container">
            <svg viewBox="0 0 100 24" className="sparkline-svg">
              <path d="M0,20 Q30,18 60,6 T80,14 T100,4" fill="none" stroke="#DC2626" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>

      {/* 4. Approvals Pending */}
      <div className="kpi-card">
        <div className="kpi-card-header">
          <span className="kpi-title">Approvals Pending</span>
          <span className="badge badge-warning">High Impact</span>
        </div>
        <div className="kpi-card-body">
          <span className="kpi-metric">{animApprovals}</span>
          <div className="sparkline-container">
            <svg viewBox="0 0 100 24" className="sparkline-svg">
              <path d="M0,16 Q20,22 50,12 T80,18 T100,10" fill="none" stroke="#F59E0B" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ExecutiveKpis;
