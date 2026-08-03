import React, { useEffect, useState, memo } from "react";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

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

  // Deterministic mock trends ending in actual values
  const userTrend = [
    { time: '1h', val: Math.max(0, onlineUsers - 6) },
    { time: '30m', val: Math.max(0, onlineUsers - 2) },
    { time: '15m', val: onlineUsers + 2 },
    { time: 'Now', val: onlineUsers }
  ];

  const taskData = [
    { name: 'Low', count: Math.floor(pendingTasks * 0.2) },
    { name: 'Med', count: Math.floor(pendingTasks * 0.5) },
    { name: 'High', count: pendingTasks - Math.floor(pendingTasks * 0.2) - Math.floor(pendingTasks * 0.5) }
  ];

  const incidentTrend = [
    { time: '24h', count: 0 },
    { time: '12h', count: 1 },
    { time: '6h', count: Math.max(1, criticalIncidents - 1) },
    { time: 'Now', count: criticalIncidents }
  ];

  const approvalData = [
    { name: 'Pending', value: pendingApprovals },
    { name: 'Approved', value: Math.max(1, Math.floor(pendingApprovals * 0.5)) }
  ];
  const approvalColors = ['#F59E0B', '#10B981'];

  return (
    <div className="exec-summary-kpis-grid" role="region" aria-label="Summary KPI Cards">
      {/* 1. Online Users */}
      <div className="exec-kpi-card">
        <div className="exec-kpi-card-header">
          <span className="exec-kpi-title">Online Users</span>
          <span className="badge badge-success">5 Active Rooms</span>
        </div>
        <div className="exec-kpi-card-body">
          <span className="exec-kpi-metric">{animUsers}</span>
          <div className="exec-sparkline-container" style={{ width: '100px', height: '36px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userTrend}>
                <Line type="monotone" dataKey="val" stroke="#10B981" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2. Pending Tasks */}
      <div className="exec-kpi-card">
        <div className="exec-kpi-card-header">
          <span className="exec-kpi-title">Pending Tasks</span>
          <span className="badge badge-warning">2 Critical</span>
        </div>
        <div className="exec-kpi-card-body">
          <span className="exec-kpi-metric">{animTasks}</span>
          <div className="exec-sparkline-container" style={{ width: '100px', height: '36px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskData}>
                <Bar dataKey="count" fill="#7C3AED" radius={[2, 2, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Critical Incidents */}
      <div className="exec-kpi-card">
        <div className="exec-kpi-card-header">
          <span className="exec-kpi-title">Critical Incidents</span>
          <span className="badge badge-danger">1 New</span>
        </div>
        <div className="exec-kpi-card-body">
          <span className="exec-kpi-metric">{animIncidents}</span>
          <div className="exec-sparkline-container" style={{ width: '100px', height: '36px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={incidentTrend}>
                <Area type="monotone" dataKey="count" stroke="#DC2626" fill="#DC2626" fillOpacity={0.2} strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Approvals Pending */}
      <div className="exec-kpi-card">
        <div className="exec-kpi-card-header">
          <span className="exec-kpi-title">Approvals Pending</span>
          <span className="badge badge-warning">High Impact</span>
        </div>
        <div className="exec-kpi-card-body">
          <span className="exec-kpi-metric">{animApprovals}</span>
          <div className="exec-sparkline-container" style={{ width: '40px', height: '40px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={approvalData} dataKey="value" cx="50%" cy="50%" innerRadius={10} outerRadius={18} stroke="none" isAnimationActive={false}>
                  {approvalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={approvalColors[index % approvalColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ExecutiveKpis;
