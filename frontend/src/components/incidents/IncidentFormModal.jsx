import React, { useEffect, useState } from "react";

export default function IncidentFormModal({
  isOpen,
  onClose,
  onSubmit, // (formData) => Promise
  initialData = null, // null for create, object for edit
  users = [],
  isEdit = false,
}) {
  const [formData, setFormData] = useState({
    alert_id: "",
    title: "",
    description: "",
    severity: "HIGH",
    priority: "P2",
    category: "Infrastructure",
    assigned_to: "",
    created_by: "",
    source: "Monitoring System",
    tags: "",
    status: "OPEN",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (initialData && isEdit) {
      setFormData({
        alert_id: initialData.alert_id || "",
        title: initialData.title || "",
        description: initialData.description || "",
        severity: initialData.severity || initialData.priority || "HIGH",
        priority: initialData.priority || "P2",
        category: initialData.category || "Infrastructure",
        assigned_to: initialData.assigned_to || "",
        created_by: initialData.created_by || "",
        source: initialData.source || "Monitoring System",
        tags: Array.isArray(initialData.tags)
          ? initialData.tags.join(", ")
          : initialData.tags || "",
        status: initialData.status || "OPEN",
      });
    } else {
      setFormData({
        alert_id: "",
        title: "",
        description: "",
        severity: "HIGH",
        priority: "P2",
        category: "Infrastructure",
        assigned_to: "",
        created_by: users[0]?.id || "",
        source: "Monitoring System",
        tags: "",
        status: "OPEN",
      });
    }
    setErrorMsg("");
  }, [initialData, isEdit, isOpen, users]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.title.trim()) {
      setErrorMsg("Title is required.");
      return;
    }
    if (!formData.description.trim()) {
      setErrorMsg("Description is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.severity, // Ensure backend priority field receives severity if priority is string
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Failed to save incident.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card wide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">{isEdit ? "MODIFY INCIDENT" : "NEW INCIDENT ENTRY"}</span>
            <h2>{isEdit ? `Edit Incident: ${initialData?.incident_number || ""}` : "Create New Incident"}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} disabled={submitting}>
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="modal-error-alert">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid-2col">
            {/* Title */}
            <div className="form-group full-col">
              <label className="form-label">
                Incident Title <span className="required-star">*</span>
              </label>
              <input
                type="text"
                name="title"
                className="form-input"
                placeholder="e.g. Database Connection Pool Exhaustion"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={submitting}
              />
            </div>

            {/* Severity */}
            <div className="form-group">
              <label className="form-label">Severity</label>
              <select
                name="severity"
                className="form-select"
                value={formData.severity}
                onChange={handleChange}
                disabled={submitting}
              >
                <option value="CRITICAL">CRITICAL - Outage / Sev 1</option>
                <option value="HIGH">HIGH - Major Impact / Sev 2</option>
                <option value="MEDIUM">MEDIUM - Partial Impact / Sev 3</option>
                <option value="LOW">LOW - Minor Impact / Sev 4</option>
              </select>
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleChange}
                disabled={submitting}
              >
                <option value="Infrastructure">Infrastructure</option>
                <option value="Database">Database</option>
                <option value="Network">Network</option>
                <option value="Application">Application</option>
                <option value="Security">Security</option>
                <option value="API">API Integration</option>
              </select>
            </div>

            {/* Priority */}
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                name="priority"
                className="form-select"
                value={formData.priority}
                onChange={handleChange}
                disabled={submitting}
              >
                <option value="P1">P1 - Urgent</option>
                <option value="P2">P2 - High</option>
                <option value="P3">P3 - Normal</option>
                <option value="P4">P4 - Low</option>
              </select>
            </div>

            {/* Assigned Engineer */}
            <div className="form-group">
              <label className="form-label">Assigned Engineer</label>
              <select
                name="assigned_to"
                className="form-select"
                value={formData.assigned_to}
                onChange={handleChange}
                disabled={submitting}
              >
                <option value="">-- Unassigned --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role || u.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Source */}
            <div className="form-group">
              <label className="form-label">Source</label>
              <select
                name="source"
                className="form-select"
                value={formData.source}
                onChange={handleChange}
                disabled={submitting}
              >
                <option value="Monitoring System">Monitoring System</option>
                <option value="Alert System">Alert System</option>
                <option value="User Report">User Report</option>
                <option value="Automated AI">Automated AI</option>
              </select>
            </div>

            {/* Tags */}
            <div className="form-group">
              <label className="form-label">Tags (comma-separated)</label>
              <input
                type="text"
                name="tags"
                className="form-input"
                placeholder="e.g. prod, database, latency"
                value={formData.tags}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>

            {/* Status (Only in Edit mode) */}
            {isEdit && (
              <div className="form-group full-col">
                <label className="form-label">Incident Status</label>
                <select
                  name="status"
                  className="form-select"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            )}

            {/* Description */}
            <div className="form-group full-col">
              <label className="form-label">
                Description <span className="required-star">*</span>
              </label>
              <textarea
                name="description"
                className="form-textarea"
                rows={4}
                placeholder="Provide detailed description of the incident symptoms, impact, and observations..."
                value={formData.description}
                onChange={handleChange}
                required
                disabled={submitting}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={submitting}
            >
              {submitting ? "Saving..." : isEdit ? "Update Incident" : "Create Incident"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
