import React, { useEffect, memo } from "react";

const ExecutiveDetailDrawer = memo(function ExecutiveDetailDrawer({ isOpen, onClose, data, type, onTaskStateTransition, onActOnApproval }) {
  // ESC key listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <span className="badge badge-primary">{type || "DETAILS"}</span>
            <h2 className="drawer-title">{data.title || data.actor_name || "Operational Details"}</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close drawer">✕</button>
        </div>

        <div className="drawer-body">
          {type === "TASK" && (
            <>
              <div className="drawer-meta-grid">
                <div className="drawer-meta-cell">
                  <span className="caption-text">Priority</span>
                  <strong className={`badge badge-${(data.priority || "HIGH").toLowerCase() === "critical" ? "danger" : "warning"}`}>
                    {data.priority || "HIGH"}
                  </strong>
                </div>
                <div className="drawer-meta-cell">
                  <span className="caption-text">Owner</span>
                  <strong>{data.owner_name || "Alex Rivera"}</strong>
                </div>
                <div className="drawer-meta-cell">
                  <span className="caption-text">Department</span>
                  <strong>{data.department || "IT Infrastructure"}</strong>
                </div>
                <div className="drawer-meta-cell">
                  <span className="caption-text">Current Status</span>
                  <strong className="badge badge-secondary">{data.status || "Pending"}</strong>
                </div>
                <div className="drawer-meta-cell">
                  <span className="caption-text">Due Date</span>
                  <strong>{data.due_date || "15:00 EST"}</strong>
                </div>
              </div>

              <div className="drawer-section">
                <h3 className="section-title-sm">Task Description</h3>
                <p className="body-text">{data.description || "Scale pod workers to mitigate Payment Webhook latency spike."}</p>
              </div>

              <div className="drawer-section">
                <h3 className="section-title-sm">AI Recommendation</h3>
                <p className="body-text">Scale worker pod replicas from 4 to 12. Expected latency reduction: 760ms.</p>
              </div>

              <div className="drawer-section">
                <h3 className="section-title-sm">Discussion Timeline</h3>
                <div className="drawer-comment-box">
                  <strong>Discussion Note:</strong> Verify WAF rate limits prior to scaling replicas.
                </div>
              </div>
            </>
          )}

          {type === "APPROVAL" && (
            <>
              <div className="drawer-meta-grid">
                <div className="drawer-meta-cell">
                  <span className="caption-text">Risk Level</span>
                  <strong>{data.risk_level || "HIGH"}</strong>
                </div>
                <div className="drawer-meta-cell">
                  <span className="caption-text">Requester</span>
                  <strong>{data.requester_name || "Alex Rivera"}</strong>
                </div>
                <div className="drawer-meta-cell">
                  <span className="caption-text">Department</span>
                  <strong>{data.department || "IT Infrastructure"}</strong>
                </div>
                <div className="drawer-meta-cell">
                  <span className="caption-text">Status</span>
                  <strong>{data.status || "PENDING"}</strong>
                </div>
              </div>

              <div className="drawer-section">
                <h3 className="section-title-sm">Request Details</h3>
                <p className="body-text">Authorization for emergency pod replica auto-scaling during active production traffic peak.</p>
              </div>
            </>
          )}
        </div>

        {/* Workflow State Machine Actions in Footer */}
        <div className="drawer-footer">
          {type === "TASK" && (
            <>
              {data.status === "Pending" && (
                <>
                  <button className="secondary-button" onClick={onClose}>
                    Cancel
                  </button>
                  <button className="primary-button" onClick={() => { onTaskStateTransition && onTaskStateTransition(data.id, "Assigned"); onClose(); }}>
                    Assign
                  </button>
                </>
              )}

              {data.status === "Assigned" && (
                <button className="primary-button" onClick={() => { onTaskStateTransition && onTaskStateTransition(data.id, "In Progress"); onClose(); }}>
                  Start Work
                </button>
              )}

              {data.status === "In Progress" && (
                <>
                  <button className="secondary-button" onClick={() => { alert("Escalated task priority"); onClose(); }}>
                    Escalate
                  </button>
                  <button className="primary-button" onClick={() => { onTaskStateTransition && onTaskStateTransition(data.id, "Review"); onClose(); }}>
                    Mark Ready For Review
                  </button>
                </>
              )}

              {data.status === "Review" && (
                <>
                  <button className="danger-button" onClick={() => { onTaskStateTransition && onTaskStateTransition(data.id, "In Progress"); onClose(); }}>
                    Request Changes
                  </button>
                  <button className="primary-button" onClick={() => { onTaskStateTransition && onTaskStateTransition(data.id, "Completed"); onClose(); }}>
                    Approve
                  </button>
                </>
              )}

              {data.status === "Completed" && (
                <button className="secondary-button" onClick={onClose}>
                  Archive
                </button>
              )}
            </>
          )}

          {type === "APPROVAL" && data.status === "PENDING" && (
            <>
              <button className="danger-button" onClick={() => { onActOnApproval && onActOnApproval(data.id, "REJECTED"); onClose(); }}>
                Reject
              </button>
              <button className="primary-button" onClick={() => { onActOnApproval && onActOnApproval(data.id, "APPROVED"); onClose(); }}>
                Approve
              </button>
            </>
          )}

          <button className="secondary-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
});

export default ExecutiveDetailDrawer;
