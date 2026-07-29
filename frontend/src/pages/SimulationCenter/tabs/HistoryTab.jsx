import React, { useState, useEffect } from "react";

export default function HistoryTab({ authHeaders, apiUrl, addToast }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/simulation/history?limit=50`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch simulation history.");
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="tab-content history-tab">
      <div className="tab-control-bar">
        <button className="secondary-button" onClick={fetchHistory} disabled={loading}>
          {loading ? "Refreshing..." : "↻ Refresh History"}
        </button>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Historical Simulation Audit Log</h2>
            <p>Log of previous scenario runs, duration, readings generated, and alerts created.</p>
          </div>
          <span className="count-badge">{history.length} Run(s)</span>
        </div>

        {loading ? (
          <div className="loading-screen">Loading simulation history...</div>
        ) : history.length > 0 ? (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Start Time</th>
                  <th>Scenario</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Readings</th>
                  <th>Alerts Generated</th>
                  <th>Max Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td>{new Date(h.start_time).toLocaleString()}</td>
                    <td><strong>{h.scenario_name}</strong></td>
                    <td>
                      <span className={`status-badge ${(h.status || "").toLowerCase()}`}>
                        {h.status}
                      </span>
                    </td>
                    <td>{h.duration_seconds} sec</td>
                    <td>{h.readings_generated_count}</td>
                    <td>
                      <strong>{h.alerts_generated_count}</strong>
                    </td>
                    <td>
                      <span className="impact-score-tag">{h.max_risk_score}/100</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📜</div>
            <h3>No simulation history records</h3>
            <p>Past simulation runs will be recorded here automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
}
