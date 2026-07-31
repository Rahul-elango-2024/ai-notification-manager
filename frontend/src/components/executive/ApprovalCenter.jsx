import React, { memo } from "react";

const ApprovalCenter = memo(function ApprovalCenter({ approvals = [], onActOnApproval, onOpenApprovalDetail }) {
  const defaultApprovals = [
    { id: 1, title: "Scale API Gateway Pod Replicas from 8 to 16", requester_name: "Alex Rivera", department: "IT Infrastructure", risk_level: "HIGH", status: "PENDING" },
    { id: 2, title: "Emergency Redis In-Memory Cache Flush", requester_name: "DevOps Bot", department: "Operations", risk_level: "MEDIUM", status: "PENDING" },
    { id: 3, title: "Enable Cloudflare IP Rate Limiting Rule #402", requester_name: "Elena Rostova", department: "Security", risk_level: "HIGH", status: "APPROVED", approver_name: "Sarah Jenkins", comments: "Approved for deployment." },
  ];

  const list = approvals.length > 0 ? approvals : defaultApprovals;

  return (
    <div className="panel approval-center-panel" role="region" aria-label="Approval Queue">
      <div className="panel-header">
        <div>
          <h2>✍️ Approval Queue</h2>
          <p>Scannable change gate. Click View for full risk details and comments.</p>
        </div>
      </div>

      <div className="approval-cards-grid">
        {list.map((item) => {
          const statusLower = (item.status || "PENDING").toLowerCase();
          return (
            <div key={item.id} className={`approval-card status-${statusLower}`}>
              <div className="approval-card-top">
                <span className="approval-dept">{item.department}</span>
                <span className={`priority-badge prio-${item.risk_level.toLowerCase()}`}>{item.risk_level} Risk</span>
              </div>

              <h4 className="approval-title">{item.title}</h4>
              <span className="approval-requester">Requester: <strong>{item.requester_name}</strong></span>

              <div className="approval-actions">
                <button
                  className="secondary-button small-btn"
                  onClick={() => onOpenApprovalDetail && onOpenApprovalDetail(item)}
                >
                  👁️ View
                </button>
                {item.status === "PENDING" && (
                  <>
                    <button
                      className="danger-button small-btn"
                      onClick={() => onActOnApproval && onActOnApproval(item.id, "REJECTED")}
                    >
                      Reject
                    </button>
                    <button
                      className="primary-button small-btn"
                      onClick={() => onActOnApproval && onActOnApproval(item.id, "APPROVED")}
                    >
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default ApprovalCenter;
