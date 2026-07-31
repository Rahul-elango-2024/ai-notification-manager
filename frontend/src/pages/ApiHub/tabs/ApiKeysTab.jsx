import React, { useState } from "react";

export default function ApiKeysTab({
  apiKeys = [],
  departments = [],
  onRefresh,
  addToast,
  authHeaders,
  apiUrl,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Key Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({
    key_name: "",
    department_id: "",
    owner_name: "",
    description: "",
    expires_at: "",
  });
  const [createdSecret, setCreatedSecret] = useState(null);
  const [savingKey, setSavingKey] = useState(false);

  // Rotate Key Secret Modal
  const [rotatedSecret, setRotatedSecret] = useState(null);

  // View Details Modal State
  const [viewKeyDetails, setViewKeyDetails] = useState(null);

  // Delete Confirmation Modal State
  const [keyToDelete, setKeyToDelete] = useState(null);
  const [deletingKey, setDeletingKey] = useState(false);

  // Copy helper
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    addToast("Copied to clipboard!", "success");
  };

  // Filter keys
  const filteredKeys = apiKeys.filter((k) => {
    const matchesSearch =
      k.key_name.toLowerCase().includes(search.toLowerCase()) ||
      k.key_prefix.toLowerCase().includes(search.toLowerCase()) ||
      (k.owner_name && k.owner_name.toLowerCase().includes(search.toLowerCase())) ||
      (k.department_name && k.department_name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || k.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!newKeyForm.key_name.trim()) {
      addToast("Key Name is required.", "error");
      return;
    }

    setSavingKey(true);
    try {
      const res = await fetch(`${apiUrl}/api/api-keys`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          ...newKeyForm,
          department_id: newKeyForm.department_id ? Number(newKeyForm.department_id) : null,
          expires_at: newKeyForm.expires_at ? new Date(newKeyForm.expires_at).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create API key.");

      setCreatedSecret({
        name: data.key.key_name,
        plainTextKey: data.plainTextKey,
      });

      addToast(`API Key '${data.key.key_name}' created successfully.`, "success");
      onRefresh();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSavingKey(false);
    }
  };

  const handleRotateKey = async (id, name) => {
    if (!window.confirm(`Are you sure you want to rotate credentials for API Key '${name}'? The existing key will stop working immediately.`)) {
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/api-keys/${id}/rotate`, {
        method: "POST",
        headers: authHeaders(),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rotate API key.");

      setRotatedSecret({
        name: data.key.key_name,
        plainTextKey: data.plainTextKey,
      });

      addToast(`API Key '${name}' rotated successfully.`, "success");
      onRefresh();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleToggleStatus = async (id, currentStatus, name) => {
    const newStatus = currentStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      const res = await fetch(`${apiUrl}/api/api-keys/${id}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update API key status.");

      addToast(`API Key '${name}' status updated to ${newStatus}.`, "success");
      onRefresh();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleRevokeKey = async (id, name) => {
    if (!window.confirm(`Are you sure you want to revoke API Key '${name}'?`)) {
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/api-keys/${id}/revoke`, {
        method: "POST",
        headers: authHeaders(),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke API key.");

      addToast(`API Key '${name}' revoked.`, "info");
      onRefresh();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  // Permanent Delete Handler
  const confirmDeleteKey = async () => {
    if (!keyToDelete) return;
    setDeletingKey(true);

    try {
      const res = await fetch(`${apiUrl}/api/api-keys/${keyToDelete.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete API key.");

      addToast("API Key deleted successfully.", "success");
      setKeyToDelete(null);
      onRefresh();
    } catch (err) {
      addToast(err.message || "Failed to delete API key.", "error");
    } finally {
      setDeletingKey(false);
    }
  };

  return (
    <div className="tab-content api-keys-tab">
      {/* Control Bar */}
      <div className="tab-control-bar">
        <div className="search-filter-group">
          <input
            type="text"
            className="search-input"
            placeholder="Search key name, prefix, owner, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="DISABLED">Disabled Only</option>
            <option value="REVOKED">Revoked Only</option>
          </select>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            setCreatedSecret(null);
            setNewKeyForm({ key_name: "", department_id: "", owner_name: "", description: "", expires_at: "" });
            setShowCreateModal(true);
          }}
        >
          + Generate New API Key
        </button>
      </div>

      {/* Keys Table Panel */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>API Key Registry</h2>
            <p>Manage authentication credentials for external enterprise integrations.</p>
          </div>
          <span className="count-badge">{filteredKeys.length} Key(s)</span>
        </div>

        {filteredKeys.length > 0 ? (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Key Identifier</th>
                  <th>Prefix</th>
                  <th>Department</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Last Used</th>
                  <th>Created</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeys.map((k) => (
                  <tr key={k.id} className="api-key-row">
                    <td>
                      <strong className="table-primary">{k.key_name}</strong>
                      {k.description && <small className="table-subtext">{k.description}</small>}
                    </td>
                    <td>
                      <div className="prefix-cell">
                        <code className="key-prefix-code">{k.key_prefix}</code>
                        <button
                          className="copy-prefix-btn"
                          onClick={() => copyToClipboard(k.key_prefix)}
                          title="Copy Key Prefix"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td>{k.department_name || "All Departments"}</td>
                    <td>{k.owner_name || "-"}</td>
                    <td>
                      <span className={`status-badge ${(k.status || "").toLowerCase()}`}>
                        {k.status}
                      </span>
                    </td>
                    <td>{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "Never"}</td>
                    <td>{new Date(k.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: "right" }}>
                      <div className="action-buttons-cell">
                        <button
                          className="text-button btn-view"
                          onClick={() => setViewKeyDetails(k)}
                          title="View Details"
                        >
                          👁️ View
                        </button>

                        {k.status !== "REVOKED" && (
                          <>
                            <button
                              className="text-button btn-rotate"
                              onClick={() => handleRotateKey(k.id, k.key_name)}
                              title="Rotate Credentials"
                            >
                              ↻ Rotate
                            </button>
                            <button
                              className="text-button btn-toggle"
                              onClick={() => handleToggleStatus(k.id, k.status, k.key_name)}
                            >
                              {k.status === "ACTIVE" ? "🚫 Disable" : "✅ Enable"}
                            </button>
                            <button
                              className="danger-text-button btn-revoke"
                              onClick={() => handleRevokeKey(k.id, k.key_name)}
                            >
                              ⚠️ Revoke
                            </button>
                          </>
                        )}

                        <button
                          className="danger-text-button btn-delete-red"
                          onClick={() => setKeyToDelete(k)}
                          title="Delete API Key Permanently"
                        >
                          🗑️ Delete
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
            <div className="empty-icon">🔑</div>
            <h3>No API Keys found</h3>
            <p>Generate a new API key to begin connecting enterprise systems.</p>
          </div>
        )}
      </div>

      {/* CREATE API KEY MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className="modal enterprise-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <h3>{createdSecret ? "API Key Generated" : "Generate Enterprise API Key"}</h3>
                <p>{createdSecret ? "Save your key immediately in a secure location." : "Create an API credential for an external application."}</p>
              </div>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            {createdSecret ? (
              <div className="modal-body secret-display-body">
                <div className="security-alert-box">
                  <strong>⚠️ IMPORTANT: Copy your API Key now!</strong>
                  <p>This plaintext API key will NEVER be shown again. Store it securely in your secret store.</p>
                </div>

                <div className="secret-key-box">
                  <code>{createdSecret.plainTextKey}</code>
                  <button className="primary-button" onClick={() => copyToClipboard(createdSecret.plainTextKey)}>
                    Copy Key
                  </button>
                </div>

                <div className="modal-actions">
                  <button className="secondary-button" onClick={() => setShowCreateModal(false)}>
                    I Have Saved My API Key
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey}>
                <div className="modal-body">
                  <div className="form-field">
                    <label className="form-label">Key Name <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. SAP ERP Production Key"
                      value={newKeyForm.key_name}
                      onChange={(e) => setNewKeyForm({ ...newKeyForm, key_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label className="form-label">Assigned Department</label>
                    <select
                      className="form-select"
                      value={newKeyForm.department_id}
                      onChange={(e) => setNewKeyForm({ ...newKeyForm, department_id: e.target.value })}
                    >
                      <option value="">All Departments (Global)</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label className="form-label">Owner / System Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Finance Operations Team"
                      value={newKeyForm.owner_name}
                      onChange={(e) => setNewKeyForm({ ...newKeyForm, owner_name: e.target.value })}
                    />
                  </div>

                  <div className="form-field">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Purpose or application details..."
                      rows={3}
                      value={newKeyForm.description}
                      onChange={(e) => setNewKeyForm({ ...newKeyForm, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="secondary-button" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-button" disabled={savingKey}>
                    {savingKey ? "Generating..." : "Generate Key"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* VIEW API KEY DETAILS MODAL */}
      {viewKeyDetails && (
        <div className="modal-overlay" onClick={() => setViewKeyDetails(null)}>
          <div className="modal enterprise-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <h3>API Key Details</h3>
                <p>Security & telemetry information for '{viewKeyDetails.key_name}'</p>
              </div>
              <button className="modal-close" onClick={() => setViewKeyDetails(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="info-grid">
                <div className="info-cell">
                  <span className="info-label">Key Name</span>
                  <strong className="info-value">{viewKeyDetails.key_name}</strong>
                </div>
                <div className="info-cell">
                  <span className="info-label">Key Prefix</span>
                  <code className="key-prefix-code">{viewKeyDetails.key_prefix}</code>
                </div>
                <div className="info-cell">
                  <span className="info-label">Department</span>
                  <span className="info-value">{viewKeyDetails.department_name || "Global"}</span>
                </div>
                <div className="info-cell">
                  <span className="info-label">Owner</span>
                  <span className="info-value">{viewKeyDetails.owner_name || "N/A"}</span>
                </div>
                <div className="info-cell">
                  <span className="info-label">Status</span>
                  <span className={`status-badge ${(viewKeyDetails.status || "").toLowerCase()}`}>
                    {viewKeyDetails.status}
                  </span>
                </div>
                <div className="info-cell">
                  <span className="info-label">Created At</span>
                  <span className="info-value">{new Date(viewKeyDetails.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setViewKeyDetails(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE API KEY CONFIRMATION DIALOG */}
      {keyToDelete && (
        <div className="modal-overlay" onClick={() => setKeyToDelete(null)}>
          <div className="modal enterprise-modal delete-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <h3 style={{ color: "#ef4444" }}>Delete API Key</h3>
                <p>Confirm permanent deletion of key '{keyToDelete.key_name}'</p>
              </div>
              <button className="modal-close" onClick={() => setKeyToDelete(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="security-alert-box danger-box">
                <strong>⚠️ Permanent Action Warning</strong>
                <p>This action permanently deletes the API key. Applications using this key will immediately lose access.</p>
              </div>
            </div>

            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setKeyToDelete(null)} disabled={deletingKey}>
                Cancel
              </button>
              <button className="danger-button-red" onClick={confirmDeleteKey} disabled={deletingKey}>
                {deletingKey ? "Deleting..." : "Delete Key"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROTATE SECRET DISPLAY MODAL */}
      {rotatedSecret && (
        <div className="modal-overlay" onClick={() => setRotatedSecret(null)}>
          <div className="modal enterprise-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <h3>API Key Credentials Rotated</h3>
                <p>New credentials issued for '{rotatedSecret.name}'.</p>
              </div>
              <button className="modal-close" onClick={() => setRotatedSecret(null)}>×</button>
            </div>

            <div className="modal-body secret-display-body">
              <div className="security-alert-box">
                <strong>⚠️ Credentials Rotated Successfully!</strong>
                <p>The old key has been revoked. Copy and configure the new key immediately.</p>
              </div>

              <div className="secret-key-box">
                <code>{rotatedSecret.plainTextKey}</code>
                <button className="primary-button" onClick={() => copyToClipboard(rotatedSecret.plainTextKey)}>
                  Copy Key
                </button>
              </div>

              <div className="modal-actions">
                <button className="secondary-button" onClick={() => setRotatedSecret(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
