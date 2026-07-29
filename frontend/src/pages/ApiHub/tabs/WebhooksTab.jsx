import React, { useState, useEffect } from "react";

const EVENT_OPTIONS = [
  { id: "ALERT_CREATED", label: "Alert Created", desc: "Triggered when a new WARNING or CRITICAL alert is generated" },
  { id: "ALERT_RESOLVED", label: "Alert Resolved", desc: "Triggered when an alert is resolved manually or auto-resolved" },
  { id: "ALERT_ACKNOWLEDGED", label: "Alert Acknowledged", desc: "Triggered when a team member acknowledges an alert" },
  { id: "CRITICAL_KPI", label: "Critical KPI Ingested", desc: "Triggered when external ingestion reports a KPI in CRITICAL status" },
  { id: "WARNING_KPI", label: "Warning KPI Ingested", desc: "Triggered when external ingestion reports a KPI in WARNING status" },
];

export default function WebhooksTab({ webhooks, departments, onRefresh, addToast, authHeaders, apiUrl }) {
  const [activeSubTab, setActiveSubTab] = useState("webhooks"); // "webhooks" | "logs"
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [form, setForm] = useState({
    name: "",
    target_url: "",
    secret_header: "",
    events: ["ALERT_CREATED", "CRITICAL_KPI"],
    department_id: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchWebhookLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`${apiUrl}/api/webhook-logs`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch webhook logs.");
      const data = await res.json();
      setWebhookLogs(data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === "logs") {
      fetchWebhookLogs();
    }
  }, [activeSubTab]);

  const handleOpenCreate = () => {
    setEditingWebhook(null);
    setForm({
      name: "",
      target_url: "",
      secret_header: "",
      events: ["ALERT_CREATED", "CRITICAL_KPI"],
      department_id: "",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (w) => {
    setEditingWebhook(w);
    setForm({
      name: w.name,
      target_url: w.target_url,
      secret_header: w.secret_header || "",
      events: Array.isArray(w.events) ? w.events : [],
      department_id: w.department_id || "",
    });
    setShowModal(true);
  };

  const handleToggleEvent = (eventId) => {
    setForm((prev) => {
      const exists = prev.events.includes(eventId);
      const newEvents = exists
        ? prev.events.filter((e) => e !== eventId)
        : [...prev.events, eventId];
      return { ...prev, events: newEvents };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.target_url.trim()) {
      addToast("Name and Target URL are required.", "error");
      return;
    }
    if (form.events.length === 0) {
      addToast("Select at least one event subscription.", "error");
      return;
    }

    setSaving(true);
    try {
      const endpoint = editingWebhook
        ? `${apiUrl}/api/webhooks/${editingWebhook.id}`
        : `${apiUrl}/api/webhooks`;

      const method = editingWebhook ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          ...form,
          department_id: form.department_id ? Number(form.department_id) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save webhook.");

      addToast(`Webhook '${form.name}' saved successfully.`, "success");
      setShowModal(false);
      onRefresh();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id, name) => {
    try {
      const res = await fetch(`${apiUrl}/api/webhooks/${id}/status`, {
        method: "PATCH",
        headers: authHeaders(),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle webhook status.");

      addToast(`Webhook '${name}' status updated.`, "success");
      onRefresh();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete Webhook '${name}'?`)) {
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/webhooks/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (!res.ok) throw new Error("Failed to delete webhook.");

      addToast(`Webhook '${name}' deleted.`, "info");
      onRefresh();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  return (
    <div className="tab-content webhooks-tab">
      {/* Sub-tab switcher */}
      <div className="sub-tab-bar">
        <button
          className={`sub-tab-button ${activeSubTab === "webhooks" ? "active" : ""}`}
          onClick={() => setActiveSubTab("webhooks")}
        >
          Active Webhooks ({webhooks.length})
        </button>
        <button
          className={`sub-tab-button ${activeSubTab === "logs" ? "active" : ""}`}
          onClick={() => setActiveSubTab("logs")}
        >
          Delivery History & Logs
        </button>
      </div>

      {activeSubTab === "webhooks" ? (
        <>
          <div className="tab-control-bar">
            <p className="tab-lead-text">Configure outbound HTTP POST callbacks triggered on system events.</p>
            <button className="primary-button" onClick={handleOpenCreate}>
              + Register New Webhook
            </button>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Configured Webhook Endpoints</h2>
                <p>Real-time event notification subscribers.</p>
              </div>
            </div>

            {webhooks.length > 0 ? (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Webhook Name</th>
                      <th>Target Endpoint URL</th>
                      <th>Subscribed Events</th>
                      <th>Scope Department</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhooks.map((w) => (
                      <tr key={w.id}>
                        <td><strong>{w.name}</strong></td>
                        <td><code>{w.target_url}</code></td>
                        <td>
                          <div className="event-tag-list">
                            {(Array.isArray(w.events) ? w.events : []).map((e) => (
                              <span className="event-tag" key={e}>{e}</span>
                            ))}
                          </div>
                        </td>
                        <td>{w.department_name || "All Departments"}</td>
                        <td>
                          <span className={`status-badge ${w.is_active ? "normal" : "critical"}`}>
                            {w.is_active ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons-cell">
                            <button className="text-button" onClick={() => handleOpenEdit(w)}>
                              Edit
                            </button>
                            <button className="text-button" onClick={() => handleToggleStatus(w.id, w.name)}>
                              {w.is_active ? "Disable" : "Enable"}
                            </button>
                            <button className="danger-text-button" onClick={() => handleDelete(w.id, w.name)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📡</div>
                <h3>No webhooks configured</h3>
                <p>Register a target URL to receive automated alerts and KPI status updates.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* WEBHOOK LOGS VIEW */
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Webhook Delivery Audit Log</h2>
              <p>Outbound dispatch attempts, response codes, and error trace logs.</p>
            </div>
            <button className="secondary-button" onClick={fetchWebhookLogs} disabled={loadingLogs}>
              {loadingLogs ? "Refreshing..." : "↻ Refresh Logs"}
            </button>
          </div>

          {loadingLogs ? (
            <div className="loading-screen">Loading delivery logs...</div>
          ) : webhookLogs.length > 0 ? (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Webhook Name</th>
                    <th>Target URL</th>
                    <th>Event Type</th>
                    <th>HTTP Status</th>
                    <th>Delivery Status</th>
                    <th>Latency</th>
                    <th>Error Details</th>
                  </tr>
                </thead>
                <tbody>
                  {webhookLogs.map((l) => (
                    <tr key={l.id}>
                      <td>{new Date(l.created_at).toLocaleString()}</td>
                      <td><strong>{l.webhook_name || "Deleted Webhook"}</strong></td>
                      <td><code>{l.target_url}</code></td>
                      <td><span className="event-tag">{l.event_type}</span></td>
                      <td>
                        {l.response_status ? (
                          <span className={`http-code-badge ${l.response_status < 300 ? "status-200" : "status-500"}`}>
                            {l.response_status}
                          </span>
                        ) : "-"}
                      </td>
                      <td>
                        <span className={`status-badge ${(l.status || "").toLowerCase()}`}>
                          {l.status}
                        </span>
                      </td>
                      <td>{l.latency_ms || 0} ms</td>
                      <td>{l.error_message || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📡</div>
              <h3>No webhook delivery attempts yet</h3>
              <p>When events match active webhook rules, delivery logs will be recorded here.</p>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT WEBHOOK MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <h3>{editingWebhook ? "Edit Webhook Registration" : "Register Outbound Webhook"}</h3>
                <p>Receive HTTP POST payloads when system events occur.</p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-field">
                  <label className="form-label">Webhook Name <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Slack Incident Alert Gateway"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Target Endpoint URL <span className="required">*</span></label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://api.yourcompany.com/webhooks/alerts"
                    value={form.target_url}
                    onChange={(e) => setForm({ ...form, target_url: e.target.value })}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Secret Header Value (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Passed in X-Webhook-Secret header for authentication"
                    value={form.secret_header}
                    onChange={(e) => setForm({ ...form, secret_header: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Scope Department (Optional)</label>
                  <select
                    className="form-select"
                    value={form.department_id}
                    onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                  >
                    <option value="">All Departments (Global)</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Subscribed Event Triggers <span className="required">*</span></label>
                  <div className="checkbox-options-grid">
                    {EVENT_OPTIONS.map((opt) => (
                      <label className="checkbox-card-item" key={opt.id}>
                        <input
                          type="checkbox"
                          checked={form.events.includes(opt.id)}
                          onChange={() => handleToggleEvent(opt.id)}
                        />
                        <div>
                          <strong>{opt.label}</strong>
                          <p>{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? "Saving..." : editingWebhook ? "Update Webhook" : "Register Webhook"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
