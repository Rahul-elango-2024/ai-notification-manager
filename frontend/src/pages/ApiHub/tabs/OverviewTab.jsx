import React from "react";

const SUPPORTED_SYSTEMS = [
  { name: "SAP ERP", icon: "🏢", type: "Enterprise ERP", desc: "Automated financial & production KPI sync" },
  { name: "Oracle ERP", icon: "🏛️", type: "Enterprise ERP", desc: "Real-time supply chain metric ingestion" },
  { name: "Microsoft Dynamics", icon: "💼", type: "ERP & CRM", desc: "Operations & inventory KPI tracking" },
  { name: "Salesforce", icon: "☁️", type: "CRM Platform", desc: "Sales pipeline & revenue anomaly alerts" },
  { name: "Zoho CRM", icon: "📊", type: "CRM System", desc: "Lead velocity & customer metrics sync" },
  { name: "IoT Devices & Sensors", icon: "⚡", type: "Industrial IoT", desc: "Factory telemetry & sensor data streams" },
  { name: "AWS CloudWatch", icon: "☁️", type: "Cloud Ops", desc: "Infrastructure health & latency metrics" },
  { name: "Azure Monitor", icon: "🔷", type: "Cloud Ops", desc: "Cloud performance & availability ingestion" },
  { name: "Google Cloud Monitoring", icon: "🌐", type: "Cloud Ops", desc: "Multi-cloud telemetry & log metrics" },
  { name: "Payment Gateways", icon: "💳", type: "FinTech", desc: "Transaction volume & failure rate alerts" },
  { name: "Manufacturing Systems", icon: "⚙️", type: "MES / Industry 4.0", desc: "Assembly line throughput & error rates" },
  { name: "Custom Systems", icon: "🔌", type: "REST / JSON API", desc: "Any custom service via HTTP Bearer API Key" },
];

export default function OverviewTab({ analytics, apiKeyCount, webhookCount, onNavigateTab }) {
  return (
    <div className="tab-content overview-tab">
      {/* Metric Cards Grid */}
      <section className="metric-grid">
        <div className="metric-card blue">
          <div className="metric-card-top">
            <div className="metric-icon blue">🔌</div>
            <span className="metric-label">Total Ingestion Requests</span>
          </div>
          <strong className="metric-value">{analytics?.totalRequests?.toLocaleString() || 0}</strong>
          <span className="metric-description">Lifetime external API calls</span>
        </div>

        <div className="metric-card green">
          <div className="metric-card-top">
            <div className="metric-icon green">🔑</div>
            <span className="metric-label">Active API Keys</span>
          </div>
          <strong className="metric-value">{apiKeyCount || 0}</strong>
          <span className="metric-description">Authorized enterprise keys</span>
        </div>

        <div className="metric-card purple">
          <div className="metric-card-top">
            <div className="metric-icon purple">📡</div>
            <span className="metric-label">Active Webhooks</span>
          </div>
          <strong className="metric-value">{webhookCount || 0}</strong>
          <span className="metric-description">Real-time event subscribers</span>
        </div>

        <div className="metric-card red">
          <div className="metric-card-top">
            <div className="metric-icon red">⚡</div>
            <span className="metric-label">API Success Rate</span>
          </div>
          <strong className="metric-value">{analytics?.successRate ?? 100}%</strong>
          <span className="metric-description">Avg latency: {analytics?.avgLatencyMs || 0} ms</span>
        </div>
      </section>

      {/* Overview Layout */}
      <div className="overview-layout">
        {/* Quick Ingestion Guide Panel */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Quick Ingestion Setup</h2>
              <p>Send external KPI metric data directly into the AI monitoring & alert pipeline.</p>
            </div>
            <button className="secondary-button" onClick={() => onNavigateTab("docs")}>
              View Full Docs ➔
            </button>
          </div>

          <div className="quick-start-box">
            <div className="endpoint-banner">
              <span className="http-method post">POST</span>
              <code>http://localhost:5000/api/v1/kpi-ingest</code>
            </div>

            <div className="code-snippet-preview">
              <div className="snippet-header">Sample Ingestion Request Payload</div>
              <pre>{JSON.stringify({
                department: "Sales",
                kpi: "Sales Revenue",
                value: 450000,
                unit: "INR",
                source: "SAP ERP",
                timestamp: new Date().toISOString()
              }, null, 2)}</pre>
            </div>

            <div className="setup-steps">
              <div className="step-item">
                <div className="step-number">1</div>
                <div>
                  <strong>Generate API Key</strong>
                  <p>Create a department-assigned API Key in the API Keys tab.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div>
                  <strong>Send Metric Ingestion Payload</strong>
                  <p>Send HTTP POST requests with <code>Authorization: Bearer &lt;API_KEY&gt;</code>.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div>
                  <strong>Automated AI Processing</strong>
                  <p>KPI thresholds are automatically evaluated, AI analysis is generated, and alerts/notifications trigger in real-time.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Capabilities Panel */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Supported Enterprise Systems</h2>
              <p>Out-of-the-box support for leading enterprise platforms and custom systems.</p>
            </div>
          </div>

          <div className="systems-grid">
            {SUPPORTED_SYSTEMS.map((sys, idx) => (
              <div className="system-card" key={idx}>
                <div className="system-icon">{sys.icon}</div>
                <div className="system-info">
                  <strong>{sys.name}</strong>
                  <span className="system-type">{sys.type}</span>
                  <p>{sys.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
