import React, { memo } from "react";

const ExecutiveForecast = memo(function ExecutiveForecast() {
  const risks = [
    { type: "Business Risk", level: "HIGH", score: "78/100", estFinancial: "$120,000", details: "Market delivery delays due to API degradation." },
    { type: "Operational Risk", level: "CRITICAL", score: "88/100", estFinancial: "$240,000", details: "Database connection pool starvation risk." },
    { type: "Financial Risk", level: "MEDIUM", score: "54/100", estFinancial: "$45,000", details: "Potential SLA penalty payouts to Enterprise Tier clients." },
    { type: "Customer Impact", level: "HIGH", score: "72/100", estFinancial: "N/A (NPS -12)", details: "Potential checkout latency affecting 14% of active users." },
    { type: "Compliance Risk", level: "LOW", score: "22/100", estFinancial: "$0", details: "SOC2 & GDPR audit logging compliance remains 100% active." },
  ];

  return (
    <div className="panel executive-forecast-panel" role="region" aria-label="Executive Risk Forecast Matrix">
      <div className="panel-header">
        <div>
          <h2>📊 Executive Forecast & Enterprise Risk Matrix</h2>
          <p>Strategic executive summary evaluating multi-dimensional business, financial, and operational risk factors.</p>
        </div>
      </div>

      <div className="executive-grid">
        {risks.map((r, idx) => (
          <div key={idx} className={`exec-risk-card level-${r.level.toLowerCase()}`}>
            <div className="exec-card-top">
              <span className="exec-risk-type">{r.type}</span>
              <span className={`priority-badge prio-${r.level.toLowerCase()}`}>{r.level}</span>
            </div>

            <div className="exec-score-row">
              <span className="exec-score-val">{r.score}</span>
              <span className="exec-financial">{r.estFinancial} Est. Exposure</span>
            </div>

            <p className="exec-details-text">{r.details}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

export default ExecutiveForecast;
