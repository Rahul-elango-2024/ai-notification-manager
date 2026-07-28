const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/healthRoutes");
const configurationRoutes = require("./routes/configurationRoutes");
const alertRoutes = require("./routes/alertRoutes");
const monitoringRoutes = require("./routes/monitoringRoutes");
const kpiRoutes = require("./routes/kpiRoutes");
const notificationRoutes = require("./routes/notificationRoutes");


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

app.use("/api/health", healthRoutes);
app.use("/api", configurationRoutes);
app.use("/api", alertRoutes);
app.use("/api", monitoringRoutes);
app.use("/api", kpiRoutes);
app.use("/api", notificationRoutes);
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