import React, { memo } from "react";

const BusinessImpactForecast = memo(function BusinessImpactForecast() {
  const metrics = [
    { name: "Predicted Revenue Loss", val: "$42,500", change: "-12% vs last month", status: "CRITICAL", sub: "Potential checkout latency SLA penalties" },
    { name: "Estimated Downtime Cost", val: "$18,200", change: "Unchanged", status: "HIGH", sub: "Calculated at $350/min outage rate" },
    { name: "Customer Satisfaction (CSAT)", val: "4.4 / 5.0", change: "-0.3 Projected", status: "MEDIUM", sub: "Based on predicted ticket response times" },
    { name: "Operational Efficiency", val: "94.2%", change: "+2.1% Improved", status: "NORMAL", sub: "Automated resolution handling 68% alerts" },
    { name: "SLA Compliance Rate", val: "99.82%", change: "-0.08% Risk", status: "WARNING", sub: "Threshold limit set to 99.90% SLA" },
  ];

  return (
    <div className="panel business-impact-forecast-panel" role="region" aria-label="Business Impact Forecast">
      <div className="panel-header">
        <div>
          <h2>📈 Financial & Business Impact Forecast</h2>
          <p>Predictive operational cost modeling, financial risk exposure, SLA compliance, and customer satisfaction projections.</p>
        </div>
      </div>

      <div className="business-impact-grid">
        {metrics.map((m, idx) => (
          <div key={idx} className={`impact-kpi-card status-${m.status.toLowerCase()}`}>
            <div className="impact-kpi-header">
              <span className="impact-kpi-title">{m.name}</span>
              <span className={`priority-badge prio-${m.status.toLowerCase()}`}>{m.status}</span>
            </div>

            <div className="impact-kpi-value-row">
              <strong className="impact-kpi-val">{m.val}</strong>
              <span className="impact-kpi-change">{m.change}</span>
            </div>

            <p className="impact-kpi-sub">{m.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

export default BusinessImpactForecast;
