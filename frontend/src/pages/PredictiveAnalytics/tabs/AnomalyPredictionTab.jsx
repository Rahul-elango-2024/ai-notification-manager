import React from "react";

export default function AnomalyPredictionTab({ anomalies }) {
  return (
    <div className="tab-content anomaly-prediction-tab">
      <div className="tab-control-bar">
        <p className="tab-lead-text">
          Early Anomaly Detection Engine predicts potential metric breaches <strong>before</strong> warning/critical thresholds are crossed.
        </p>
        <span className="count-badge">{anomalies.length} Early Warning(s)</span>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Predicted Pre-Threshold Anomalies</h2>
            <p>Monitored KPIs exhibiting dangerous trajectory trends.</p>
          </div>
        </div>

        {anomalies.length > 0 ? (
          <div className="anomaly-cards-grid">
            {anomalies.map((a, idx) => (
              <div className={`anomaly-card ${a.severity.toLowerCase()}`} key={idx}>
                <div className="anomaly-card-header">
                  <div>
                    <span className="anomaly-dept">{a.department}</span>
                    <h3>{a.kpi_name}</h3>
                  </div>
                  <span className={`status-badge ${a.severity.toLowerCase()}`}>
                    {a.severity} ANOMALY
                  </span>
                </div>

                <div className="anomaly-card-body">
                  <div className="anomaly-stat-row">
                    <div className="anomaly-stat">
                      <span>Expected Target</span>
                      <strong>{a.expected_kpi} {a.unit}</strong>
                    </div>
                    <div className="anomaly-stat">
                      <span>Predicted Trajectory</span>
                      <strong className="predicted-val">{a.predicted_kpi} {a.unit}</strong>
                    </div>
                    <div className="anomaly-stat">
                      <span>Predicted Difference</span>
                      <strong className="diff-val">{a.difference > 0 ? `+${a.difference}` : a.difference} {a.unit}</strong>
                    </div>
                  </div>

                  <div className="anomaly-meta">
                    <div>
                      <span>Breach Probability:</span>
                      <strong>{a.risk_percentage}%</strong>
                    </div>
                    <div>
                      <span>Expected Breach Time:</span>
                      <strong>{new Date(a.expected_time).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">✓</div>
            <h3>No early anomalies detected</h3>
            <p>All monitored KPI trajectories are operating within safe operating bounds.</p>
          </div>
        )}
      </div>
    </div>
  );
}
