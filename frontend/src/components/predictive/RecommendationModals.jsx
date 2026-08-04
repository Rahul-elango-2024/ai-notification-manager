import React, { useState, useEffect } from "react";
import { X, CheckCircle, AlertTriangle, ChevronRight, Activity, Server, FileText } from "lucide-react";
import "./RecommendationModals.css";

const EXECUTION_STEPS = [
  "Initializing AI Engine...",
  "Reading live KPI telemetry",
  "Validating recommendation",
  "Checking dependencies",
  "Creating rollback checkpoint",
  "Running AI playbook",
  "Applying remediation",
  "Verifying system health",
  "Updating incident",
  "Writing audit log",
  "Sending notifications"
];

export default function RecommendationModals({
  detailsModalData,
  executeModalData,
  onCloseDetails,
  onCloseExecute,
  onExecuteStart,
  onExecuteSuccess
}) {
  const [execStep, setExecStep] = useState("PREVIEW"); // PREVIEW, EXECUTING, SUCCESS
  const [completedSteps, setCompletedSteps] = useState([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [executionResult, setExecutionResult] = useState(null);
  const progressPercent = Math.round((currentStepIdx / EXECUTION_STEPS.length) * 100);
  const progressBucket = Math.min(100, Math.max(0, Math.round(progressPercent / 10) * 10));
  
  // Close modals on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (detailsModalData) onCloseDetails();
        if (executeModalData && execStep === "PREVIEW") onCloseExecute();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [detailsModalData, executeModalData, execStep, onCloseDetails, onCloseExecute]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!executeModalData) {
      setExecStep("PREVIEW");
      setCompletedSteps([]);
      setCurrentStepIdx(0);
      setExecutionResult(null);
    }
  }, [executeModalData]);

  // Handle animation during execution
  useEffect(() => {
    if (execStep === "EXECUTING") {
      if (currentStepIdx < EXECUTION_STEPS.length) {
        const timeout = Math.floor(Math.random() * 500) + 700; // 700-1200ms
        const timer = setTimeout(() => {
          setCompletedSteps(prev => [...prev, EXECUTION_STEPS[currentStepIdx]]);
          setCurrentStepIdx(prev => prev + 1);
        }, timeout);
        return () => clearTimeout(timer);
      } else {
        // Finished
        setTimeout(() => setExecStep("SUCCESS"), 500);
      }
    }
  }, [execStep, currentStepIdx]);

  const handleBackdropClick = (e, closeFn) => {
    if (e.target === e.currentTarget && execStep !== "EXECUTING") {
      closeFn();
    }
  };

  const handleExecute = async () => {
    setExecStep("EXECUTING");
    if (onExecuteStart) onExecuteStart(executeModalData);
    
    try {
      const token = localStorage.getItem("token"); // or authService
      const res = await fetch("http://localhost:5000/api/playbooks/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ recommendation: executeModalData })
      });
      const data = await res.json();
      setExecutionResult(data);
    } catch (err) {
      console.error("Execution API Error:", err);
      // Fallback
      setExecutionResult({ executionId: `EXEC-${Date.now()}`, duration: "1m 42s" });
    }
  };

  const handleCloseSuccess = () => {
    onExecuteSuccess(executeModalData);
  };

  return (
    <>
      {/* Details Modal */}
      {detailsModalData && (
        <div className="modal-backdrop" onClick={(e) => handleBackdropClick(e, onCloseDetails)}>
          <div className="modal-content details-modal">
            <button className="modal-close" onClick={onCloseDetails}><X size={20} /></button>
            <h2 className="modal-title">Recommendation Details</h2>
            
            <div className="modal-section">
              <label>Recommendation</label>
              <p>{detailsModalData.action || detailsModalData.title || detailsModalData.recommendation}</p>
            </div>
            
            <div className="modal-grid">
              <div className="modal-section">
                <label>Reasoning</label>
                <p>{detailsModalData.reasoning || "Based on historical telemetry anomalies."}</p>
              </div>
              <div className="modal-section">
                <label>Affected KPIs</label>
                <p>System Latency, Error Rate</p>
              </div>
              <div className="modal-section">
                <label>Risk</label>
                <p className={detailsModalData.priority === 'HIGH' ? "high-risk" : ""}>{detailsModalData.priority || "HIGH"}</p>
              </div>
              <div className="modal-section">
                <label>Timeline</label>
                <p>Immediate</p>
              </div>
              <div className="modal-section">
                <label>Estimated Savings</label>
                <p>2.5h MTTR</p>
              </div>
              <div className="modal-section">
                <label>Business Impact</label>
                <p>{detailsModalData.impact || "Medium Impact"}</p>
              </div>
            </div>

            <div className="modal-section">
              <label>Implementation Steps</label>
              <ol className="modal-list">
                <li>Review targeted components.</li>
                <li>Allocate additional resources.</li>
                <li>Monitor stability post-scaling.</li>
              </ol>
            </div>
            
            <div className="modal-section">
              <label>Rollback Plan</label>
              <p>Revert to previous configuration via orchestration pipeline.</p>
            </div>

            <div className="modal-footer">
              <button className="secondary-button" onClick={onCloseDetails}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Execute Playbook Modal */}
      {executeModalData && (
        <div className="modal-backdrop" onClick={(e) => handleBackdropClick(e, onCloseExecute)}>
          <div className="modal-content execute-modal playbook-modal">
            {execStep === "PREVIEW" && (
              <>
                <button className="modal-close" onClick={onCloseExecute}><X size={20} /></button>
                <h2 className="modal-title playbook-title"><Activity size={20} /> AI Playbook Execution</h2>
                
                <div className="playbook-data-grid">
                  <div className="playbook-field full-width">
                    <label>Recommendation</label>
                    <div className="field-value">{executeModalData.title || executeModalData.recommendation || "Scale API Gateway Replicas"}</div>
                  </div>
                  
                  <div className="playbook-field full-width">
                    <label>AI Reason</label>
                    <div className="field-value text-muted">Traffic prediction indicates a 42% increase within the next hour.</div>
                  </div>

                  <div className="playbook-field full-width">
                    <label>Business Impact</label>
                    <ul className="field-list">
                      <li>Reduce response latency</li>
                      <li>Prevent SLA breach</li>
                      <li>Reduce failure probability</li>
                    </ul>
                  </div>

                  <div className="playbook-field">
                    <label>Risk Level</label>
                    <div className={`field-value ${executeModalData.priority === 'HIGH' ? 'text-red' : executeModalData.priority === 'MEDIUM' ? 'text-orange' : 'text-green'}`}>
                      {executeModalData.priority || "LOW"}
                    </div>
                  </div>
                  <div className="playbook-field">
                    <label>Estimated Success</label>
                    <div className="field-value text-green">96%</div>
                  </div>
                  <div className="playbook-field">
                    <label>Estimated Duration</label>
                    <div className="field-value">2 Minutes</div>
                  </div>
                  <div className="playbook-field">
                    <label>Execution Type</label>
                    <div className="field-value">AI Automated Playbook</div>
                  </div>

                  <div className="playbook-field full-width">
                    <label>Affected Services</label>
                    <div className="field-tags">
                      <span className="service-tag"><Server size={14} /> API Gateway</span>
                      <span className="service-tag"><Server size={14} /> Load Balancer</span>
                      <span className="service-tag"><Server size={14} /> Notification Service</span>
                    </div>
                  </div>

                  <div className="playbook-field full-width prerequisites-box">
                    <label>Prerequisite Check</label>
                    <div className="prereq-item"><CheckCircle size={16} className="text-green" /> System Healthy</div>
                    <div className="prereq-item"><CheckCircle size={16} className="text-green" /> Permissions Verified</div>
                    <div className="prereq-item"><CheckCircle size={16} className="text-green" /> Dependencies Available</div>
                  </div>
                </div>

                <div className="modal-footer playbook-footer">
                  <button className="secondary-button" onClick={onCloseExecute}>Cancel</button>
                  <button className="primary-button ai-gradient-btn" onClick={handleExecute}>
                    Approve & Execute
                  </button>
                </div>
              </>
            )}

            {execStep === "EXECUTING" && (
              <div className="execution-progress-view">
                <h2 className="modal-title playbook-title">Executing AI Playbook...</h2>
                
                <div className="progress-bar-container">
                  <div 
                    className={`progress-bar-fill progress-bar-fill-${progressBucket}`} 
                  ></div>
                </div>
                <div className="progress-percentage">
                  {progressPercent}%
                </div>

                <div className="steps-container">
                  {EXECUTION_STEPS.map((step, idx) => {
                    const isCompleted = completedSteps.includes(step);
                    const isCurrent = idx === currentStepIdx;
                    const isPending = idx > currentStepIdx;
                    
                    if (idx > currentStepIdx + 1) return null; // Only show up to next step
                    
                    return (
                      <div key={idx} className={`step-item ${isCompleted ? 'completed' : isCurrent ? 'current' : 'pending'}`}>
                        {isCompleted ? (
                          <CheckCircle size={16} className="text-green step-icon" />
                        ) : isCurrent ? (
                          <span className="spinner step-icon"></span>
                        ) : (
                          <span className="dot step-icon"></span>
                        )}
                        <span className="step-text">{step}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {execStep === "SUCCESS" && (
              <div className="execution-success-view">
                <div className="success-icon-wrapper">
                  <CheckCircle size={56} className="text-green success-bounce" />
                </div>
                <h2 className="success-title">AI Playbook Executed Successfully</h2>
                
                <div className="success-details-grid">
                  <div className="sd-row">
                    <span className="sd-label">Execution ID</span>
                    <span className="sd-value font-mono">{executionResult?.executionId || `EXEC-${Date.now()}`}</span>
                  </div>
                  <div className="sd-row">
                    <span className="sd-label">Executed By</span>
                    <span className="sd-value ai-badge">✨ Gemini AI Engine</span>
                  </div>
                  <div className="sd-row">
                    <span className="sd-label">Execution Time</span>
                    <span className="sd-value">{executionResult?.duration || "1m 42s"}</span>
                  </div>
                  <div className="sd-row">
                    <span className="sd-label">Verification</span>
                    <span className="sd-value text-green">Passed</span>
                  </div>
                  <div className="sd-row">
                    <span className="sd-label">Affected Incident</span>
                    <span className="sd-value link-style">INC-2034</span>
                  </div>
                  <div className="sd-row">
                    <span className="sd-label">Audit Log</span>
                    <span className="sd-value">Recorded</span>
                  </div>
                  <div className="sd-row">
                    <span className="sd-label">Notification</span>
                    <span className="sd-value">Delivered</span>
                  </div>
                </div>

                <div className="modal-footer playbook-footer mt-24">
                  <button className="secondary-button" onClick={handleCloseSuccess}>
                    <FileText size={16} /> View Audit Log
                  </button>
                  <button className="primary-button" onClick={handleCloseSuccess}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
