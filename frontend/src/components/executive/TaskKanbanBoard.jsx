import React, { memo } from "react";

const TaskKanbanBoard = memo(function TaskKanbanBoard({ tasks = [], onTaskMove, onOpenTaskDetail }) {
  const defaultTasks = [
    { id: 1, title: "Scale Payment Webhook Replicas", description: "Scale pod workers from 4 to 12 to resolve 940ms latency anomaly.", priority: "CRITICAL", owner_name: "Alex Rivera", department: "IT Infrastructure", status: "In Progress", due_date: "15:00 EST", is_ai_generated: true },
    { id: 2, title: "Purge Idle DB Connection Pool", description: "Execute PgBouncer connection purge on primary cluster.", priority: "HIGH", owner_name: "Sarah Jenkins", department: "Executive", status: "Pending", due_date: "16:30 EST", is_ai_generated: true },
    { id: 3, title: "Cloudflare Rate Limit Rule Update", description: "Apply WAF rate limiting rule #402 for authentication endpoints.", priority: "HIGH", owner_name: "Elena Rostova", department: "Security", status: "Review", due_date: "10:00 EST", is_ai_generated: false },
    { id: 4, title: "Reallocate Tier-2 Support Capacity", description: "Assign 3 additional engineers to high-priority ticket queue.", priority: "MEDIUM", owner_name: "Priya Sharma", department: "Customer Support", status: "Completed", due_date: "Done Today", is_ai_generated: true },
    { id: 5, title: "Configure Redis Cluster Replica Node", description: "Add secondary read replica to distribute caching load.", priority: "MEDIUM", owner_name: "DevOps Bot", department: "Operations", status: "Assigned", due_date: "17:00 EST", is_ai_generated: false },
  ];

  const taskList = tasks.length > 0 ? tasks : defaultTasks;
  const columns = ["Pending", "Assigned", "In Progress", "Review", "Completed"];

  return (
    <div className="section-card task-kanban-panel">
      <div className="section-card-header">
        <h2 className="section-title">Response Tasks</h2>
        <span className="caption-text">Workflow State Machine Engine</span>
      </div>

      <div className="kanban-grid-5-col">
        {columns.map((col) => {
          const colTasks = taskList.filter((t) => (t.status || "Pending") === col);
          return (
            <div key={col} className="kanban-column">
              <div className="kanban-column-header">
                <span className="column-title">{col}</span>
                <span className="col-count-badge">{colTasks.length}</span>
              </div>

              <div className="kanban-cards-stack">
                {colTasks.map((t) => {
                  const prioLower = (t.priority || "HIGH").toLowerCase();
                  return (
                    <div
                      key={t.id}
                      className="kanban-task-card clickable-card"
                      onClick={() => onOpenTaskDetail && onOpenTaskDetail(t)}
                    >
                      <div className="task-card-top-row">
                        <span className={`badge badge-${prioLower === "critical" ? "danger" : prioLower === "high" ? "warning" : "primary"}`}>
                          {t.priority}
                        </span>
                        <span className="caption-text">{t.due_date}</span>
                      </div>

                      <h4 className="task-card-name">{t.title}</h4>

                      <div className="task-card-meta">
                        <span className="caption-text">Owner: {t.owner_name}</span>
                      </div>

                      {/* State-Machine Workflow Action Buttons */}
                      <div className="task-card-action-row" onClick={(e) => e.stopPropagation()}>
                        {t.status === "Pending" && (
                          <button
                            className="primary-button small-btn"
                            onClick={() => onTaskMove && onTaskMove(t.id, "Assigned")}
                          >
                            Assign
                          </button>
                        )}

                        {t.status === "Assigned" && (
                          <button
                            className="primary-button small-btn"
                            onClick={() => onTaskMove && onTaskMove(t.id, "In Progress")}
                          >
                            Start Work
                          </button>
                        )}

                        {t.status === "In Progress" && (
                          <button
                            className="primary-button small-btn"
                            onClick={() => onTaskMove && onTaskMove(t.id, "Review")}
                          >
                            Mark Ready For Review
                          </button>
                        )}

                        {t.status === "Review" && (
                          <div className="btn-group-sm">
                            <button
                              className="danger-button small-btn"
                              onClick={() => onTaskMove && onTaskMove(t.id, "In Progress")}
                            >
                              Request Changes
                            </button>
                            <button
                              className="primary-button small-btn"
                              onClick={() => onTaskMove && onTaskMove(t.id, "Completed")}
                            >
                              Approve
                            </button>
                          </div>
                        )}

                        {t.status === "Completed" && (
                          <span className="caption-text font-bold green-text">Archived</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default TaskKanbanBoard;
