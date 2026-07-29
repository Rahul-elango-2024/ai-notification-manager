import React from "react";

export default function UsageAnalyticsTab({ analytics }) {
  const topKeys = analytics?.topApiKeys || [];
  const topDepts = analytics?.topDepartments || [];

  return (
    <div className="tab-content usage-analytics-tab">
      {/* Metrics Row */}
      <section className="metric-grid">
        <div className="metric-card blue">
          <div className="metric-card-top">
            <div className="metric-icon blue">⚡</div>
            <span className="metric-label">Today's Requests</span>
          </div>
          <strong className="metric-value">{analytics?.todayRequests?.toLocaleString() || 0}</strong>
          <span className="metric-description">API calls in last 24h</span>
        </div>

        <div className="metric-card green">
          <div className="metric-card-top">
            <div className="metric-icon green">📅</div>
            <span className="metric-label">Last 7 Days</span>
          </div>
          <strong className="metric-value">{analytics?.last7DaysRequests?.toLocaleString() || 0}</strong>
          <span className="metric-description">7-day ingestion total</span>
        </div>

        <div className="metric-card purple">
          <div className="metric-card-top">
            <div className="metric-icon purple">🗓️</div>
            <span className="metric-label">Last 30 Days</span>
          </div>
          <strong className="metric-value">{analytics?.last30DaysRequests?.toLocaleString() || 0}</strong>
          <span className="metric-description">Monthly ingestion volume</span>
        </div>

        <div className="metric-card red">
          <div className="metric-card-top">
            <div className="metric-icon red">⏱️</div>
            <span className="metric-label">Avg Ingestion Latency</span>
          </div>
          <strong className="metric-value">{analytics?.avgLatencyMs || 0} ms</strong>
          <span className="metric-description">Processing & threshold evaluation</span>
        </div>
      </section>

      <div className="overview-layout">
        {/* Top API Keys Panel */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Top API Keys by Request Volume</h2>
              <p>Active keys originating external metric payload transmissions.</p>
            </div>
          </div>

          {topKeys.length > 0 ? (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Key Name</th>
                    <th>Prefix</th>
                    <th>Request Volume</th>
                    <th>Avg Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {topKeys.map((k) => (
                    <tr key={k.id}>
                      <td><strong>{k.key_name}</strong></td>
                      <td><code>{k.key_prefix}</code></td>
                      <td>
                        <strong className="volume-count">{Number(k.request_count).toLocaleString()}</strong>
                      </td>
                      <td>{k.avg_latency} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>No analytics data available</h3>
              <p>Send ingestion payloads via API Keys to generate usage analytics.</p>
            </div>
          )}
        </div>

        {/* Top Departments Panel */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Department Ingestion Activity</h2>
              <p>Breakdown of metric updates per enterprise department.</p>
            </div>
          </div>

          {topDepts.length > 0 ? (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Total Ingestion Requests</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {topDepts.map((d, idx) => {
                    const totalReqs = analytics?.totalRequests || 1;
                    const sharePct = ((Number(d.request_count) / totalReqs) * 100).toFixed(1);
                    return (
                      <tr key={idx}>
                        <td><strong>{d.department_name || "Global / Unassigned"}</strong></td>
                        <td>{Number(d.request_count).toLocaleString()}</td>
                        <td>
                          <div className="share-bar-cell">
                            <span>{sharePct}%</span>
                            <div className="share-progress-track">
                              <div className="share-progress-fill" style={{ width: `${Math.min(100, sharePct)}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🏢</div>
              <h3>No department activity recorded</h3>
              <p>Ingest data tagged with departments to view breakdown.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
