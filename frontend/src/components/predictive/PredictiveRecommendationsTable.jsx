import React, { memo } from "react";

const PredictiveRecommendationsTable = memo(function PredictiveRecommendationsTable({ recommendations = [], onExecuteAction, onOpenDetails }) {
  const defaultRecommendations = [
    { id: "rec-1", title: "Increase DB Connection Pool", confidence: 94, risk: "High", actionLabel: "Execute" },
    { id: "rec-2", title: "Scale Payment Webhook Workers", confidence: 91, risk: "Medium", actionLabel: "Review" },
    { id: "rec-3", title: "Apply Cloudflare Rate Limit Rule #402", confidence: 88, risk: "High", actionLabel: "Execute" },
    { id: "rec-4", title: "Flush Stale Redis Cache Keys", confidence: 85, risk: "Low", actionLabel: "Execute" },
    { id: "rec-5", title: "Reallocate Support Queue Capacity", confidence: 82, risk: "Low", actionLabel: "Review" },
  ];

  const list = recommendations.length > 0 ? recommendations : defaultRecommendations;

  return (
    <div className="section-card recommendations-table-panel">
      <div className="section-card-header">
        <h2 className="section-title">AI Action Recommendations</h2>
        <span className="caption-text">Prescriptive AI mitigations</span>
      </div>

      <div className="table-responsive-wrapper">
        <table className="enterprise-table">
          <thead>
            <tr>
              <th>Recommendation</th>
              <th>Confidence</th>
              <th>Risk</th>
              <th className="align-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((rec) => {
              const riskLower = (rec.risk || "High").toLowerCase();
              return (
                <tr key={rec.id} className="table-row">
                  <td style={{ maxWidth: 0, overflow: "hidden" }}>
                    <button className="table-task-link" onClick={() => onOpenDetails && onOpenDetails(rec)} title={rec.title}>
                      {rec.title}
                    </button>
                  </td>
                  <td>
                    <span className="badge badge-success">{rec.confidence}%</span>
                  </td>
                  <td>
                    <span className={`badge badge-${riskLower === "high" || riskLower === "critical" ? "danger" : riskLower === "medium" ? "warning" : "primary"}`}>
                      {rec.risk}
                    </span>
                  </td>
                  <td className="align-right">
                    <button
                      className="primary-button small-btn"
                      onClick={() => onExecuteAction ? onExecuteAction(rec) : alert(`Executed: ${rec.title}`)}
                    >
                      {rec.actionLabel || "Execute"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default PredictiveRecommendationsTable;
