import React, { memo } from "react";

const ApprovalTable = memo(function ApprovalTable({ approvals = [], onActOnApproval, onOpenApprovalDetail }) {
  const defaultApprovals = [
    { id: 1, title: "Scale API Gateway Pod Replicas from 8 to 16", requester_name: "Alex Rivera", department: "IT Infrastructure", risk_level: "HIGH", status: "PENDING" },
    { id: 2, title: "Emergency Redis In-Memory Cache Flush", requester_name: "DevOps Bot", department: "Operations", risk_level: "MEDIUM", status: "PENDING" },
    { id: 3, title: "Enable Cloudflare IP Rate Limiting Rule #402", requester_name: "Elena Rostova", department: "Security", risk_level: "HIGH", status: "APPROVED", approver_name: "Sarah Jenkins", comments: "Approved for deployment." },
  ];

  const list = approvals.length > 0 ? approvals : defaultApprovals;

  return (
    <div className="section-card approval-table-panel">
      <div className="section-card-header">
        <h2 className="section-title">Pending Approvals</h2>
        <span className="caption-text">{list.length} Requests Pending</span>
      </div>

      <div className="table-responsive-wrapper">
        <table className="enterprise-table fixed-table">
          <thead>
            <tr>
              <th style={{ width: "38%" }}>Task</th>
              <th style={{ width: "18%" }}>Department</th>
              <th style={{ width: "10%" }}>Risk</th>
              <th style={{ width: "16%" }}>Requester</th>
              <th style={{ width: "18%" }} className="align-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => {
              const riskLower = (item.risk_level || "HIGH").toLowerCase();
              return (
                <tr key={item.id} className="table-row">
                  <td style={{ maxWidth: 0, overflow: "hidden" }}>
                    <button
                      className="table-task-link"
                      onClick={() => onOpenApprovalDetail && onOpenApprovalDetail(item)}
                      title={item.title}
                    >
                      {item.title}
                    </button>
                  </td>
                  <td style={{ maxWidth: 0, overflow: "hidden" }}>
                    <span className="text-truncate" title={item.department}>{item.department}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${riskLower === "critical" || riskLower === "high" ? "danger" : "warning"}`}>
                      {item.risk_level}
                    </span>
                  </td>
                  <td style={{ maxWidth: 0, overflow: "hidden" }}>
                    <span className="text-truncate" title={item.requester_name}>{item.requester_name}</span>
                  </td>
                  <td className="align-right">
                    {item.status === "PENDING" ? (
                      <div className="table-action-btns">
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
                      </div>
                    ) : (
                      <span className="caption-text font-bold green-text">Processed</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default ApprovalTable;
