import React, { useState } from "react";

export default function ApiDocumentationTab({ addToast }) {
  const [selectedLang, setSelectedLang] = useState("curl");

  const sampleKey = "ank_live_9f8a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a";
  const baseUrl = "http://localhost:5000/api/v1/kpi-ingest";

  const copyCode = (codeText) => {
    navigator.clipboard.writeText(codeText);
    addToast("Code snippet copied to clipboard!", "success");
  };

  const getSnippet = () => {
    switch (selectedLang) {
      case "curl":
        return `curl -X POST "${baseUrl}" \\
  -H "Authorization: Bearer ${sampleKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "department": "Sales",
    "kpi": "Sales Revenue",
    "value": 450000,
    "unit": "INR",
    "source": "SAP ERP",
    "timestamp": "${new Date().toISOString()}"
  }'`;

      case "js":
        return `// JavaScript (Fetch API)
const response = await fetch("${baseUrl}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${sampleKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    department: "Sales",
    kpi: "Sales Revenue",
    value: 450000,
    unit: "INR",
    source: "SAP ERP",
    timestamp: new Date().toISOString()
  })
});

const data = await response.json();
console.log("Ingestion result:", data);`;

      case "axios":
        return `// JavaScript (Axios)
import axios from 'axios';

const response = await axios.post(
  "${baseUrl}",
  {
    department: "Sales",
    kpi: "Sales Revenue",
    value: 450000,
    unit: "INR",
    source: "SAP ERP",
    timestamp: new Date().toISOString()
  },
  {
    headers: {
      "Authorization": "Bearer ${sampleKey}",
      "Content-Type": "application/json"
    }
  }
);

console.log("Ingestion result:", response.data);`;

      case "python":
        return `# Python (requests)
import requests
import json
from datetime import datetime

url = "${baseUrl}"
headers = {
    "Authorization": "Bearer ${sampleKey}",
    "Content-Type": "application/json"
}

payload = {
    "department": "Sales",
    "kpi": "Sales Revenue",
    "value": 450000,
    "unit": "INR",
    "source": "SAP ERP",
    "timestamp": datetime.utcnow().isoformat() + "Z"
}

response = requests.post(url, headers=headers, data=json.dumps(payload))
print("Status:", response.status_code)
print("Response:", response.json())`;

      default:
        return "";
    }
  };

  return (
    <div className="tab-content api-docs-tab">
      <div className="overview-layout">
        {/* API Reference Left Panel */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>API Ingestion Reference</h2>
              <p>Enterprise REST API specifications for external metric transmission.</p>
            </div>
          </div>

          <div className="doc-section">
            <h3>1. Authentication & Headers</h3>
            <p>All API ingestion calls must authenticate using a valid API Key in the HTTP headers.</p>
            <div className="headers-spec-table">
              <div className="spec-row">
                <code>Authorization</code>
                <span><code>Bearer &lt;API_KEY&gt;</code> (Recommended)</span>
              </div>
              <div className="spec-row">
                <code>X-API-Key</code>
                <span><code>&lt;API_KEY&gt;</code> (Alternative header)</span>
              </div>
              <div className="spec-row">
                <code>Content-Type</code>
                <span><code>application/json</code></span>
              </div>
            </div>
          </div>

          <div className="doc-section">
            <h3>2. Endpoints & Methods</h3>
            <div className="endpoint-spec-box">
              <span className="http-method post">POST</span>
              <code>/api/v1/kpi-ingest</code>
            </div>

            <h4>Request Payload Schema (JSON)</h4>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Type</th>
                    <th>Required</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>department</code></td>
                    <td>string | number</td>
                    <td><span className="required-tag">Required</span></td>
                    <td>Department Name (e.g. "Sales") or Department ID</td>
                  </tr>
                  <tr>
                    <td><code>kpi</code></td>
                    <td>string | number</td>
                    <td><span className="required-tag">Required</span></td>
                    <td>KPI Name (e.g. "Sales Revenue") or KPI ID</td>
                  </tr>
                  <tr>
                    <td><code>value</code></td>
                    <td>number</td>
                    <td><span className="required-tag">Required</span></td>
                    <td>Numeric metric value recorded by external system</td>
                  </tr>
                  <tr>
                    <td><code>unit</code></td>
                    <td>string</td>
                    <td>Optional</td>
                    <td>Unit label (e.g. "INR", "%", "ms"). Defaults to KPI unit</td>
                  </tr>
                  <tr>
                    <td><code>source</code></td>
                    <td>string</td>
                    <td>Optional</td>
                    <td>Originating system (e.g. "SAP ERP", "Salesforce", "IoT")</td>
                  </tr>
                  <tr>
                    <td><code>timestamp</code></td>
                    <td>ISO 8601 string</td>
                    <td>Optional</td>
                    <td>Timestamp of measurement. Defaults to server receipt time</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="doc-section">
            <h3>3. HTTP Status Codes & Error Responses</h3>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Status</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>201</code></td>
                    <td><span className="status-badge normal">Created</span></td>
                    <td>KPI reading successfully ingested and monitoring pipeline executed.</td>
                  </tr>
                  <tr>
                    <td><code>400</code></td>
                    <td><span className="status-badge warning">Bad Request</span></td>
                    <td>Missing mandatory fields or unknown department/KPI specified.</td>
                  </tr>
                  <tr>
                    <td><code>401</code></td>
                    <td><span className="status-badge critical">Unauthorized</span></td>
                    <td>Missing or invalid API Key supplied in headers.</td>
                  </tr>
                  <tr>
                    <td><code>403</code></td>
                    <td><span className="status-badge critical">Forbidden</span></td>
                    <td>API Key is disabled or expired.</td>
                  </tr>
                  <tr>
                    <td><code>429</code></td>
                    <td><span className="status-badge critical">Too Many Requests</span></td>
                    <td>Rate limit exceeded (1,000 requests/hour/key limit).</td>
                  </tr>
                  <tr>
                    <td><code>500</code></td>
                    <td><span className="status-badge critical">Server Error</span></td>
                    <td>Internal processing error. Retry after short backoff.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Code Snippets Right Panel */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Interactive Code Snippets</h2>
              <p>Copy-paste integration code for your enterprise stack.</p>
            </div>
          </div>

          <div className="snippet-lang-bar">
            <button
              className={`lang-button ${selectedLang === "curl" ? "active" : ""}`}
              onClick={() => setSelectedLang("curl")}
            >
              cURL
            </button>
            <button
              className={`lang-button ${selectedLang === "js" ? "active" : ""}`}
              onClick={() => setSelectedLang("js")}
            >
              JavaScript (Fetch)
            </button>
            <button
              className={`lang-button ${selectedLang === "axios" ? "active" : ""}`}
              onClick={() => setSelectedLang("axios")}
            >
              Axios
            </button>
            <button
              className={`lang-button ${selectedLang === "python" ? "active" : ""}`}
              onClick={() => setSelectedLang("python")}
            >
              Python (requests)
            </button>
          </div>

          <div className="code-snippet-preview large-snippet">
            <div className="snippet-header">
              <span>{selectedLang.toUpperCase()} Integration Example</span>
              <button className="copy-button" onClick={() => copyCode(getSnippet())}>
                Copy Code
              </button>
            </div>
            <pre>{getSnippet()}</pre>
          </div>

          <div className="doc-section sample-response-box">
            <h4>Sample Success Response (201 Created)</h4>
            <div className="code-snippet-preview">
              <pre>{JSON.stringify({
                success: true,
                message: "KPI data ingested successfully.",
                data: {
                  reading_id: 1042,
                  department: "Sales",
                  kpi: "Sales Revenue",
                  value: 450000,
                  unit: "INR",
                  source: "SAP ERP",
                  status: "CRITICAL",
                  recorded_at: "2026-08-01T10:30:00.000Z"
                }
              }, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
