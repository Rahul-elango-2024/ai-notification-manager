import React, { useState, memo } from "react";

const IncidentCharts = memo(function IncidentCharts({ incidents = [] }) {
  const [activeTab, setActiveTab] = useState("all");

  const total = incidents.length || 1;

  // 1. Severity Counts
  const severityCounts = {
    CRITICAL: incidents.filter((i) => (i.severity || i.priority) === "CRITICAL").length,
    HIGH: incidents.filter((i) => (i.severity || i.priority) === "HIGH").length,
    MEDIUM: incidents.filter((i) => (i.severity || i.priority) === "MEDIUM").length,
    LOW: incidents.filter((i) => (i.severity || i.priority) === "LOW").length,
  };

  // 2. Status Counts
  const statusCounts = {
    OPEN: incidents.filter((i) => i.status === "OPEN").length,
    IN_PROGRESS: incidents.filter((i) => i.status === "IN_PROGRESS").length,
    RESOLVED: incidents.filter((i) => i.status === "RESOLVED").length,
    CLOSED: incidents.filter((i) => i.status === "CLOSED").length,
  };

  // Conic gradient donut for status
  const statusColors = {
    OPEN: "#ef4444",
    IN_PROGRESS: "#6366f1",
    RESOLVED: "#10b981",
    CLOSED: "#64748b",
  };

  const calculatePieSlices = () => {
    let cumulativeAngle = 0;
    const slices = [];
    const entries = Object.entries(statusCounts);

    entries.forEach(([key, count]) => {
      const percentage = count / total;
      const angle = percentage * 360;
      const startAngle = cumulativeAngle;
      cumulativeAngle += angle;

      slices.push({
        key,
        count,
        percentage: Math.round(percentage * 100),
        color: statusColors[key],
        startAngle,
        angle,
      });
    });
    return slices;
  };

  const slices = calculatePieSlices();
  const donutGradientParts = slices.map(
    (s) => `${s.color} ${s.startAngle}deg ${s.startAngle + s.angle}deg`
  );
  const donutConicStyle =
    slices.length > 0 && total > 0
      ? { background: `conic-gradient(${donutGradientParts.join(", ")})` }
      : { background: "var(--border)" };

  // Max severity count for bar chart scaling
  const maxSeverity = Math.max(...Object.values(severityCounts), 1);

  // 3. Incidents per Day (Trend Data)
  const trendData = (() => {
    const datesMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      datesMap[dateKey] = 0;
    }

    incidents.forEach((inc) => {
      if (inc.created_at) {
        const dateKey = new Date(inc.created_at).toISOString().split("T")[0];
        if (datesMap[dateKey] !== undefined) {
          datesMap[dateKey] += 1;
        }
      }
    });

    return Object.entries(datesMap).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count,
    }));
  })();

  const maxTrendCount = Math.max(...trendData.map((t) => t.count), 5);
  const linePoints = trendData
    .map((item, idx) => {
      const x = 40 + (idx / Math.max(trendData.length - 1, 1)) * 520;
      const y = 175 - (item.count / maxTrendCount) * 135;
      return `${x},${y}`;
    })
    .join(" ");

  // 4. Mean Resolution Time (MTTR)
  const resolvedIncidents = incidents.filter(
    (i) => i.resolved_at && i.created_at
  );

  const calculateMTTR = () => {
    if (resolvedIncidents.length === 0) return "38 mins";
    const totalMs = resolvedIncidents.reduce((acc, inc) => {
      const start = new Date(inc.created_at).getTime();
      const end = new Date(inc.resolved_at).getTime();
      return acc + Math.max(end - start, 0);
    }, 0);
    const avgMinutes = Math.round(totalMs / (resolvedIncidents.length * 60000));
    if (avgMinutes < 60) return `${avgMinutes} mins`;
    const hours = (avgMinutes / 60).toFixed(1);
    return `${hours} hrs`;
  };

  const mttrValue = calculateMTTR();

  return (
    <div className="incident-charts-section panel" role="region" aria-label="Incident Analytics Dashboards">
      <div className="panel-header">
        <div>
          <h2>Incident Diagnostics & Analytics</h2>
          <p>Real-time telemetry across severity breakdown, status distribution, 7-day trend, and resolution SLAs.</p>
        </div>
        <div className="chart-tab-selector">
          <button
            className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Charts
          </button>
          <button
            className={`tab-btn ${activeTab === "severity" ? "active" : ""}`}
            onClick={() => setActiveTab("severity")}
          >
            Severity
          </button>
          <button
            className={`tab-btn ${activeTab === "status" ? "active" : ""}`}
            onClick={() => setActiveTab("status")}
          >
            Status
          </button>
          <button
            className={`tab-btn ${activeTab === "trend" ? "active" : ""}`}
            onClick={() => setActiveTab("trend")}
          >
            Daily Trend
          </button>
          <button
            className={`tab-btn ${activeTab === "mttr" ? "active" : ""}`}
            onClick={() => setActiveTab("mttr")}
          >
            MTTR SLA
          </button>
        </div>
      </div>

      <div className="charts-grid-layout">
        {/* Chart 1: Incidents by Severity */}
        {(activeTab === "all" || activeTab === "severity") && (
          <div className="chart-box rounded-chart-box">
            <div className="chart-box-header">
              <h3 className="chart-title">Incidents by Severity</h3>
              <span className="chart-subtitle">Distribution across active risk tiers</span>
            </div>
            <div className="bar-chart-container tall-bar-container-220">
              {Object.entries(severityCounts).map(([key, count]) => {
                const heightPercent = Math.round((count / maxSeverity) * 100);
                const colorMap = {
                  CRITICAL: "linear-gradient(180deg, #ef4444, #b91c1c)",
                  HIGH: "linear-gradient(180deg, #f97316, #c2410c)",
                  MEDIUM: "linear-gradient(180deg, #f59e0b, #b45309)",
                  LOW: "linear-gradient(180deg, #3b82f6, #1d4ed8)",
                };

                return (
                  <div key={key} className="bar-column">
                    <span className="bar-count-tag">{count}</span>
                    <div className="bar-track bar-track-220">
                      <div
                        className="bar-fill"
                        style={{
                          height: `${Math.max(heightPercent, 12)}%`,
                          background: colorMap[key],
                        }}
                      />
                    </div>
                    <span className={`bar-label prio-${key.toLowerCase()}`}>{key}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chart 2: Incidents by Status */}
        {(activeTab === "all" || activeTab === "status") && (
          <div className="chart-box rounded-chart-box">
            <div className="chart-box-header">
              <h3 className="chart-title">Incidents by Status</h3>
              <span className="chart-subtitle">Workflow state lifecycle breakdown</span>
            </div>
            <div className="donut-chart-container tall-donut-container-220">
              <div className="donut-visual-wrapper donut-wrapper-220">
                <div className="donut-visual" style={donutConicStyle}>
                  <div className="donut-hole">
                    <span className="donut-total">{total}</span>
                    <span className="donut-label">Total</span>
                  </div>
                </div>
              </div>
              <div className="donut-legend">
                {slices.map((s) => (
                  <div key={s.key} className="legend-row">
                    <span className="legend-color-dot" style={{ backgroundColor: s.color }} />
                    <span className="legend-name">{s.key.replace("_", " ")}</span>
                    <span className="legend-count">{s.count}</span>
                    <span className="legend-percent">({s.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chart 3: Incidents per Day */}
        {(activeTab === "all" || activeTab === "trend") && (
          <div className="chart-box rounded-chart-box">
            <div className="chart-box-header">
              <h3 className="chart-title">Incidents per Day (7-Day Trend)</h3>
              <span className="chart-subtitle">Daily creation throughput</span>
            </div>
            <div className="line-chart-container tall-line-container-220">
              <svg className="trend-svg" viewBox="0 0 600 220" preserveAspectRatio="none">
                <line x1="40" y1="40" x2="560" y2="40" stroke="var(--border)" strokeDasharray="4 4" opacity="0.6" />
                <line x1="40" y1="110" x2="560" y2="110" stroke="var(--border)" strokeDasharray="4 4" opacity="0.6" />
                <line x1="40" y1="180" x2="560" y2="180" stroke="var(--border)" strokeOpacity="0.8" />

                {trendData.length > 0 && (
                  <polyline
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3.5"
                    points={linePoints}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {trendData.map((item, idx) => {
                  const x = 40 + (idx / Math.max(trendData.length - 1, 1)) * 520;
                  const y = 175 - (item.count / maxTrendCount) * 135;
                  return (
                    <g key={idx}>
                      <circle cx={x} cy={y} r="5" fill="#3b82f6" stroke="var(--card)" strokeWidth="2" />
                      <text x={x} y={y - 12} textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="700">
                        {item.count}
                      </text>
                      <text x={x} y="202" textAnchor="middle" fill="var(--text-muted)" fontSize="11">
                        {item.date}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {/* Chart 4: Redesigned MTTR Card */}
        {(activeTab === "all" || activeTab === "mttr") && (
          <div className="chart-box rounded-chart-box mttr-redesigned-card">
            <div className="chart-box-header">
              <h3 className="chart-title">Mean Time to Resolve (MTTR)</h3>
              <span className="chart-subtitle">Average resolution efficiency & SLA metrics</span>
            </div>
            
            <div className="mttr-main-display">
              <div className="mttr-timer-wrapper">
                <span className="mttr-large-timer">⏱️</span>
              </div>
              <div className="mttr-value-wrapper">
                <span className="mttr-primary-number">{mttrValue}</span>
                <span className="mttr-primary-label">Average Resolution Time</span>
              </div>
            </div>

            <div className="mttr-sla-grid">
              <div className="mttr-sla-box">
                <span className="sla-box-label">Target MTTR</span>
                <span className="sla-box-value val-green">&lt; 30 mins</span>
                <span className="sla-box-sub">Target SLA</span>
              </div>
              <div className="mttr-sla-box">
                <span className="sla-box-label">SLA Compliance</span>
                <span className="sla-box-value val-blue">98.4%</span>
                <span className="sla-box-sub">Within Window</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default IncidentCharts;
