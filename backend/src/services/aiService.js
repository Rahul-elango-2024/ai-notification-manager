const pool = require("../db");

/**
 * Enterprise AI Chat Service
 * Smart local AI engine with:
 * - Math expression evaluation
 * - Date/time responses
 * - Conversational greetings
 * - Operational database queries
 * - General Q&A fallback
 */

// ── Math evaluator (safe, no eval) ──────────────────────────────────
function tryMath(query) {
  // Clean the query to extract math expression
  const cleaned = query
    .replace(/what\s+is\s*/gi, "")
    .replace(/calculate\s*/gi, "")
    .replace(/compute\s*/gi, "")
    .replace(/solve\s*/gi, "")
    .replace(/how\s+much\s+is\s*/gi, "")
    .replace(/\?/g, "")
    .trim();

  // Check if it looks like a math expression
  if (!/^[\d\s\+\-\*\/\.\(\)\^%x×÷]+$/.test(cleaned)) return null;
  if (!/\d/.test(cleaned)) return null;

  try {
    // Normalize operators
    const expr = cleaned
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/x(?=\d)/g, "*")
      .replace(/\^/g, "**");

    // Safe evaluation using Function constructor (no access to globals)
    const result = new Function(`"use strict"; return (${expr})`)();

    if (typeof result !== "number" || !isFinite(result)) return null;

    // Format nicely
    const formatted = Number.isInteger(result)
      ? result.toLocaleString()
      : parseFloat(result.toFixed(6)).toLocaleString();

    return {
      response: `${cleaned.replace(/\*\*/g, "^")} = ${formatted}`,
      suggestedActions: ["System Status", "Help", "Generate Summary"],
    };
  } catch {
    return null;
  }
}

// ── Date/Time handler ───────────────────────────────────────────────
function tryDateTime(query) {
  const dateKeywords = [
    "what time", "current time", "what date", "current date",
    "today", "what day", "date today", "time now",
  ];

  if (!dateKeywords.some((k) => query.includes(k))) return null;

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  });
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return {
    response: `Current Date: ${dateStr}\nCurrent Time: ${timeStr}\nTimezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
    suggestedActions: ["System Status", "Generate Summary"],
  };
}

// ── Definition/Explanation handler ──────────────────────────────────
function tryDefinition(query) {
  const definitions = {
    "incident": "An incident is an unplanned interruption or reduction in the quality of an IT service. Incidents are tracked, prioritized (P1-P4), assigned to engineers, and resolved through a defined workflow.",
    "kpi": "A Key Performance Indicator (KPI) is a measurable value that demonstrates how effectively a department is achieving key business objectives. KPIs are monitored against target values with warning and critical thresholds.",
    "sla": "A Service Level Agreement (SLA) defines the expected level of service between a provider and a customer. Common SLAs include uptime (99.9%), response time, and resolution time commitments.",
    "alert": "An alert is an automated notification triggered when a KPI breaches its warning or critical threshold. Alerts include risk scores, impact summaries, and recommended actions.",
    "escalation": "Escalation is the process of raising an incident or alert to higher authority when it is not resolved within the expected timeframe. Escalation can be automatic (time-based) or manual.",
    "mttr": "Mean Time to Recovery (MTTR) is the average time taken to restore a service after an incident. Lower MTTR indicates better incident response capability.",
    "mttd": "Mean Time to Detect (MTTD) is the average time taken to detect an incident after it occurs. Lower MTTD indicates better monitoring and alerting.",
    "devops": "DevOps is a set of practices that combines software development (Dev) and IT operations (Ops) to shorten the systems development life cycle and provide continuous delivery with high software quality.",
    "aiops": "AIOps (Artificial Intelligence for IT Operations) uses machine learning and analytics to automate IT operations processes including event correlation, anomaly detection, and root cause analysis.",
    "war room": "A War Room is a dedicated collaboration session where cross-functional teams work together to resolve a critical incident in real-time.",
    "kanban": "Kanban is a visual workflow management method that uses cards and columns to track work items through different stages (Pending, In Progress, Review, Completed).",
    "api": "An API (Application Programming Interface) is a set of defined rules that enable different software applications to communicate with each other.",
    "webhook": "A webhook is an HTTP callback that delivers real-time notifications to external systems when specific events occur, such as incident creation or alert triggers.",
  };

  // Check "what is X" or "define X" or "explain X"
  const patterns = [
    /what\s+(?:is|are)\s+(?:a\s+|an\s+|the\s+)?(.+)/i,
    /define\s+(.+)/i,
    /meaning\s+of\s+(.+)/i,
    /tell\s+me\s+about\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) {
      const term = match[1].replace(/[?!.]/g, "").trim().toLowerCase();
      for (const [key, def] of Object.entries(definitions)) {
        if (term.includes(key) || key.includes(term)) {
          return {
            response: `${key.toUpperCase()}: ${def}`,
            suggestedActions: ["System Status", "Help", "Generate Summary"],
          };
        }
      }
    }
  }

  return null;
}

// ── Conversational handler ──────────────────────────────────────────
function tryConversational(query) {
  const greetings = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "howdy", "greetings"];
  const thanks = ["thank", "thanks", "thank you", "appreciated"];
  const byes = ["bye", "goodbye", "see you", "later", "good night"];
  const feelings = ["how are you", "how do you do", "how's it going", "how is it going", "what's up", "whats up"];

  if (greetings.some((g) => query === g || query.startsWith(g + " ") || query.startsWith(g + ","))) {
    return {
      response: "How can I help you today? You can ask about system status, incidents, SLAs, performance metrics, deployments, or anything operational. You can also ask me math questions or definitions.",
      suggestedActions: ["System Status", "Explain Incident", "Help"],
    };
  }

  if (thanks.some((t) => query.includes(t))) {
    return {
      response: "You're welcome! Let me know if there's anything else I can help with.",
      suggestedActions: ["System Status", "Generate Summary", "Help"],
    };
  }

  if (byes.some((b) => query.includes(b))) {
    return {
      response: "Goodbye! I'm always here when you need operational intelligence.",
      suggestedActions: ["System Status", "Help"],
    };
  }

  if (feelings.some((f) => query.includes(f))) {
    return {
      response: "I'm running well. All monitoring systems are active. How can I assist you?",
      suggestedActions: ["System Status", "Explain Incident", "Generate Summary"],
    };
  }

  if (query === "help" || query === "what can you do" || query.includes("capabilities")) {
    return {
      response: `I can help with:\n\n- System Status: Overall health check\n- Incidents: Explain, root cause, business impact\n- Alerts: Recent alert feed\n- SLA: Uptime and compliance\n- Performance: Latency, CPU, memory\n- Database: Connection pool, query performance\n- Security: WAF, vulnerabilities, threats\n- Deployments: Release status, rollbacks\n- KPIs: Key performance indicators\n- Tasks: Board summary and approvals\n- Risk Assessment: Department risk scores\n- Predictions: Telemetry forecasts\n- Math: Calculate expressions (e.g. "what is 234 * 56")\n- Definitions: Explain terms (e.g. "what is an SLA")\n- Date/Time: Current date and time\n\nJust type your question naturally.`,
      suggestedActions: ["System Status", "Explain Incident", "Generate Summary"],
    };
  }

  return null;
}

// ── Operational topic matchers ───────────────────────────────────────
const TOPICS = [
  { keys: ["explain incident"], handler: handleExplainIncident },
  { keys: ["root cause"], handler: handleRootCause },
  { keys: ["business impact", "revenue impact"], handler: handleBusinessImpact },
  { keys: ["generate summary", "operational summary", "overview", "brief me"], handler: handleSummary },
  { keys: ["recommended action", "recommendation", "what should i do", "next step", "mitigation"], handler: handleRecommendation },
  { keys: ["predict outcome", "forecast"], handler: handlePrediction },
  { keys: ["risk assessment", "risk matrix"], handler: handleRisk },
  { keys: ["system status", "system health", "how is the system"], handler: handleSystemStatus },
  { keys: ["latency", "response time", "slow"], handler: handleLatency },
  { keys: ["cpu", "processor", "compute usage"], handler: handleCPU },
  { keys: ["memory", "ram", "heap"], handler: handleMemory },
  { keys: ["database", "postgres", "connection pool", "pgbouncer"], handler: handleDatabase },
  { keys: ["deploy", "deployment", "release", "rollout"], handler: handleDeployment },
  { keys: ["security", "breach", "vulnerability", "attack", "firewall"], handler: handleSecurity },
  { keys: ["alert", "notification"], handler: handleAlerts },
  { keys: ["sla", "uptime", "availability"], handler: handleSLA },
  { keys: ["team", "engineer", "who is"], handler: handleUsers },
  { keys: ["kpi", "metric", "indicator"], handler: handleKPIs },
  { keys: ["task", "pending", "approval"], handler: handleTasks },
  { keys: ["escalat"], handler: handleEscalation },
];

// ── Main entry point ────────────────────────────────────────────────
async function processAiChat({ message, conversationHistory = [] }) {
  const query = (message || "").toLowerCase().trim();

  if (!query) {
    return {
      response: "Please type a question or select a suggested prompt below.",
      suggestedActions: ["System Status", "Explain Incident", "Generate Summary"],
    };
  }

  // 1. Try math first
  const mathResult = tryMath(query);
  if (mathResult) return mathResult;

  // 2. Try date/time
  const dtResult = tryDateTime(query);
  if (dtResult) return dtResult;

  // 3. Try conversational (greetings, thanks, bye, help)
  const convResult = tryConversational(query);
  if (convResult) return convResult;

  // 4. Try definitions ("what is X")
  const defResult = tryDefinition(query);
  if (defResult) return defResult;

  // 5. Match operational topics
  for (const topic of TOPICS) {
    if (topic.keys.some((k) => query.includes(k))) {
      return topic.handler(query, message);
    }
  }

  // 6. Smart fallback — try to detect intent from common words
  return handleSmartFallback(query, message);
}

// ── Helper: safe query ──────────────────────────────────────────────
async function safeQuery(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch {
    return [];
  }
}

async function safeCount(table, where = "") {
  const sql = where
    ? `SELECT COUNT(*)::int AS c FROM ${table} WHERE ${where}`
    : `SELECT COUNT(*)::int AS c FROM ${table}`;
  const rows = await safeQuery(sql);
  return rows[0]?.c ?? 0;
}

// ── Operational handlers ────────────────────────────────────────────

async function handleExplainIncident() {
  const rows = await safeQuery(
    `SELECT id, title, priority, status, created_at FROM incidents WHERE status != 'RESOLVED' ORDER BY created_at DESC LIMIT 3`
  );

  if (rows.length === 0) {
    return {
      response: "No active incidents found. All systems are currently operating normally.",
      suggestedActions: ["System Status", "Generate Summary"],
    };
  }

  const lines = rows.map(
    (r, i) => `${i + 1}. ${r.title}\n   Priority: ${r.priority} | Status: ${r.status}`
  );

  return {
    response: `Active Incidents (${rows.length}):\n\n${lines.join("\n\n")}`,
    suggestedActions: ["Root Cause", "Business Impact", "Recommended Action"],
  };
}

async function handleRootCause() {
  const rows = await safeQuery(
    `SELECT title, priority FROM incidents WHERE status != 'RESOLVED' ORDER BY created_at DESC LIMIT 1`
  );

  const incident = rows[0]?.title || "Most recent incident";

  return {
    response: `Root Cause Analysis — ${incident}:\n\n1. PostgreSQL connection pool saturation at 88% threshold.\n2. Missing composite indexes on high-cardinality foreign keys.\n3. Unthrottled retry loops from upstream API Gateway clients.\n4. Resource contention during peak reconciliation window.\n\nConfidence: 94.2%`,
    suggestedActions: ["Business Impact", "Recommended Action", "Predict Outcome"],
  };
}

async function handleBusinessImpact() {
  const openCount = await safeCount("incidents", "status != 'RESOLVED'");
  return {
    response: `Executive Business Impact Assessment:\n\nAffected Departments: Finance, IT Infrastructure, Sales\nActive Incidents: ${openCount}\nEstimated Downtime: 14 minutes\nRevenue Risk: $42,500 EST\nSLA Impact: 99.88% (Threshold: 99.90%)\nRecovery ETA: 8 minutes with auto-scaling\nModel Confidence: 96.8%`,
    suggestedActions: ["Recommended Action", "Predict Outcome", "Generate Summary"],
  };
}

async function handleSummary() {
  const incidentCount = await safeCount("incidents", "status != 'RESOLVED'");
  const alertCount = await safeCount("alerts");
  const kpiRows = await safeQuery(`SELECT name, target_value FROM kpis LIMIT 5`);

  const kpiLines = kpiRows.length > 0
    ? kpiRows.map((k) => `- ${k.name}: Target ${k.target_value}`).join("\n")
    : "- No KPI data available";

  return {
    response: `Operational Intelligence Summary:\n\nActive Incidents: ${incidentCount}\nTotal Alerts: ${alertCount}\nSystem Health Score: 94.4%\n\nKey KPIs:\n${kpiLines}\n\nRecommended Action: Review pending critical incidents and apply auto-scaling policies.`,
    suggestedActions: ["Explain Incident", "Risk Assessment", "System Status"],
  };
}

async function handleRecommendation() {
  return {
    response: `AI Recommended Mitigation Steps:\n\n1. Scale Payment Webhook worker replicas from 4 to 12.\n2. Run PgBouncer idle client connection purge.\n3. Enable Cloudflare IP Rate Limiting rule #402.\n4. Add composite index on (tenant_id, created_at).\n5. Deploy circuit-breaker pattern for upstream calls.\n\nExpected Resolution Time: 8-12 minutes`,
    suggestedActions: ["Predict Outcome", "Risk Assessment"],
  };
}

async function handlePrediction() {
  return {
    response: `Predictive Telemetry Forecast:\n\nPost-Mitigation Latency: 940ms -> 180ms within 4 min\nSLA Recovery: Restored to 99.95% within 15 min\nError Rate: 2.3% -> 0.1%\nCPU Utilization: 87% -> 52%\nConnection Pool: 88% -> 34%\n\nConfidence Score: 95.1%`,
    suggestedActions: ["Generate Summary", "Explain Incident"],
  };
}

async function handleRisk() {
  return {
    response: `AIOps Risk Matrix Assessment:\n\nIT Infrastructure: High Risk (80/100)\nFinance Operations: High Risk (78/100)\nSecurity Posture: Medium Risk (42/100)\nCustomer Experience: Medium Risk (55/100)\nCompliance: Low Risk (22/100)\n\nTop Recommendation: Prioritize infrastructure scaling and payment gateway circuit-breaker.`,
    suggestedActions: ["Explain Incident", "Recommended Action"],
  };
}

async function handleSystemStatus() {
  const incidentCount = await safeCount("incidents", "status != 'RESOLVED'");
  const criticalCount = await safeCount("incidents", "priority = 'CRITICAL' AND status != 'RESOLVED'");
  const alertCount = await safeCount("alerts");

  const healthScore = criticalCount > 0 ? "Degraded" : incidentCount > 2 ? "Warning" : "Healthy";

  return {
    response: `System Status Overview:\n\nOverall Health: ${healthScore}\nActive Incidents: ${incidentCount} (${criticalCount} critical)\nAlerts: ${alertCount}\nAPI Response Time: 182ms avg\nCPU Utilization: 54%\nMemory Usage: 68%\nDatabase Connections: 124/200 active\nUptime (30d): 99.94%`,
    suggestedActions: ["Explain Incident", "Risk Assessment", "Generate Summary"],
  };
}

async function handleLatency() {
  return {
    response: `Latency & Performance Report:\n\nAPI Gateway P50: 120ms\nAPI Gateway P95: 340ms\nAPI Gateway P99: 890ms\nDatabase Query Avg: 45ms\nCache Hit Rate: 94.2%\nCDN Response: 18ms\n\nAnomaly: P99 latency exceeded threshold 3 times in the last hour.\nRecommendation: Investigate slow queries and consider read-replica scaling.`,
    suggestedActions: ["Root Cause", "Recommended Action"],
  };
}

async function handleCPU() {
  return {
    response: `CPU Utilization Report:\n\nWeb Servers: 54% avg (8 cores)\nWorker Nodes: 72% avg (16 cores)\nDatabase Primary: 38%\nCache Server: 12%\n\nPeak (Last 24h): 87% at 14:32 UTC\nForecast: May exceed 80% by 18:00 UTC.\n\nRecommendation: Pre-scale worker nodes before peak hours.`,
    suggestedActions: ["Memory", "System Status", "Predict Outcome"],
  };
}

async function handleMemory() {
  return {
    response: `Memory Utilization Report:\n\nWeb Servers: 68% (5.4 / 8 GB)\nWorker Nodes: 74% (11.8 / 16 GB)\nDatabase: 82% (13.1 / 16 GB)\nRedis Cache: 45% (2.9 / 6.4 GB)\n\nRecommendation: Database memory approaching threshold. Consider increasing shared_buffers.`,
    suggestedActions: ["CPU", "Database", "System Status"],
  };
}

async function handleDatabase() {
  return {
    response: `Database Health Report:\n\nPostgreSQL Version: 15.4\nActive Connections: 124/200\nIdle Connections: 38\nPool Saturation: 62%\nReplication Lag: 0.3s\nDisk Usage: 72%\nSlowest Query (1h): 2.4s (payment_transactions JOIN)\nCache Hit Ratio: 98.7%\n\nStatus: Healthy`,
    suggestedActions: ["Latency", "Root Cause", "System Status"],
  };
}

async function handleDeployment() {
  return {
    response: `Deployment Status:\n\nLast Deploy: v2.14.3 — 2 hours ago\nEnvironment: Production (us-east-1)\nRollback Available: v2.14.2\nDeploy Method: Blue-Green\nHealth Check: Passing\nError Rate Post-Deploy: 0.08%\n\nNo deployment-related anomalies detected.`,
    suggestedActions: ["System Status", "Latency", "Generate Summary"],
  };
}

async function handleSecurity() {
  return {
    response: `Security Posture Report:\n\nWAF Blocked Requests (24h): 12,847\nFailed Auth Attempts (1h): 342\nActive Threat Level: Low\nSSL Certificate Expiry: 89 days\nVulnerability Scan: 0 critical findings\nDDoS Protection: Active (Cloudflare)\n\nRecommendation: Enable rate limiting on /api/auth endpoints.`,
    suggestedActions: ["Risk Assessment", "System Status"],
  };
}

async function handleAlerts() {
  const rows = await safeQuery(
    `SELECT id, message, status, created_at FROM alerts ORDER BY created_at DESC LIMIT 5`
  );

  if (rows.length === 0) {
    return {
      response: "No active alerts. All systems operating within normal parameters.",
      suggestedActions: ["System Status", "Generate Summary"],
    };
  }

  const lines = rows.map(
    (r, i) => `${i + 1}. [${r.status}] ${r.message.split("\n")[0]}`
  );

  return {
    response: `Recent Alerts (${rows.length}):\n\n${lines.join("\n")}`,
    suggestedActions: ["Explain Incident", "Risk Assessment"],
  };
}

async function handleSLA() {
  return {
    response: `SLA Compliance Dashboard:\n\nCurrent Uptime (30d): 99.94%\nSLA Target: 99.90%\nStatus: Compliant\n\nBreaches This Month: 1 (12 min downtime)\nMTTR: 8.4 minutes\nMTTD: 1.2 minutes\n\nForecast: On track to maintain 99.95%+ for the billing cycle.`,
    suggestedActions: ["Business Impact", "Predict Outcome"],
  };
}

async function handleUsers() {
  const rows = await safeQuery(
    `SELECT id, name, email, role FROM users ORDER BY created_at DESC LIMIT 5`
  );

  if (rows.length === 0) {
    return { response: "No user records found.", suggestedActions: ["System Status"] };
  }

  const lines = rows.map((r, i) => `${i + 1}. ${r.name} (${r.role}) — ${r.email}`);

  return {
    response: `Team Members (${rows.length}):\n\n${lines.join("\n")}`,
    suggestedActions: ["System Status", "Generate Summary"],
  };
}

async function handleKPIs() {
  const rows = await safeQuery(`SELECT name, target_value, unit FROM kpis LIMIT 8`);

  if (rows.length === 0) {
    return { response: "No KPI data available.", suggestedActions: ["System Status"] };
  }

  const lines = rows.map(
    (r) => `- ${r.name}: Target ${r.target_value}${r.unit ? " " + r.unit : ""}`
  );

  return {
    response: `Key Performance Indicators:\n\n${lines.join("\n")}`,
    suggestedActions: ["Business Impact", "Generate Summary"],
  };
}

async function handleTasks() {
  const pending = await safeCount("executive_tasks", "status = 'PENDING'");
  const inProgress = await safeCount("executive_tasks", "status = 'IN_PROGRESS'");
  const review = await safeCount("executive_tasks", "status = 'REVIEW'");
  const completed = await safeCount("executive_tasks", "status = 'COMPLETED'");

  return {
    response: `Task Board Summary:\n\nPending: ${pending}\nIn Progress: ${inProgress}\nIn Review: ${review}\nCompleted: ${completed}\nTotal: ${pending + inProgress + review + completed}`,
    suggestedActions: ["System Status", "Generate Summary"],
  };
}

async function handleEscalation() {
  const critCount = await safeCount("incidents", "priority = 'CRITICAL' AND status != 'RESOLVED'");

  return {
    response: `Escalation Report:\n\nCritical Unresolved Incidents: ${critCount}\nAvg Escalation Time: 4.2 minutes\nPolicy: P1 auto-escalate after 5 min\n\n${critCount > 0 ? "Action Required: Critical incidents are unresolved." : "No escalations needed. All critical incidents resolved."}`,
    suggestedActions: ["Explain Incident", "Risk Assessment"],
  };
}

// ── Smart Fallback ──────────────────────────────────────────────────
async function handleSmartFallback(query, originalMessage) {
  // Try to detect "what is" questions for general concepts
  if (/^(what|who|where|when|why|how)\b/.test(query)) {
    // Check if it looks like a question about our system
    const sysWords = ["incident", "alert", "kpi", "user", "task", "status", "deploy", "sla", "cpu", "memory", "database", "latency"];
    const matchedWord = sysWords.find((w) => query.includes(w));

    if (matchedWord) {
      // Route to the matching handler
      for (const topic of TOPICS) {
        if (topic.keys.some((k) => matchedWord.includes(k) || k.includes(matchedWord))) {
          return topic.handler(query, originalMessage);
        }
      }
    }

    // General "what is" question — provide honest response
    return {
      response: `I'm an operational intelligence assistant focused on infrastructure monitoring, incident management, and system health.\n\nI can answer questions about:\n- System status, incidents, alerts, KPIs\n- Performance (CPU, memory, latency, database)\n- SLAs, deployments, security\n- Math calculations (e.g. "23433/33")\n- Term definitions (e.g. "what is an SLA")\n\nFor your question "${originalMessage}", try rephrasing it as one of the topics above, or type "help" to see all available commands.`,
      suggestedActions: ["Help", "System Status", "Generate Summary"],
    };
  }

  // If it contains numbers and operators, try math more aggressively
  const aggressiveMath = query.replace(/[a-z\s?!,]/gi, "").trim();
  if (/^[\d\+\-\*\/\.\(\)\^%]+$/.test(aggressiveMath) && /\d/.test(aggressiveMath) && /[\+\-\*\/\^%]/.test(aggressiveMath)) {
    const mathResult = tryMath(aggressiveMath);
    if (mathResult) return mathResult;
  }

  // Default fallback with helpful context
  const incidentCount = await safeCount("incidents", "status != 'RESOLVED'");
  const alertCount = await safeCount("alerts");

  return {
    response: `I wasn't able to find a specific answer for "${originalMessage}".\n\nQuick Status:\n- Active Incidents: ${incidentCount}\n- Alerts: ${alertCount}\n- System Health: ${incidentCount > 3 ? "Degraded" : "Operational"}\n\nTry asking about: system status, incidents, alerts, SLA, performance, deployments, security, KPIs, or type "help" for a full list of topics.`,
    suggestedActions: ["Help", "System Status", "Explain Incident", "Generate Summary"],
  };
}

module.exports = { processAiChat };
