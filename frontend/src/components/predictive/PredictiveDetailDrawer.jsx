import React, { memo } from "react";

const PredictiveDetailDrawer = memo(function PredictiveDetailDrawer({ isOpen, onClose, data, type }) {
  if (!isOpen || !data) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content predictive-detail-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <span className="drawer-type-badge">{type || "ANALYSIS"}</span>
            <h2 className="drawer-title">{data.title || data.department_name || data.name || "Telemetry Details"}</h2>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          {type === "RECOMMENDATION" && (
            <>
              <div className="drawer-meta-grid">
                <div className="drawer-meta-item">
                  <span>Priority</span>
                  <strong className={`priority-badge prio-${(data.priority || "HIGH").toLowerCase()}`}>{data.priority || "HIGH"}</strong>
                </div>
                <div className="drawer-meta-item">
                  <span>AI Confidence</span>
                  <strong className="green-text">{data.confidence || "96.4%"}</strong>
                </div>
                <div className="drawer-meta-item">
                  <span>Est. Savings</span>
                  <strong className="green-text">{data.estimatedSavings || "$14,200"}</strong>
                </div>
                <div className="drawer-meta-item">
                  <span>Est. Resolution</span>
                  <strong>{data.resolutionTime || "15 mins"}</strong>
                </div>
              </div>

              <div className="drawer-section">
                <h3>🤖 Gemini AI Reasoning</h3>
                <p className="drawer-text">{data.reasoning || data.description || "Pattern matching indicates a 94.2% probability of DB connection starvation during peak ingest traffic. Automated pod replica scaling is recommended."}</p>
              </div>

              <div className="drawer-section">
                <h3>💼 Business & SLA Impact</h3>
                <p className="drawer-text">{data.impact || "Failure to execute may breach 99.9% SLA target on Payment Gateway API, affecting up to 14% of active user checkouts."}</p>
              </div>

              <div className="drawer-section">
                <h3>🛠️ Recommended Action & Affected Services</h3>
                <div className="drawer-chip-group">
                  <span className="drawer-chip">Payment Gateway API</span>
                  <span className="drawer-chip">PostgreSQL Primary Cluster</span>
                  <span className="drawer-chip">PgBouncer Pooler</span>
                </div>
                <p className="drawer-text" style={{ marginTop: 8 }}><strong>Suggested Owner:</strong> {data.owner || "Alex Rivera (Principal SRE)"}</p>
              </div>
            </>
          )}

          {type === "DEPARTMENT" && (
            <>
              <div className="drawer-meta-grid">
                <div className="drawer-meta-item">
                  <span>Risk Score</span>
                  <strong className="red-text">{data.risk_score || 88}/100</strong>
                </div>
                <div className="drawer-meta-item">
                  <span>Risk Level</span>
                  <strong className={`priority-badge prio-${(data.risk_level || "HIGH").toLowerCase()}`}>{data.risk_level || "CRITICAL"}</strong>
                </div>
                <div className="drawer-meta-item">
                  <span>Active Incidents</span>
                  <strong>{data.incident_count || 3} Incidents</strong>
                </div>
                <div className="drawer-meta-item">
                  <span>AI Health</span>
                  <strong className="green-text">{data.ai_health || "84.2%"}</strong>
                </div>
              </div>

              <div className="drawer-section">
                <h3>📊 Affected KPIs & Telemetry Anomalies</h3>
                <ul className="drawer-list">
                  <li><strong>Payment Webhook Latency:</strong> 940ms (Expected: 180ms)</li>
                  <li><strong>DB Pool Saturation:</strong> 88% capacity utilization</li>
                  <li><strong>Auth Rate Limits:</strong> 4,200 req/min peak rate</li>
                </ul>
              </div>

              <div className="drawer-section">
                <h3>📈 30-Day Risk Forecast & Trend</h3>
                <p className="drawer-text">Risk trajectory is <strong>▲ Escalating</strong> due to sustained end-of-month reconciliation loads.</p>
              </div>
            </>
          )}

          {(!type || (type !== "RECOMMENDATION" && type !== "DEPARTMENT")) && (
            <div className="drawer-section">
              <h3>📄 Analysis Details</h3>
              <p className="drawer-text">{JSON.stringify(data, null, 2)}</p>
            </div>
          )}
        </div>

        <div className="drawer-footer">
          <button className="secondary-button" onClick={onClose}>Close</button>
          {type === "RECOMMENDATION" && <button className="primary-button" onClick={() => alert("Executing AI Recommendation action...")}>Execute Action Now</button>}
        </div>
      </div>
    </div>
  );
});

export default PredictiveDetailDrawer;
