import React, { useEffect, memo } from "react";
import "./ExecutiveDetailDrawer.css";

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
    <div className="exec-drawer-overlay" onClick={onClose}>
      <div className="exec-drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="exec-drawer-header">
          <div>
            <span className="badge badge-primary">{type || "DETAILS"}</span>
            <h2 className="exec-drawer-title">{data.title || data.actor_name || "Operational Details"}</h2>
          </div>
          <button className="exec-close-btn" onClick={onClose} aria-label="Close drawer">✕</button>
        </div>

        <div className="exec-drawer-body">
          {type === "TASK" && (
            <div className="exec-drawer-two-column-grid">
              <div className="exec-drawer-main-col">
                <div className="exec-drawer-section">
                  <h3 className="exec-section-title-sm">Task Description</h3>
                  <p className="exec-body-text">{data.description || "Scale pod workers to mitigate Payment Webhook latency spike."}</p>
                </div>

                <div className="exec-drawer-section">
                  <h3 className="exec-section-title-sm">AI Recommendation</h3>
                  <p className="exec-body-text">Scale worker pod replicas from 4 to 12. Expected latency reduction: 760ms.</p>
                </div>

                <div className="exec-drawer-section">
                  <h3 className="exec-section-title-sm">Timeline</h3>
                  <div className="exec-vertical-timeline">
                    <div className="exec-timeline-event">
                      <div className="exec-timeline-node"></div>
                      <div className="exec-timeline-content">
                        <strong>Task Created</strong>
                        <span className="exec-timeline-time">10:00 AM</span>
                      </div>
                    </div>
                    <div className="exec-timeline-event">
                      <div className="exec-timeline-node ai-node"></div>
                      <div className="exec-timeline-content">
                        <strong>AI Recommendation Generated</strong>
                        <span className="exec-timeline-time">10:02 AM</span>
                      </div>
                    </div>
                    <div className="exec-timeline-event">
                      <div className="exec-timeline-node"></div>
                      <div className="exec-timeline-content">
                        <strong>{data.status || "Pending"}</strong>
                        <span className="exec-timeline-time">Current State</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="exec-drawer-side-col">
                <div className="exec-drawer-section">
                  <h3 className="exec-section-title-sm">Properties</h3>
                  <div className="exec-drawer-meta-list">
                    <div className="exec-meta-item">
                      <span className="exec-meta-label">Priority</span>
                      <strong className={`badge badge-${(data.priority || "HIGH").toLowerCase() === "critical" ? "danger" : "warning"}`}>
                        {data.priority || "HIGH"}
                      </strong>
                    </div>
                    <div className="exec-meta-item">
                      <span className="exec-meta-label">Owner</span>
                      <strong>{data.owner_name || "Alex Rivera"}</strong>
                    </div>
                    <div className="exec-meta-item">
                      <span className="exec-meta-label">Department</span>
                      <strong>{data.department || "IT Infrastructure"}</strong>
                    </div>
                    <div className="exec-meta-item">
                      <span className="exec-meta-label">Status</span>
                      <strong className="badge badge-secondary">{data.status || "Pending"}</strong>
                    </div>
                    <div className="exec-meta-item">
                      <span className="exec-meta-label">Due Date</span>
                      <strong>{data.due_date || "15:00 EST"}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {type === "APPROVAL" && (
            <div className="exec-drawer-two-column-grid">
              <div className="exec-drawer-main-col">
                <div className="exec-drawer-section">
                  <h3 className="exec-section-title-sm">Request Details</h3>
                  <p className="exec-body-text">Authorization for emergency pod replica auto-scaling during active production traffic peak.</p>
                </div>
              </div>
              <div className="exec-drawer-side-col">
                <div className="exec-drawer-section">
                  <h3 className="exec-section-title-sm">Properties</h3>
                  <div className="exec-drawer-meta-list">
                    <div className="exec-meta-item">
                      <span className="exec-meta-label">Risk Level</span>
                      <strong className={`badge badge-${(data.risk_level || "HIGH").toLowerCase() === "high" ? "danger" : "warning"}`}>{data.risk_level || "HIGH"}</strong>
                    </div>
                    <div className="exec-meta-item">
                      <span className="exec-meta-label">Requester</span>
                      <strong>{data.requester_name || "Alex Rivera"}</strong>
                    </div>
                    <div className="exec-meta-item">
                      <span className="exec-meta-label">Department</span>
                      <strong>{data.department || "IT Infrastructure"}</strong>
                    </div>
                    <div className="exec-meta-item">
                      <span className="exec-meta-label">Status</span>
                      <strong className="badge badge-secondary">{data.status || "PENDING"}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Workflow State Machine Actions in Footer */}
        <div className="exec-drawer-footer">
          {type === "TASK" && (
            <>
              {data.status === "Pending" && (
                <>
                  <button className="exec-secondary-button" onClick={onClose}>Cancel</button>
                  <button className="exec-primary-button" onClick={() => { onTaskStateTransition && onTaskStateTransition(data.id, "Assigned"); onClose(); }}>Assign</button>
                </>
              )}

              {data.status === "Assigned" && (
                <>
                  <button className="exec-secondary-button" onClick={onClose}>Close</button>
                  <button className="exec-primary-button" onClick={() => { onTaskStateTransition && onTaskStateTransition(data.id, "In Progress"); onClose(); }}>Start Work</button>
                </>
              )}

              {data.status === "In Progress" && (
                <>
                  <button className="exec-secondary-button" onClick={() => { alert("Escalated task priority"); onClose(); }}>Escalate</button>
                  <button className="exec-primary-button" onClick={() => { onTaskStateTransition && onTaskStateTransition(data.id, "Review"); onClose(); }}>Mark Ready For Review</button>
                </>
              )}

              {data.status === "Review" && (
                <>
                  <button className="exec-danger-button" onClick={() => { onTaskStateTransition && onTaskStateTransition(data.id, "In Progress"); onClose(); }}>Request Changes</button>
                  <button className="exec-primary-button" onClick={() => { onTaskStateTransition && onTaskStateTransition(data.id, "Completed"); onClose(); }}>Approve</button>
                </>
              )}

              {data.status === "Completed" && (
                <button className="exec-secondary-button" onClick={onClose}>Archive</button>
              )}
            </>
          )}

          {type === "APPROVAL" && data.status === "PENDING" && (
            <>
              <button className="exec-danger-button" onClick={() => { onActOnApproval && onActOnApproval(data.id, "REJECTED"); onClose(); }}>Reject</button>
              <button className="exec-primary-button" onClick={() => { onActOnApproval && onActOnApproval(data.id, "APPROVED"); onClose(); }}>Approve</button>
            </>
          )}

          {!(type === "TASK" && ["Pending", "Assigned", "In Progress", "Review"].includes(data.status)) && !(type === "APPROVAL" && data.status === "PENDING") && (
            <button className="exec-secondary-button" onClick={onClose}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
});

export default ExecutiveDetailDrawer;
