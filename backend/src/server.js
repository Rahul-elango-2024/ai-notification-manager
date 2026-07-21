const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");
const { sendEmail } = require("./emailService");

const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// ROOT API
// ==========================================
app.get("/", (req, res) => {
  res.json({
    message: "AI Notification Manager API is running",
  });
});

// ==========================================
// GET ALL KPIs
// ==========================================
app.get("/api/kpis", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        k.id,
        k.name AS kpi_name,
        d.name AS department,
        k.unit,
        k.target_value,
        k.warning_threshold,
        k.critical_threshold
      FROM kpis k
      JOIN departments d ON k.department_id = d.id
      ORDER BY k.id
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching KPIs:", error);

    res.status(500).json({
      error: "Failed to fetch KPI data",
    });
  }
});

// ==========================================
// KPI MONITORING
// ==========================================
app.get("/api/monitoring", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        k.id,
        k.name AS kpi_name,
        d.name AS department,
        k.unit,
        k.target_value,
        k.warning_threshold,
        k.critical_threshold,
        kr.value AS current_value,
        kr.source,
        kr.recorded_at
      FROM kpis k
      JOIN departments d ON k.department_id = d.id
      LEFT JOIN LATERAL (
        SELECT value, source, recorded_at
        FROM kpi_readings
        WHERE kpi_id = k.id
        ORDER BY recorded_at DESC
        LIMIT 1
      ) kr ON true
      ORDER BY k.id
    `);

    const monitoringData = result.rows.map((kpi) => {
      const current = Number(kpi.current_value);
      const target = Number(kpi.target_value);
      const warning = Number(kpi.warning_threshold);
      const critical = Number(kpi.critical_threshold);

      let status = "NORMAL";

      // Higher value is better
      // Example: Sales Revenue, Operational Efficiency
      if (target > warning && warning > critical) {
        if (current <= critical) {
          status = "CRITICAL";
        } else if (current <= warning) {
          status = "WARNING";
        }
      }

      // Lower value is better
      // Example: Expenses, Downtime, Response Time
      else if (target < warning && warning < critical) {
        if (current >= critical) {
          status = "CRITICAL";
        } else if (current >= warning) {
          status = "WARNING";
        }
      }

      return {
        ...kpi,
        status,
      };
    });

    // Automatically create alerts for WARNING and CRITICAL KPIs
    for (const kpi of monitoringData) {
      if (kpi.status === "WARNING" || kpi.status === "CRITICAL") {

        // Check if an unresolved alert already exists
        const existingAlert = await pool.query(
          `
          SELECT id
          FROM alerts
          WHERE kpi_id = $1
          AND status = $2
          AND is_resolved = FALSE
          LIMIT 1
          `,
          [kpi.id, kpi.status]
        );

        // Create new alert only if one does not already exist
        if (existingAlert.rows.length === 0) {
          const message =
            `${kpi.kpi_name} in ${kpi.department} is currently ${kpi.status}. ` +
            `Current value: ${kpi.current_value} ${kpi.unit}`;

          await pool.query(
            `
            INSERT INTO alerts
            (kpi_id, status, message, current_value)
            VALUES ($1, $2, $3, $4)
            `,
            [kpi.id, kpi.status, message, kpi.current_value]
          );

          console.log(
            `New ${kpi.status} alert created for ${kpi.kpi_name}`
          );
        }
      }
    }

    res.json(monitoringData);

  } catch (error) {
    console.error("Error fetching monitoring data:", error);

    res.status(500).json({
      error: "Failed to fetch monitoring data",
    });
  }
});

// ==========================================
// GET ALL ALERTS
// ==========================================
app.get("/api/alerts", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a.id,
        a.status,
        a.message,
        a.current_value,
        a.is_resolved,
        a.created_at,
        a.resolved_at,
        k.name AS kpi_name,
        d.name AS department
      FROM alerts a
      JOIN kpis k ON a.kpi_id = k.id
      JOIN departments d ON k.department_id = d.id
      ORDER BY a.created_at DESC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("Error fetching alerts:", error);

    res.status(500).json({
      error: "Failed to fetch alerts",
    });
  }
});

// ==========================================
// RESOLVE ALERT
// ==========================================
app.put("/api/alerts/:id/resolve", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE alerts
      SET
        is_resolved = TRUE,
        resolved_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Alert not found",
      });
    }

    res.json({
      message: "Alert resolved successfully",
      alert: result.rows[0],
    });

  } catch (error) {
    console.error("Error resolving alert:", error);

    res.status(500).json({
      error: "Failed to resolve alert",
    });
  }
});

// ==========================================
// GET NOTIFICATION ROUTES
// ==========================================
app.get("/api/notification-routes", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        nr.id,
        nr.department_id,
        d.name AS department,
        nr.severity,
        nr.channel,
        nr.recipient,
        nr.is_active,
        nr.created_at
      FROM notification_routes nr
      JOIN departments d ON nr.department_id = d.id
      ORDER BY d.name, nr.severity
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("Error fetching notification routes:", error);

    res.status(500).json({
      error: "Failed to fetch notification routes",
    });
  }
});

// ==========================================
// TEST EMAIL
// ==========================================
app.post("/api/test-email", async (req, res) => {
  try {

    await sendEmail(
      process.env.EMAIL_USER,
      "AI Notification Manager - Test Email",
      "Success! Your AI Notification Manager email notification system is working correctly."
    );

    res.json({
      success: true,
      message: "Test email sent successfully",
    });

  } catch (error) {
    console.error("Test email error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to send test email",
      error: error.message,
    });
  }
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});