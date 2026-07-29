import React, { useState, useEffect } from "react";

export default function RequestLogsTab({ authHeaders, apiUrl, addToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = statusFilter !== "ALL"
        ? `${apiUrl}/api/api-analytics/logs?status=${statusFilter}&limit=100`
        : `${apiUrl}/api/api-analytics/logs?limit=100`;

      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch API request logs.");
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [statusFilter]);

  const filteredLogs = logs.filter((l) => {
    const term = search.toLowerCase();
    return (
      (l.key_name && l.key_name.toLowerCase().includes(term)) ||
      (l.key_prefix && l.key_prefix.toLowerCase().includes(term)) ||
      (l.endpoint && l.endpoint.toLowerCase().includes(term)) ||
      (l.ip_address && l.ip_address.toLowerCase().includes(term))
    );
  });

  return (
    <div className="tab-content request-logs-tab">
      {/* Control Bar */}
      <div className="tab-control-bar">
        <div className="search-filter-group">
          <input
            type="text"
            className="search-input"
            placeholder="Search endpoint, key prefix, IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success (2xx)</option>
            <option value="FAILED">Failed (4xx/5xx)</option>
            <option value="RATE_LIMITED">Rate Limited (429)</option>
          </select>
        </div>

        <button className="secondary-button" onClick={fetchLogs} disabled={loading}>
          {loading ? "Refreshing..." : "↻ Refresh Logs"}
        </button>
      </div>

      {/* Logs Table */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>API Ingestion Request Audit Log</h2>
            <p>Real-time stream of HTTP request payloads, HTTP response statuses, and execution latencies.</p>
          </div>
          <span className="count-badge">{filteredLogs.length} Log(s)</span>
        </div>

        {loading ? (
          <div className="loading-screen">Loading request logs...</div>
        ) : filteredLogs.length > 0 ? (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>API Key / Identifier</th>
                  <th>Endpoint</th>
                  <th>HTTP Status</th>
                  <th>Result</th>
                  <th>Latency</th>
                  <th>Client IP</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((l) => (
                  <tr key={l.id}>
                    <td>{new Date(l.timestamp).toLocaleString()}</td>
                    <td>
                      <strong>{l.key_name || "Unknown Key"}</strong>
                      {l.key_prefix && <small className="table-subtext">{l.key_prefix}</small>}
                    </td>
                    <td><code>{l.endpoint}</code></td>
                    <td>
                      <span className={`http-code-badge ${l.response_status < 300 ? "status-200" : l.response_status === 429 ? "status-429" : "status-500"}`}>
                        {l.response_status}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${(l.status || "").toLowerCase()}`}>
                        {l.status}
                      </span>
                    </td>
                    <td>{l.latency_ms} ms</td>
                    <td><code>{l.ip_address}</code></td>
                    <td>
                      <button className="text-button" onClick={() => setSelectedLog(l)}>
                        Inspect Payload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📜</div>
            <h3>No request logs recorded</h3>
            <p>Ingestion calls to <code>/api/v1/kpi-ingest</code> will appear here automatically.</p>
          </div>
        )}
      </div>

      {/* INSPECT LOG MODAL */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal log-inspect-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <h3>API Request #{selectedLog.id} Inspection</h3>
                <p>{new Date(selectedLog.timestamp).toLocaleString()} — Latency: {selectedLog.latency_ms} ms</p>
              </div>
              <button className="modal-close" onClick={() => setSelectedLog(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="log-meta-grid">
                <div>
                  <strong>Key Name:</strong> {selectedLog.key_name || "N/A"}
                </div>
                <div>
                  <strong>Endpoint:</strong> <code>{selectedLog.endpoint}</code>
                </div>
                <div>
                  <strong>Response Code:</strong> {selectedLog.response_status}
                </div>
                <div>
                  <strong>Client IP:</strong> {selectedLog.ip_address}
                </div>
              </div>

              <div className="code-snippet-preview">
                <div className="snippet-header">Ingestion Request Payload (JSON)</div>
                <pre>{JSON.stringify(selectedLog.payload || {}, null, 2)}</pre>
              </div>

              <div className="code-snippet-preview">
                <div className="snippet-header">HTTP Response Body (JSON)</div>
                <pre>{JSON.stringify(selectedLog.response_body || {}, null, 2)}</pre>
              </div>
            </div>

            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setSelectedLog(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
