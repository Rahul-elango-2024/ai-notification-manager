import React, { memo } from "react";

const AIExecutiveSummary = memo(function AIExecutiveSummary() {
  return (
    <div className="panel ai-executive-summary-panel">
      <div className="panel-header">
        <div>
          <h2>📊 Automated Executive Reliability & Savings Briefing</h2>
          <p>Daily AI briefing evaluating system uptime, financial risk mitigation, SLA compliance, and estimated cost savings.</p>
        </div>
        <span className="ai-live-badge">✨ Daily Briefing</span>
      </div>

      <div className="exec-briefing-grid">
        <div className="briefing-card">
          <span className="briefing-label">Today's Incidents</span>
          <strong className="briefing-val">3 Critical / 6 Total</strong>
          <p className="briefing-sub">2 resolved, 1 active in War Room</p>
        </div>

        <div className="briefing-card">
          <span className="briefing-label">SLA Compliance</span>
          <strong className="briefing-val green-text">99.88%</strong>
          <p className="briefing-sub">Target: 99.90% SLA threshold</p>
        </div>

        <div className="briefing-card">
          <span className="briefing-label">Estimated Cost Savings</span>
          <strong className="briefing-val green-text">$64,200</strong>
          <p className="briefing-sub">Saved via automated AI mitigation</p>
        </div>

        <div className="briefing-card">
          <span className="briefing-label">AI Acceptance Rate</span>
          <strong className="briefing-val blue-text">94.2%</strong>
          <p className="briefing-sub">Engineer approval of recommendations</p>
        </div>
      </div>
    </div>
  );
});

export default AIExecutiveSummary;
