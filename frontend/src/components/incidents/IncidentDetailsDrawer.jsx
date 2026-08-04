import React, { useState, memo } from "react";
import { FileText, Bot, Search, Briefcase, ShieldCheck, MessageSquare, Clock3, FileSearch, X, ChevronDown, CheckCircle2 } from "lucide-react";
import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";
import Timeline from "./Timeline";

const AccordionSection = ({ icon: Icon, title, subtitle, isExpanded, onToggle, children }) => {
  return (
    <div className={`enterprise-accordion ${!isExpanded ? 'collapsed' : ''}`}>
      <button type="button" className="accordion-header" onClick={onToggle} aria-expanded={isExpanded}>
        <div className="accordion-header-left">
          <span className="accordion-icon-wrap">
            <Icon size={22} strokeWidth={2} className="accordion-icon" />
          </span>
          <div className="accordion-title-block">
            <h3 className="accordion-title">{title}</h3>
            <span className="accordion-subtitle">{subtitle}</span>
          </div>
        </div>
        <ChevronDown size={20} strokeWidth={2} className="accordion-chevron" />
      </button>
      <div className="accordion-content">
        {children}
      </div>
    </div>
  );
};

const IncidentDetailsDrawer = memo(function IncidentDetailsDrawer({
  isOpen,
  onClose,
  incidentData,
  loading = false,
}) {
  const [collapsedSections, setCollapsedSections] = useState({
    riskSummary: false,
    aiAnalysis: false,
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
  const confidenceBucket = Math.min(100, Math.max(10, Math.round(confidenceScore / 10) * 10));

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

  const recommendations = ai.recommended_actions 
    ? ai.recommended_actions.split('\n').filter(Boolean)
    : incident.recommended_actions 
      ? incident.recommended_actions.split('\n').filter(Boolean)
      : ["Increase database pool size limit.", "Enable automatic rate limiting on ingestion endpoints."];

  return (
    <div className="drawer-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Incident Details Panel">
      <div className="drawer-panel enterprise-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Enterprise Header */}
        <div className="enterprise-header">
          <div className="enterprise-header-left">
            <span className="enterprise-incident-id">{incident.incident_number || "INC-2049"}</span>
            <h2 className="enterprise-incident-title">{incident.title || "Loading Incident Details..."}</h2>
            <StatusBadge status={incident.status} />
            <PriorityBadge priority={incident.severity || incident.priority} />
          </div>
          <button className="enterprise-close-btn" onClick={onClose} aria-label="Close drawer">
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="drawer-skeleton-loading">
            <div className="skeleton-bar title" />
            <div className="skeleton-bar medium" />
            <div className="skeleton-bar short" />
            <div className="skeleton-box" />
            <div className="skeleton-box" />
          </div>
        ) : (
          <div className="enterprise-drawer-body">
            {/* 4 Summary Cards */}
            <div className="enterprise-summary-grid">
              <div className="enterprise-summary-card">
                <span className="summary-label">STATUS</span>
                <div className="summary-value-wrapper"><StatusBadge status={incident.status} /></div>
              </div>
              <div className="enterprise-summary-card">
                <span className="summary-label">SEVERITY</span>
                <div className="summary-value-wrapper"><PriorityBadge priority={incident.severity || incident.priority} /></div>
              </div>
              <div className="enterprise-summary-card">
                <span className="summary-label">CATEGORY</span>
                <span className="summary-value">{incident.category || "Infrastructure"}</span>
              </div>
              <div className="enterprise-summary-card">
                <span className="summary-label">OWNER</span>
                <span className="summary-value">{incident.assignee_name || (incident.assigned_to ? `User #${incident.assigned_to}` : "Unassigned")}</span>
              </div>
            </div>

            {/* 1. RISK SUMMARY */}
            <AccordionSection
              icon={FileText}
              title="Risk Summary"
              subtitle="Calculated risk score and standard deviation"
              isExpanded={!collapsedSections.riskSummary}
              onToggle={() => toggleSection("riskSummary")}
            >
              <div className="metadata-grid">
                <div className="risk-score-block">
                  <div className="risk-header">
                    <span className="metadata-label">AI CONFIDENCE SCORE</span>
                    <span className="risk-percentage">{confidenceScore}%</span>
                  </div>
                  <div className="risk-track">
                    <div className={`risk-fill risk-fill-${confidenceBucket}`} />
                  </div>
                </div>
                <div className="metadata-cell">
                  <span className="metadata-label">DEVIATION</span>
                  <p className="metadata-value warning-text">+{(incident.deviation || 12.4).toFixed(1)}%</p>
                </div>
              </div>
            </AccordionSection>

            {/* 2. AI DIAGNOSTIC ANALYSIS */}
            <AccordionSection
              icon={Bot}
              title="AI Diagnostic Analysis"
              subtitle="Automated summary and behavior tracking"
              isExpanded={!collapsedSections.aiAnalysis}
              onToggle={() => toggleSection("aiAnalysis")}
            >
              {ai.incident_summary ? (
                <div className="ai-analysis-layout">
                  <div className="ai-summary-block">
                    <p className="metadata-value">{ai.incident_summary}</p>
                  </div>
                </div>
              ) : (
                <p className="empty-state">No AI Analysis generated for this incident.</p>
              )}
            </AccordionSection>

            {/* 3. ROOT CAUSE */}
            <AccordionSection
              icon={Search}
              title="Probable Root Cause"
              subtitle="Underlying trigger identified by analysis"
              isExpanded={!collapsedSections.rootCause}
              onToggle={() => toggleSection("rootCause")}
            >
              <div className="highlight-card warning">
                <p className="metadata-value">{ai.probable_root_cause || incident.root_cause || "Primary root cause: Connection pool starvation under peak concurrent API traffic."}</p>
              </div>
            </AccordionSection>

            {/* 4. BUSINESS IMPACT */}
            <AccordionSection
              icon={Briefcase}
              title="Business Impact"
              subtitle="SLA risks and downstream effects"
              isExpanded={!collapsedSections.impact}
              onToggle={() => toggleSection("impact")}
            >
              <div className="highlight-card info">
                <p className="metadata-value">{ai.business_impact || incident.business_impact || "Potential latency spikes across dependent notification webhook listeners (~12% affected)."}</p>
              </div>
            </AccordionSection>

            {/* 5. RECOMMENDATIONS */}
            <AccordionSection
              icon={ShieldCheck}
              title="Recommended Actions"
              subtitle="Checklist of mitigation steps"
              isExpanded={!collapsedSections.recommended}
              onToggle={() => toggleSection("recommended")}
            >
              <div className="checklist-container">
                {recommendations.map((rec, i) => (
                  <div key={i} className="checklist-item">
                    <CheckCircle2 size={18} className="checklist-icon" />
                    <span className="metadata-value">{rec.replace(/^\d+\.\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* 6. COMMENTS */}
            <AccordionSection
              icon={MessageSquare}
              title={`Discussion (${comments.length})`}
              subtitle="Engineer notes and collaborative updates"
              isExpanded={!collapsedSections.comments}
              onToggle={() => toggleSection("comments")}
            >
              <div className="enterprise-comments">
                {comments.map((c) => (
                  <div key={c.id} className="comment-card">
                    <div className="comment-avatar">{c.author.charAt(0)}</div>
                    <div className="comment-details">
                      <div className="comment-header">
                        <span className="comment-name">{c.author}</span>
                        <span className="comment-timestamp">{c.time}</span>
                      </div>
                      <p className="comment-text">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddComment} className="enterprise-comment-form">
                <input
                  type="text"
                  className="enterprise-input"
                  placeholder="Add an investigation note..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button type="submit" className="enterprise-btn-primary">Post</button>
              </form>
            </AccordionSection>

            {/* 7. TIMELINE */}
            <AccordionSection
              icon={Clock3}
              title="Timeline"
              subtitle="Chronological event history"
              isExpanded={!collapsedSections.timeline}
              onToggle={() => toggleSection("timeline")}
            >
              <Timeline timeline={timeline} />
            </AccordionSection>

            {/* 8. AUDIT LOG */}
            <AccordionSection
              icon={FileSearch}
              title="Audit Log"
              subtitle="System state tracking entries"
              isExpanded={!collapsedSections.auditLog}
              onToggle={() => toggleSection("auditLog")}
            >
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>TIMESTAMP</th>
                    <th>ACTION</th>
                    <th>ACTOR</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{formatDate(incident.created_at)}</td>
                    <td><span className="audit-badge">INCIDENT_CREATED</span></td>
                    <td>User #{incident.created_by || "System"}</td>
                  </tr>
                  {incident.updated_at && (
                    <tr>
                      <td>{formatDate(incident.updated_at)}</td>
                      <td><span className="audit-badge update">INCIDENT_UPDATED</span></td>
                      <td>System Triage Engine</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </AccordionSection>
          </div>
        )}
      </div>
    </div>
  );
});

export default IncidentDetailsDrawer;
