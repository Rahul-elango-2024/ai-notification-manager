import React from "react";
import "./AIRecommendations.css";

export default function AIRecommendations({ recommendations, onOpenDetails, onExecute }) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="recommendations-container panel">
        <div className="panel-header">
          <div>
            <h2>AI Recommendations</h2>
            <p>Prescriptive actions ranked by predicted impact.</p>
          </div>
        </div>
        <div className="empty-recs-state">
          No recommendations available
        </div>
      </div>
    );
  }

  return (
    <div className="recommendations-container panel">
      <div className="panel-header">
        <div>
          <h2>AI Recommendations</h2>
          <p>Prescriptive actions ranked by predicted impact.</p>
        </div>
      </div>
      <div className="recommendations-grid">
        {recommendations.map((rec, idx) => {
          const priorityClass = rec.priority === 'HIGH' ? 'rec-high' : rec.priority === 'MEDIUM' ? 'rec-med' : 'rec-low';
          return (
            <div key={idx} className={`rec-card ${priorityClass}`}>
              <div className="rec-header">
                <span className="rec-priority">{rec.priority} Priority</span>
                <span className="rec-status-pill">{rec.status || 'PENDING'}</span>
              </div>
              <div className="rec-body">
                <p className="rec-title" title={rec.title || rec.recommendation}>{rec.title || rec.recommendation}</p>
                <span className="rec-impact">{rec.impact_score || 'Medium Impact'}</span>
              </div>
              <div className="rec-actions">
                <button className="rec-btn btn-details" onClick={() => onOpenDetails(rec)}>Details</button>
                {rec.status === 'COMPLETED' ? (
                  <button className="rec-btn btn-execute success-state" disabled>
                    ✓ Executed
                  </button>
                ) : (
                  <button className="rec-btn btn-execute" onClick={() => onExecute(rec)} disabled={rec.status === 'EXECUTING'}>
                    {rec.status === 'EXECUTING' ? 'Executing...' : 'Run AI Playbook'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
