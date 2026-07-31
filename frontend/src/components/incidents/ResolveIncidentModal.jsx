import React, { useState, useEffect } from "react";

export default function ResolveIncidentModal({
  isOpen,
  onClose,
  onSubmit, // (resolveData) => Promise
  incident = null,
}) {
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [preventiveAction, setPreventiveAction] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setResolutionSummary("");
      setRootCause("");
      setPreventiveAction("");
      setErrorMsg("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!resolutionSummary.trim()) {
      setErrorMsg("Resolution Summary is required.");
      return;
    }

    setSubmitting(true);
    try {
      const combinedNotes = [
        `Summary: ${resolutionSummary.trim()}`,
        rootCause.trim() ? `Root Cause: ${rootCause.trim()}` : "",
        preventiveAction.trim() ? `Preventive Action: ${preventiveAction.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      await onSubmit({
        notes: combinedNotes,
        resolution_summary: resolutionSummary.trim(),
        root_cause: rootCause.trim(),
        preventive_action: preventiveAction.trim(),
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Failed to resolve incident.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">RESOLVE INCIDENT</span>
            <h2>Resolve {incident?.incident_number || "Incident"}</h2>
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
          {/* Resolution Summary */}
          <div className="form-group">
            <label className="form-label">
              Resolution Summary <span className="required-star">*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Summarize how the incident was mitigated and resolved..."
              value={resolutionSummary}
              onChange={(e) => setResolutionSummary(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          {/* Root Cause */}
          <div className="form-group">
            <label className="form-label">Root Cause Analysis</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Identify the underlying cause (e.g. database connection pool exhaustion)..."
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              disabled={submitting}
            />
          </div>

          {/* Preventive Action */}
          <div className="form-group">
            <label className="form-label">Preventive Action</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Steps taken or recommended to prevent recurrence..."
              value={preventiveAction}
              onChange={(e) => setPreventiveAction(e.target.value)}
              disabled={submitting}
            />
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
              className="primary-button green"
              disabled={submitting}
            >
              {submitting ? "Resolving..." : "✅ Confirm Resolution"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
