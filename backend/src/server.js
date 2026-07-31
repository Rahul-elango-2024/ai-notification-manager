const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/healthRoutes");
const configurationRoutes = require("./routes/configurationRoutes");
const alertRoutes = require("./routes/alertRoutes");
const monitoringRoutes = require("./routes/monitoringRoutes");
const kpiRoutes = require("./routes/kpiRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const apiIngestRoutes = require("./routes/apiIngestRoutes");
const apiKeyRoutes = require("./routes/apiKeyRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const apiAnalyticsRoutes = require("./routes/apiAnalyticsRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const simulationRoutes = require("./routes/simulationRoutes");
const profileRoutes = require("./routes/profileRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const executiveRoutes = require("./routes/executiveRoutes");

require("dotenv").config();

const http = require("http");
const { initializeSocket } = require("./socket");

const pool = require("./db");
const { processTimedEscalations } = require("./services/escalationService");

const app = express();

const httpServer = http.createServer(app);

initializeSocket(httpServer, app);

app.use(cors());
app.use(express.json());

const searchRoutes = require("./routes/searchRoutes");
const aiRoutes = require("./routes/aiRoutes");

app.use("/api/health", healthRoutes);
app.use("/api", configurationRoutes);
app.use("/api", alertRoutes);
app.use("/api", monitoringRoutes);
app.use("/api", kpiRoutes);
app.use("/api", notificationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/api/v1", apiIngestRoutes);
app.use("/api", apiKeyRoutes);
app.use("/api", webhookRoutes);
app.use("/api", apiAnalyticsRoutes);
app.use("/api", predictionRoutes);
app.use("/api", simulationRoutes);
app.use("/api", profileRoutes);
app.use("/api", settingsRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/executive", executiveRoutes);
app.use("/api", searchRoutes);
app.use("/api", aiRoutes);
// ==========================================
// CONFIGURATION
// ==========================================

const MAX_EMAIL_RETRIES = 3;
const EMAIL_RETRY_DELAY = 5000;
// ==========================================
// ROOT API
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message: "AI Notification Manager API is running",
  });
});

// ==========================================
// 404 HANDLER
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    error: "API route not found",
    method: req.method,
    path: req.originalUrl,
  });
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use(
  (error, req, res, next) => {
    console.error(
      "Unhandled server error:",
      error
    );

    res.status(500).json({
      error:
        "Internal server error",
    });
  }
);

// ==========================================
// START SERVER
// ==========================================

const PORT =
  process.env.PORT || 5000;

// ==========================================
// RUN PENDING DB MIGRATIONS ON STARTUP
// ==========================================
async function runMigrations() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        admin_user_id INTEGER NOT NULL,
        target_user_id INTEGER,
        action VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_user_id ON audit_logs(admin_user_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id ON audit_logs(target_user_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
    `);

    // API Integration Hub Tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        key_name VARCHAR(100) NOT NULL,
        api_key_hash VARCHAR(255) UNIQUE NOT NULL,
        key_prefix VARCHAR(32) NOT NULL,
        department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        owner_name VARCHAR(100),
        description TEXT,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        expires_at TIMESTAMP NULL,
        last_used_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Alter column size and add soft delete columns safely
    await pool.query(`ALTER TABLE api_keys ALTER COLUMN key_prefix TYPE VARCHAR(32);`).catch(() => {});
    await pool.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;`).catch(() => {});
    await pool.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;`).catch(() => {});

    await pool.query(`
      CREATE TABLE IF NOT EXISTS api_request_logs (
        id SERIAL PRIMARY KEY,
        api_key_id INTEGER REFERENCES api_keys(id) ON DELETE SET NULL,
        endpoint VARCHAR(255) NOT NULL,
        payload JSONB,
        response_status INTEGER NOT NULL,
        response_body JSONB,
        latency_ms INTEGER NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        status VARCHAR(20) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS webhooks (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        target_url TEXT NOT NULL,
        secret_header VARCHAR(255),
        events JSONB NOT NULL,
        department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS webhook_logs (
        id SERIAL PRIMARY KEY,
        webhook_id INTEGER REFERENCES webhooks(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        payload JSONB NOT NULL,
        response_status INTEGER,
        response_body TEXT,
        latency_ms INTEGER,
        status VARCHAR(20) NOT NULL,
        attempt_count INTEGER DEFAULT 1,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // AI Predictive Analytics & Forecasting Tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prediction_history (
        id SERIAL PRIMARY KEY,
        kpi_id INTEGER REFERENCES kpis(id) ON DELETE CASCADE,
        forecast_period VARCHAR(20) NOT NULL,
        predicted_value NUMERIC(12, 2) NOT NULL,
        confidence_percentage NUMERIC(5, 2) NOT NULL,
        trend VARCHAR(20) NOT NULL,
        risk_level VARCHAR(20) NOT NULL,
        risk_score INTEGER NOT NULL,
        anomaly_predicted BOOLEAN DEFAULT FALSE,
        expected_anomaly_time TIMESTAMP NULL,
        ai_recommendation TEXT,
        prediction_for TIMESTAMP NOT NULL,
        model_version VARCHAR(50) DEFAULT 'v1.2-ensemble',
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_prediction_history_kpi_id ON prediction_history(kpi_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_prediction_history_generated_at ON prediction_history(generated_at DESC);
    `);

    // Enterprise KPI Simulator Tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS simulation_history (
        id SERIAL PRIMARY KEY,
        scenario_name VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL,
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP NULL,
        duration_seconds INTEGER DEFAULT 0,
        readings_generated_count INTEGER DEFAULT 0,
        alerts_generated_count INTEGER DEFAULT 0,
        max_risk_score INTEGER DEFAULT 0,
        settings_snapshot JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_simulation_history_created_at ON simulation_history(created_at DESC);
    `);

    // Profile & System Settings Tables
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);`).catch(() => {});
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);`).catch(() => {});
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);`).catch(() => {});
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(100) DEFAULT 'HQ - Global Operations';`).catch(() => {});
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`).catch(() => {});

    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value JSONB NOT NULL,
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_incident_analysis (
        id SERIAL PRIMARY KEY,
        incident_id INTEGER REFERENCES incidents(id) ON DELETE CASCADE UNIQUE,
        incident_summary TEXT,
        probable_root_cause TEXT,
        business_impact TEXT,
        recommended_actions TEXT,
        estimated_resolution_time VARCHAR(100),
        recommended_team VARCHAR(100),
        confidence_score NUMERIC(5, 2) DEFAULT 95.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Executive Collaboration Dashboard Tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS executive_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE,
        department VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL,
        title VARCHAR(100),
        status VARCHAR(20) DEFAULT 'AVAILABLE',
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_presence (
        id SERIAL PRIMARY KEY,
        user_name VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Available',
        activity VARCHAR(255),
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_messages (
        id SERIAL PRIMARY KEY,
        incident_id INTEGER REFERENCES incidents(id) ON DELETE SET NULL,
        sender_name VARCHAR(100) NOT NULL,
        sender_department VARCHAR(100),
        message_type VARCHAR(30) DEFAULT 'ENGINEER',
        content TEXT NOT NULL,
        attachments JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS executive_tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority VARCHAR(20) DEFAULT 'MEDIUM',
        owner_name VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        status VARCHAR(30) DEFAULT 'Pending',
        due_date VARCHAR(50),
        incident_id INTEGER REFERENCES incidents(id) ON DELETE SET NULL,
        is_ai_generated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS incident_comments (
        id SERIAL PRIMARY KEY,
        incident_id INTEGER REFERENCES incidents(id) ON DELETE CASCADE,
        author_name VARCHAR(100) NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_feed (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        actor_name VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'GENERAL',
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS executive_approvals (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        requester_name VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        risk_level VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'PENDING',
        approver_name VARCHAR(100),
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS department_health (
        id SERIAL PRIMARY KEY,
        department_name VARCHAR(100) UNIQUE NOT NULL,
        risk_score INTEGER NOT NULL,
        incident_count INTEGER DEFAULT 0,
        status VARCHAR(30) NOT NULL,
        ai_health NUMERIC(5, 2) DEFAULT 95.0,
        trend VARCHAR(20) DEFAULT 'STABLE',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS executive_notifications (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(20) DEFAULT 'INFO',
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Enterprise API Integration Hub, AI Predictive Analytics, Executive Collaboration & Settings database tables ready");
  } catch (err) {
    console.error("❌ Migration error:", err.message);
  }
}

runMigrations();

const server = httpServer.listen(
  PORT,
  () => {
    console.log(
      `Server running on port ${PORT}`
    );

    console.log(
      `Email retry system enabled: maximum ${MAX_EMAIL_RETRIES} retries`
    );

    console.log(
      "Multi-level automatic escalation system enabled"
    );

    console.log(
      "Alert acknowledgement system enabled"
    );

    console.log(
      "Escalation checker running every 1 minute"
    );

    console.log(
      "RBAC User Management enabled (Admin only)"
    );
  }
);

// ==========================================
// TIMED ESCALATION CHECKER
// ==========================================

const escalationInterval =
  setInterval(
    processTimedEscalations,
    60 * 1000
  );

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

function shutdown() {
  console.log(
    "Shutting down server..."
  );

  clearInterval(
    escalationInterval
  );

  server.close(() => {
    console.log(
      "HTTP server closed"
    );

    pool.end()
      .then(() => {
        console.log(
          "PostgreSQL connection pool closed"
        );

        process.exit(0);
      })
      .catch((error) => {
        console.error(
          "Error closing PostgreSQL pool:",
          error
        );

        process.exit(1);
      });
  });
}

process.on(
  "SIGINT",
  shutdown
);

process.on(
  "SIGTERM",
  shutdown
);