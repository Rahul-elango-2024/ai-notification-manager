import React, { useState, useEffect } from "react";

export default function PredictionHistoryTab({ authHeaders, apiUrl, addToast }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/predictions/history?limit=100`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch prediction history.");
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

  const filteredHistory = history.filter((h) => {
    const term = search.toLowerCase();
    return (
      (h.kpi_name && h.kpi_name.toLowerCase().includes(term)) ||
      (h.department && h.department.toLowerCase().includes(term)) ||
      (h.risk_level && h.risk_level.toLowerCase().includes(term)) ||
      (h.model_version && h.model_version.toLowerCase().includes(term))
    );
  });

  return (
    <div className="tab-content prediction-history-tab">
      {/* Control Bar */}
      <div className="tab-control-bar">
        <div className="search-filter-group">
          <input
            type="text"
            className="search-input"
            placeholder="Search KPI name, department, risk level..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="secondary-button" onClick={fetchHistory} disabled={loading}>
          {loading ? "Refreshing..." : "↻ Refresh History"}
        </button>
      </div>

      {/* History Table Panel */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Historical Prediction Audit Registry</h2>
            <p>Historical audit log of generated time-series models, risk scores, and anomaly predictions.</p>
          </div>
          <span className="count-badge">{filteredHistory.length} Record(s)</span>
        </div>

        {loading ? (
          <div className="loading-screen">Loading prediction history...</div>
        ) : filteredHistory.length > 0 ? (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Generated At</th>
                  <th>KPI Name</th>
                  <th>Department</th>
                  <th>Period</th>
                  <th>Predicted Value</th>
                  <th>Confidence</th>
                  <th>Trend</th>
                  <th>Risk Score</th>
                  <th>Anomaly</th>
                  <th>Model</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((h) => (
                  <tr key={h.id}>
                    <td>{new Date(h.generated_at).toLocaleString()}</td>
                    <td><strong>{h.kpi_name}</strong></td>
                    <td>{h.department}</td>
                    <td><code>{h.forecast_period}</code></td>
                    <td><strong>{h.predicted_value}</strong></td>
                    <td>{h.confidence_percentage}%</td>
                    <td>
                      <span className={`trend-badge ${(h.trend || "").toLowerCase()}`}>
                        {h.trend}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${(h.risk_level || "").toLowerCase()}`}>
                        {h.risk_score}/100 {h.risk_level}
                      </span>
                    </td>
                    <td>
                      {h.anomaly_predicted ? (
                        <span className="status-badge critical">YES</span>
                      ) : (
                        <span className="status-badge normal">NO</span>
                      )}
                    </td>
                    <td><code>{h.model_version}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📜</div>
            <h3>No historical prediction records</h3>
            <p>Generated forecast models will automatically record history here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
