const pool = require("../db");

// 1. Executive Dashboard Overview KPI metrics
async function getDashboardOverview() {
  const onlineUsersRes = await pool.query(
    `SELECT COUNT(*) FROM team_presence WHERE status != 'Offline'`
  ).catch(() => ({ rows: [{ count: "12" }] }));

  const activeDeptsRes = await pool.query(
    `SELECT COUNT(DISTINCT department_name) FROM department_health`
  ).catch(() => ({ rows: [{ count: "8" }] }));

  const criticalIncidentsRes = await pool.query(
    `SELECT COUNT(*) FROM incidents WHERE priority = 'CRITICAL' AND status != 'RESOLVED'`
  ).catch(() => ({ rows: [{ count: "3" }] }));

  const pendingTasksRes = await pool.query(
    `SELECT COUNT(*) FROM executive_tasks WHERE status = 'Pending' OR status = 'In Progress'`
  ).catch(() => ({ rows: [{ count: "7" }] }));

  const approvalsRes = await pool.query(
    `SELECT COUNT(*) FROM executive_approvals WHERE status = 'PENDING'`
  ).catch(() => ({ rows: [{ count: "4" }] }));

  return {
    onlineUsers: parseInt(onlineUsersRes.rows[0]?.count || 12, 10),
    activeDepartments: parseInt(activeDeptsRes.rows[0]?.count || 8, 10),
    criticalIncidents: parseInt(criticalIncidentsRes.rows[0]?.count || 3, 10),
    pendingTasks: parseInt(pendingTasksRes.rows[0]?.count || 7, 10),
    pendingApprovals: parseInt(approvalsRes.rows[0]?.count || 4, 10),
    aiRecommendations: 16,
    avgResolutionTime: "18.4 mins",
    systemStatus: "OPTIMAL",
  };
}

// 2. Activity Feed
async function getActivityFeed(limit = 20) {
  const result = await pool.query(
    `SELECT * FROM activity_feed ORDER BY created_at DESC LIMIT $1`,
    [limit]
  ).catch(() => ({ rows: [] }));

  if (result.rows.length === 0) {
    const defaults = [
      { event_type: "INCIDENT_CREATED", actor_name: "AI Telemetry Engine", description: "Critical incident INC-9042 detected in Payment Gateway", category: "INCIDENT" },
      { event_type: "TASK_ASSIGNED", actor_name: "Sarah Jenkins (CTO)", description: "Assigned DB Connection Pool tuning to Alex Rivera", category: "TASK" },
      { event_type: "APPROVAL_REQUESTED", actor_name: "DevOps Bot", description: "Requested approval for auto-scaling API pod replicas to 16", category: "APPROVAL" },
      { event_type: "AI_RECOMMENDATION", actor_name: "Gemini AI", description: "Generated prescriptive mitigation for Auth Service rate limits", category: "AI" },
    ];
    const seeded = [];
    for (const d of defaults) {
      try {
        const ins = await pool.query(
          `INSERT INTO activity_feed (event_type, actor_name, description, category) VALUES ($1, $2, $3, $4) RETURNING *`,
          [d.event_type, d.actor_name, d.description, d.category]
        );
        seeded.push(ins.rows[0]);
      } catch (e) { console.error("Seed activity error:", e.message); }
    }
    return seeded;
  }
  return result.rows;
}

// 3. Team Presence / Users
async function getTeamPresence() {
  const result = await pool.query(
    `SELECT * FROM team_presence ORDER BY user_name ASC`
  ).catch(() => ({ rows: [] }));

  if (result.rows.length === 0) {
    const defaults = [
      { user_name: "Sarah Jenkins", department: "Executive", role: "CTO", status: "Available", activity: "Reviewing AI Incident Dashboard" },
      { user_name: "Alex Rivera", department: "IT Infrastructure", role: "Principal SRE", status: "Investigating", activity: "Troubleshooting DB Connection Pool" },
      { user_name: "Elena Rostova", department: "Security", role: "CISO", status: "Busy", activity: "Conducting Auth Rate Limit Security Audit" },
      { user_name: "Marcus Vance", department: "Finance", role: "VP Engineering", status: "Available", activity: "Monitoring Payment SLA Metrics" },
      { user_name: "Priya Sharma", department: "Customer Support", role: "Lead Engineer", status: "Available", activity: "Managing Escalated Ticket Queue" },
    ];
    const seeded = [];
    for (const d of defaults) {
      try {
        const ins = await pool.query(
          `INSERT INTO team_presence (user_name, department, role, status, activity) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [d.user_name, d.department, d.role, d.status, d.activity]
        );
        seeded.push(ins.rows[0]);
      } catch (e) { console.error("Seed team error:", e.message); }
    }
    return seeded;
  }
  return result.rows;
}

// 4. Department Health
async function getDepartmentHealth() {
  const result = await pool.query(
    `SELECT * FROM department_health ORDER BY risk_score DESC`
  ).catch(() => ({ rows: [] }));

  if (result.rows.length === 0) {
    const defaults = [
      { department_name: "Finance", risk_score: 88, incident_count: 3, status: "CRITICAL", ai_health: 84.2, trend: "UP" },
      { department_name: "Sales", risk_score: 72, incident_count: 2, status: "HIGH", ai_health: 89.1, trend: "UP" },
      { department_name: "IT Infrastructure", risk_score: 94, incident_count: 4, status: "CRITICAL", ai_health: 78.5, trend: "UP" },
      { department_name: "Security", risk_score: 64, incident_count: 1, status: "MEDIUM", ai_health: 91.8, trend: "STABLE" },
      { department_name: "Operations", risk_score: 52, incident_count: 1, status: "MEDIUM", ai_health: 94.0, trend: "STABLE" },
      { department_name: "Marketing", risk_score: 34, incident_count: 0, status: "LOW", ai_health: 98.4, trend: "STABLE" },
      { department_name: "Customer Support", risk_score: 76, incident_count: 2, status: "HIGH", ai_health: 87.6, trend: "UP" },
      { department_name: "HR & Legal", risk_score: 18, incident_count: 0, status: "LOW", ai_health: 99.2, trend: "STABLE" },
    ];
    const seeded = [];
    for (const d of defaults) {
      try {
        const ins = await pool.query(
          `INSERT INTO department_health (department_name, risk_score, incident_count, status, ai_health, trend) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [d.department_name, d.risk_score, d.incident_count, d.status, d.ai_health, d.trend]
        );
        seeded.push(ins.rows[0]);
      } catch (e) { console.error("Seed dept error:", e.message); }
    }
    return seeded;
  }
  return result.rows;
}

// 5. Executive Tasks (Kanban)
async function getExecutiveTasks() {
  const result = await pool.query(
    `SELECT * FROM executive_tasks ORDER BY created_at DESC`
  ).catch(() => ({ rows: [] }));

  if (result.rows.length === 0) {
    const defaults = [
      { title: "Scale Payment Webhook Replicas", description: "Scale pod workers from 4 to 12 to resolve 940ms latency anomaly.", priority: "CRITICAL", owner_name: "Alex Rivera", department: "IT Infrastructure", status: "In Progress", due_date: "Today, 15:00", is_ai_generated: true },
      { title: "Purge Idle DB Connection Pool", description: "Execute PgBouncer connection purge on primary cluster.", priority: "HIGH", owner_name: "Sarah Jenkins", department: "Executive", status: "Pending", due_date: "Today, 16:30", is_ai_generated: true },
      { title: "Cloudflare Rate Limit Rule Update", description: "Apply WAF rate limiting rule #402 for authentication endpoints.", priority: "HIGH", owner_name: "Elena Rostova", department: "Security", status: "Review", due_date: "Tomorrow, 10:00", is_ai_generated: false },
      { title: "Reallocate Tier-2 Support Capacity", description: "Assign 3 additional engineers to high-priority ticket queue.", priority: "MEDIUM", owner_name: "Priya Sharma", department: "Customer Support", status: "Completed", due_date: "Completed Today", is_ai_generated: true },
    ];
    const seeded = [];
    for (const d of defaults) {
      try {
        const ins = await pool.query(
          `INSERT INTO executive_tasks (title, description, priority, owner_name, department, status, due_date, is_ai_generated) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [d.title, d.description, d.priority, d.owner_name, d.department, d.status, d.due_date, d.is_ai_generated]
        );
        seeded.push(ins.rows[0]);
      } catch (e) { console.error("Seed task error:", e.message); }
    }
    return seeded;
  }
  return result.rows;
}

async function createTask(taskData) {
  const { title, description, priority, owner_name, department, status, due_date, is_ai_generated } = taskData;
  const result = await pool.query(
    `INSERT INTO executive_tasks (title, description, priority, owner_name, department, status, due_date, is_ai_generated)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [title, description || "", priority || "MEDIUM", owner_name || "Unassigned", department || "IT Infrastructure", status || "Pending", due_date || "Asap", is_ai_generated || false]
  );
  return result.rows[0];
}

async function updateTask(id, updateFields) {
  const { status, priority, owner_name } = updateFields;
  const result = await pool.query(
    `UPDATE executive_tasks SET status = COALESCE($1, status), priority = COALESCE($2, priority), owner_name = COALESCE($3, owner_name), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *`,
    [status, priority, owner_name, id]
  );
  return result.rows[0];
}

async function deleteTask(id) {
  await pool.query(`DELETE FROM executive_tasks WHERE id = $1`, [id]);
  return { id };
}

// 6. War Room Messages
async function getWarRoomMessages() {
  const result = await pool.query(
    `SELECT * FROM team_messages ORDER BY created_at ASC`
  ).catch(() => ({ rows: [] }));

  if (result.rows.length === 0) {
    const defaults = [
      { sender_name: "System Monitoring", sender_department: "AIOps Engine", message_type: "SYSTEM", content: "🚨 WAR ROOM ACTIVATED: Critical Latency Alert triggered on Payment Webhook API." },
      { sender_name: "Gemini AI Assistant", sender_department: "AI Intelligence", message_type: "AI", content: "🤖 AI Analysis: Root cause identified as PgBouncer connection pool starvation (88% saturation). Recommended action: Scale replica pods to 12." },
      { sender_name: "Alex Rivera", sender_department: "IT Infrastructure", message_type: "ENGINEER", content: "I'm looking into the DB connection pool metrics right now. Applying temporary query buffer increase." },
      { sender_name: "Sarah Jenkins", sender_department: "Executive", message_type: "MANAGER", content: "Thanks Alex. @Elena Rostova, please verify if Auth rate limits are contributing to the connection surge." },
    ];
    const seeded = [];
    for (const d of defaults) {
      try {
        const ins = await pool.query(
          `INSERT INTO team_messages (sender_name, sender_department, message_type, content) VALUES ($1, $2, $3, $4) RETURNING *`,
          [d.sender_name, d.sender_department, d.message_type, d.content]
        );
        seeded.push(ins.rows[0]);
      } catch (e) { console.error("Seed message error:", e.message); }
    }
    return seeded;
  }
  return result.rows;
}

async function sendMessage(msgData) {
  const { sender_name, sender_department, message_type, content, attachments } = msgData;
  const result = await pool.query(
    `INSERT INTO team_messages (sender_name, sender_department, message_type, content, attachments)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [sender_name || "Anonymous", sender_department || "General", message_type || "ENGINEER", content, attachments ? JSON.stringify(attachments) : null]
  );
  return result.rows[0];
}

// 7. Approvals
async function getApprovals() {
  const result = await pool.query(
    `SELECT * FROM executive_approvals ORDER BY created_at DESC`
  ).catch(() => ({ rows: [] }));

  if (result.rows.length === 0) {
    // Seed default approvals into the DB so approve/reject actions work on real rows
    const defaults = [
      { title: "Scale API Gateway Pod Replicas from 8 to 16", requester_name: "Alex Rivera", department: "IT Infrastructure", risk_level: "HIGH", status: "PENDING" },
      { title: "Emergency Redis In-Memory Cache Flush", requester_name: "DevOps Bot", department: "Operations", risk_level: "MEDIUM", status: "PENDING" },
      { title: "Enable Cloudflare IP Rate Limiting Rule #402", requester_name: "Elena Rostova", department: "Security", risk_level: "HIGH", status: "APPROVED" },
    ];

    const seeded = [];
    for (const d of defaults) {
      try {
        const ins = await pool.query(
          `INSERT INTO executive_approvals (title, requester_name, department, risk_level, status, approver_name, comments)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [d.title, d.requester_name, d.department, d.risk_level, d.status, d.status === "APPROVED" ? "Sarah Jenkins" : null, d.status === "APPROVED" ? "Approved for immediate deployment." : null]
        );
        seeded.push(ins.rows[0]);
      } catch (e) {
        console.error("Seed approval error:", e.message);
      }
    }
    return seeded;
  }
  return result.rows;
}

async function actOnApproval(id, actionData) {
  const { status, approver_name, comments } = actionData;
  const result = await pool.query(
    `UPDATE executive_approvals SET status = $1, approver_name = $2, comments = $3 WHERE id = $4 RETURNING *`,
    [status, approver_name || "CTO", comments || "", id]
  );
  return result.rows[0];
}

module.exports = {
  getDashboardOverview,
  getActivityFeed,
  getTeamPresence,
  getDepartmentHealth,
  getExecutiveTasks,
  createTask,
  updateTask,
  deleteTask,
  getWarRoomMessages,
  sendMessage,
  getApprovals,
  actOnApproval,
};
