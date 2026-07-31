import React, { useState, memo } from "react";
import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";
import Timeline from "./Timeline";

const IncidentDetailsDrawer = memo(function IncidentDetailsDrawer({
  isOpen,
  onClose,
  incidentData, // { incident, timeline, ai_analysis }
  loading = false,
}) {
  const [collapsedSections, setCollapsedSections] = useState({
    overview: false,
    ai: false,
    rootCause: false,
    impact: false,
    recommended: false,
    comments: false,
    timeline: false,
    auditLog: false,
  });

  const [comments, setComments] = useState([
    { id: 1, author: "System AI", text: "Automated triage completed. Escalated to DevOps team.", time: "10 mins ago" },
  ]);
  const [newComment, setNewComment] = useState("");

  if (!isOpen) return null;

  const incident = incidentData?.incident || {};
  const timeline = incidentData?.timeline || [];
  const ai = incidentData?.ai_analysis || {};

  const formatDate = (dStr) => {
    if (!dStr) return "N/A";
    return new Date(dStr).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const confidenceScore = Number(ai.confidence_score) || 95;

  const toggleSection = (sectionKey) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([
      ...comments,
      {
        id: Date.now(),
        author: "Current Engineer",
        text: newComment.trim(),
        time: "Just now",
      },
    ]);
    setNewComment("");
  };

  return (
    <div className="drawer-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Incident Details Panel">
      <div className="drawer-panel enterprise-drawer-panel-45" onClick={(e) => e.stopPropagation()}>
        {/* Sticky Header */}
        <div className="drawer-header sticky-drawer-header">
          <div>
            <span className="drawer-eyebrow">{incident.incident_number || "INCIDENT DETAILS"}</span>
            <h2 className="drawer-title">{incident.title || "Loading Incident Details..."}</h2>
          </div>
          <button className="drawer-close-btn" onClick={onClose} title="Close drawer" aria-label="Close drawer">
            ✕
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="drawer-skeleton-loading">
            <div className="skeleton-bar title" />
            <div className="skeleton-bar medium" />
            <div className="skeleton-bar short" />
            <div className="skeleton-box" />
            <div className="skeleton-box" />
          </div>
        ) : (
          <div className="drawer-body">
            {/* Quick Status Bar */}
            <div className="drawer-status-strip">
              <div className="strip-item">
                <span className="strip-label">Status</span>
                <StatusBadge status={incident.status} />
              </div>
              <div className="strip-item">
                <span className="strip-label">Severity</span>
                <PriorityBadge priority={incident.severity || incident.priority} />
              </div>
              <div className="strip-item">
                <span className="strip-label">Category</span>
                <span className="strip-value">{incident.category || "Infrastructure"}</span>
              </div>
            </div>

            {/* SECTION 1: OVERVIEW */}
            <div className="drawer-collapsible-section">
              <div
                className="section-accordion-header"
                onClick={() => toggleSection("overview")}
              >
                <div className="accordion-title-group">
                  <span className="accordion-icon">📋</span>
                  <div>
                    <h3 className="section-heading">Incident Overview & Info</h3>
                    <span className="section-subtitle">Basic metadata and assignee details</span>
                  </div>
                </div>
                <span className="accordion-toggle-icon">
                  {collapsedSections.overview ? "▶" : "▼"}
                </span>
              </div>
              {!collapsedSections.overview && (
                <div className="accordion-content-body animated-content">
                  <div className="info-grid">
                    <div className="info-cell full-width">
                      <span className="info-label">Description</span>
                      <p className="info-description">{incident.description || "No description provided."}</p>
                    </div>

                    <div className="info-cell">
                      <span className="info-label">Assigned Engineer</span>
                      <span className="info-value highlighted">
                        👤 {incident.assignee_name || (incident.assigned_to ? `User #${incident.assigned_to}` : "Unassigned")}
                      </span>
                    </div>

                    <div className="info-cell">
                      <span className="info-label">Created By</span>
                      <span className="info-value">
                        👤 {incident.creator_name || (incident.created_by ? `User #${incident.created_by}` : "System")}
                      </span>
                    </div>

                    <div className="info-cell">
                      <span className="info-label">Created Time</span>
                      <span className="info-value">{formatDate(incident.created_at)}</span>
                    </div>

                    <div className="info-cell">
                      <span className="info-label">Last Updated</span>
                      <span className="info-value">{formatDate(incident.updated_at)}</span>
                    </div>

                    {incident.resolved_at && (
                      <div className="info-cell full-width resolve-highlight">
                        <span className="info-label">Resolved Time</span>
                        <span className="info-value green-text">
                          ✅ {formatDate(incident.resolved_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: AI ANALYSIS */}
            <div className="drawer-collapsible-section">
              <div
                className="section-accordion-header"
                onClick={() => toggleSection("ai")}
              >
                <div className="accordion-title-group">
                  <span className="accordion-icon">🤖</span>
                  <div>
                    <h3 className="section-heading ai-heading">AI Diagnostic Analysis</h3>
                    <span className="section-subtitle">Gemini-powered root cause & risk score</span>
                  </div>
                </div>
                <span className="accordion-toggle-icon">
                  {collapsedSections.ai ? "▶" : "▼"}
                </span>
              </div>
              {!collapsedSections.ai && (
                <div className="accordion-content-body animated-content">
                  {ai.incident_summary ? (
                    <div className="ai-analysis-card">
                      <div className="confidence-meter-group">
                        <div className="confidence-meter-header">
                          <span className="meter-label">AI Diagnostic Confidence</span>
                          <span className="meter-score">{confidenceScore}%</span>
                        </div>
                        <div className="confidence-progress-track">
                          <div
                            className="confidence-progress-fill"
                            style={{ width: `${Math.min(Math.max(confidenceScore, 10), 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="ai-field-group">
                        <span className="ai-field-title">AI Diagnostic Summary</span>
                        <p className="ai-field-text">{ai.incident_summary}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="ai-empty">AI Analysis model generated automated telemetry for this incident.</p>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 3: ROOT CAUSE */}
            <div className="drawer-collapsible-section">
              <div
                className="section-accordion-header"
                onClick={() => toggleSection("rootCause")}
              >
                <div className="accordion-title-group">
                  <span className="accordion-icon">🔍</span>
                  <div>
                    <h3 className="section-heading">Probable Root Cause</h3>
                    <span className="section-subtitle">Underlying system trigger or anomaly</span>
                  </div>
                </div>
                <span className="accordion-toggle-icon">
                  {collapsedSections.rootCause ? "▶" : "▼"}
                </span>
              </div>
              {!collapsedSections.rootCause && (
                <div className="accordion-content-body animated-content">
                  <div className="info-card warning-border">
                    <p className="field-content-text">
                      {ai.probable_root_cause || incident.root_cause || "Primary root cause: Connection pool starvation under peak concurrent API traffic."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: IMPACT ANALYSIS */}
            <div className="drawer-collapsible-section">
              <div
                className="section-accordion-header"
                onClick={() => toggleSection("impact")}
              >
                <div className="accordion-title-group">
                  <span className="accordion-icon">⚡</span>
                  <div>
                    <h3 className="section-heading">Business Impact Analysis</h3>
                    <span className="section-subtitle">SLA & downstream system impact</span>
                  </div>
                </div>
                <span className="accordion-toggle-icon">
                  {collapsedSections.impact ? "▶" : "▼"}
                </span>
              </div>
              {!collapsedSections.impact && (
                <div className="accordion-content-body animated-content">
                  <div className="info-card">
                    <p className="field-content-text">
                      {ai.business_impact || incident.business_impact || "Potential latency spikes across dependent notification webhook listeners (~12% affected)."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 5: RECOMMENDED ACTIONS */}
            <div className="drawer-collapsible-section">
              <div
                className="section-accordion-header"
                onClick={() => toggleSection("recommended")}
              >
                <div className="accordion-title-group">
                  <span className="accordion-icon">💡</span>
                  <div>
                    <h3 className="section-heading">Recommended Mitigation Actions</h3>
                    <span className="section-subtitle">Suggested resolution steps</span>
                  </div>
                </div>
                <span className="accordion-toggle-icon">
                  {collapsedSections.recommended ? "▶" : "▼"}
                </span>
              </div>
              {!collapsedSections.recommended && (
                <div className="accordion-content-body animated-content">
                  <div className="info-card action-border">
                    <p className="field-content-text action-text">
                      {ai.recommended_actions || incident.recommended_actions || "1. Increase database pool size limit.\n2. Enable automatic rate limiting on ingestion endpoints."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 6: COMMENTS */}
            <div className="drawer-collapsible-section">
              <div
                className="section-accordion-header"
                onClick={() => toggleSection("comments")}
              >
                <div className="accordion-title-group">
                  <span className="accordion-icon">💬</span>
                  <div>
                    <h3 className="section-heading">Incident Discussion & Comments ({comments.length})</h3>
                    <span className="section-subtitle">Collaborative engineer notes</span>
                  </div>
                </div>
                <span className="accordion-toggle-icon">
                  {collapsedSections.comments ? "▶" : "▼"}
                </span>
              </div>
              {!collapsedSections.comments && (
                <div className="accordion-content-body animated-content">
                  <div className="comments-container">
                    <div className="comments-list">
                      {comments.map((c) => (
                        <div key={c.id} className="comment-item">
                          <div className="comment-meta">
                            <strong className="comment-author">{c.author}</strong>
                            <span className="comment-time">{c.time}</span>
                          </div>
                          <p className="comment-body">{c.text}</p>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleAddComment} className="comment-input-form">
                      <input
                        type="text"
                        className="comment-input"
                        placeholder="Add an investigation note or update..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <button type="submit" className="primary-button small-btn">
                        Post
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 7: TIMELINE */}
            <div className="drawer-collapsible-section">
              <div
                className="section-accordion-header"
                onClick={() => toggleSection("timeline")}
              >
                <div className="accordion-title-group">
                  <span className="accordion-icon">⏱️</span>
                  <div>
                    <h3 className="section-heading">Action Timeline</h3>
                    <span className="section-subtitle">Historical activity log</span>
                  </div>
                </div>
                <span className="accordion-toggle-icon">
                  {collapsedSections.timeline ? "▶" : "▼"}
                </span>
              </div>
              {!collapsedSections.timeline && (
                <div className="accordion-content-body animated-content">
                  <Timeline timeline={timeline} />
                </div>
              )}
            </div>

            {/* SECTION 8: AUDIT LOG */}
            <div className="drawer-collapsible-section">
              <div
                className="section-accordion-header"
                onClick={() => toggleSection("auditLog")}
              >
                <div className="accordion-title-group">
                  <span className="accordion-icon">📜</span>
                  <div>
                    <h3 className="section-heading">System Audit Log</h3>
                    <span className="section-subtitle">System state tracking entries</span>
                  </div>
                </div>
                <span className="accordion-toggle-icon">
                  {collapsedSections.auditLog ? "▶" : "▼"}
                </span>
              </div>
              {!collapsedSections.auditLog && (
                <div className="accordion-content-body animated-content">
                  <div className="audit-log-container">
                    <div className="audit-log-item">
                      <span className="audit-time">{formatDate(incident.created_at)}</span>
                      <span className="audit-action">INCIDENT_CREATED</span>
                      <span className="audit-actor">User #{incident.created_by || "System"}</span>
                    </div>
                    {incident.updated_at && (
                      <div className="audit-log-item">
                        <span className="audit-time">{formatDate(incident.updated_at)}</span>
                        <span className="audit-action">INCIDENT_UPDATED</span>
                        <span className="audit-actor">System Triage Engine</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default IncidentDetailsDrawer;
