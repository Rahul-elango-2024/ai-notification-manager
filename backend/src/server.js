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
        k.department_id,
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
        k.department_id,
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

    // ==========================================
    // CREATE ALERTS AND SEND NOTIFICATIONS
    // ==========================================
    for (const kpi of monitoringData) {
      if (
        kpi.status === "WARNING" ||
        kpi.status === "CRITICAL"
      ) {
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

        // Only create and notify for a new alert
        if (existingAlert.rows.length === 0) {
          const message =
            `${kpi.kpi_name} in ${kpi.department} is currently ${kpi.status}. ` +
            `Current value: ${kpi.current_value} ${kpi.unit}`;

          // Create alert in database
          const newAlert = await pool.query(
            `
            INSERT INTO alerts
            (kpi_id, status, message, current_value)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            `,
            [
              kpi.id,
              kpi.status,
              message,
              kpi.current_value,
            ]
          );

          const alertId = newAlert.rows[0].id;

          console.log(
            `New ${kpi.status} alert created for ${kpi.kpi_name}`
          );

          // Find matching active email notification routes
          const routes = await pool.query(
            `
            SELECT recipient
            FROM notification_routes
            WHERE department_id = $1
            AND severity = $2
            AND channel = 'EMAIL'
            AND is_active = TRUE
            `,
            [kpi.department_id, kpi.status]
          );

          // ==========================================
          // SEND EMAILS AND SAVE NOTIFICATION LOGS
          // ==========================================
          for (const route of routes.rows) {
            const emailSubject =
              `${kpi.status} Alert - ${kpi.kpi_name}`;

            const emailBody = `
AI NOTIFICATION MANAGER

${kpi.status} ALERT

KPI: ${kpi.kpi_name}

Department: ${kpi.department}

Current Value:
${kpi.current_value} ${kpi.unit}

Target Value:
${kpi.target_value} ${kpi.unit}

Warning Threshold:
${kpi.warning_threshold} ${kpi.unit}

Critical Threshold:
${kpi.critical_threshold} ${kpi.unit}

Status:
${kpi.status}

Source:
${kpi.source || "Unknown"}

Alert ID:
${alertId}

--------------------------------------------

This is an automated notification generated by
AI Notification Manager.
`;

            try {
              // Send email
              await sendEmail(
                route.recipient,
                emailSubject,
                emailBody
              );

              console.log(
                `Alert email sent successfully to ${route.recipient}`
              );

              // Save successful notification
              await pool.query(
                `
                INSERT INTO notification_logs
                (
                  alert_id,
                  recipient,
                  channel,
                  status,
                  error_message
                )
                VALUES ($1, $2, $3, $4, $5)
                `,
                [
                  alertId,
                  route.recipient,
                  "EMAIL",
                  "SENT",
                  null,
                ]
              );

              console.log(
                `Notification log saved successfully for ${route.recipient}`
              );
            } catch (emailError) {
              console.error(
                `Failed to send alert email to ${route.recipient}:`,
                emailError.message
              );

              // Save failed notification
              try {
                await pool.query(
                  `
                  INSERT INTO notification_logs
                  (
                    alert_id,
                    recipient,
                    channel,
                    status,
                    error_message
                  )
                  VALUES ($1, $2, $3, $4, $5)
                  `,
                  [
                    alertId,
                    route.recipient,
                    "EMAIL",
                    "FAILED",
                    emailError.message,
                  ]
                );

                console.log(
                  `Failed notification attempt logged for ${route.recipient}`
                );
              } catch (logError) {
                console.error(
                  "Failed to save notification log:",
                  logError.message
                );
              }
            }
          }

          // No matching notification route
          if (routes.rows.length === 0) {
            console.log(
              `No active email notification route found for ` +
              `${kpi.department} - ${kpi.status}`
            );
          }
        }
      }
    }

    res.json(monitoringData);
  } catch (error) {
    console.error(
      "Error fetching monitoring data:",
      error
    );

    res.status(500).json({
      error: "Failed to fetch monitoring data",
    });
  }
});

// ==========================================
// UPDATE KPI VALUE / ADD NEW KPI READING
// ==========================================
app.post("/api/kpis/:id/readings", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      value,
      source = "Manual Dashboard Update",
    } = req.body;

    // Check whether a value was provided
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "KPI value is required",
      });
    }

    // Convert value to number
    const numericValue = Number(value);

    // Validate number
    if (Number.isNaN(numericValue)) {
      return res.status(400).json({
        success: false,
        message: "KPI value must be a valid number",
      });
    }

    // Check whether KPI exists
    const kpiResult = await pool.query(
      `
      SELECT
        id,
        name
      FROM kpis
      WHERE id = $1
      `,
      [id]
    );

    if (kpiResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "KPI not found",
      });
    }

    // Insert new KPI reading
    const result = await pool.query(
      `
      INSERT INTO kpi_readings
      (
        kpi_id,
        value,
        source,
        recorded_at
      )
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING *
      `,
      [
        id,
        numericValue,
        source,
      ]
    );

    console.log(
      `New KPI reading added: ${kpiResult.rows[0].name} = ${numericValue}`
    );

    res.status(201).json({
      success: true,
      message: "KPI value updated successfully",
      reading: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Error updating KPI value:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update KPI value",
      error: error.message,
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
      JOIN kpis k
        ON a.kpi_id = k.id
      JOIN departments d
        ON k.department_id = d.id
      ORDER BY a.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(
      "Error fetching alerts:",
      error
    );

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
    console.error(
      "Error resolving alert:",
      error
    );

    res.status(500).json({
      error: "Failed to resolve alert",
    });
  }
});

// ==========================================
// GET NOTIFICATION ROUTES
// ==========================================
app.get(
  "/api/notification-routes",
  async (req, res) => {
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
        JOIN departments d
          ON nr.department_id = d.id
        ORDER BY d.name, nr.severity
      `);

      res.json(result.rows);
    } catch (error) {
      console.error(
        "Error fetching notification routes:",
        error
      );

      res.status(500).json({
        error: "Failed to fetch notification routes",
      });
    }
  }
);

// ==========================================
// GET NOTIFICATION LOGS
// ==========================================
app.get(
  "/api/notification-logs",
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          nl.id,
          nl.alert_id,
          nl.recipient,
          nl.channel,
          nl.status,
          nl.error_message,
          nl.sent_at,
          a.status AS alert_status,
          a.message AS alert_message,
          k.name AS kpi_name,
          d.name AS department
        FROM notification_logs nl
        LEFT JOIN alerts a
          ON nl.alert_id = a.id
        LEFT JOIN kpis k
          ON a.kpi_id = k.id
        LEFT JOIN departments d
          ON k.department_id = d.id
        ORDER BY nl.sent_at DESC
      `);

      res.json(result.rows);
    } catch (error) {
      console.error(
        "Error fetching notification logs:",
        error
      );

      res.status(500).json({
        error: "Failed to fetch notification logs",
      });
    }
  }
);

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
    console.error(
      "Test email error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to send test email",
      error: error.message,
    });
  }
});
// ==========================================
// CREATE NOTIFICATION ROUTE
// ==========================================
app.post("/api/notification-routes", async (req, res) => {
  try {
    const {
      department_id,
      severity,
      channel,
      recipient,
    } = req.body;

    // Validate required fields
    if (
      !department_id ||
      !severity ||
      !channel ||
      !recipient
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Validate severity
    const allowedSeverities = ["WARNING", "CRITICAL"];

    if (!allowedSeverities.includes(severity)) {
      return res.status(400).json({
        success: false,
        message: "Invalid severity",
      });
    }

    // Currently our application supports EMAIL
    if (channel !== "EMAIL") {
      return res.status(400).json({
        success: false,
        message: "Only EMAIL channel is currently supported",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO notification_routes
      (
        department_id,
        severity,
        channel,
        recipient,
        is_active
      )
      VALUES ($1, $2, $3, $4, TRUE)
      RETURNING *
      `,
      [
        department_id,
        severity,
        channel,
        recipient,
      ]
    );

    console.log(
      `New notification route created for ${recipient}`
    );

    res.status(201).json({
      success: true,
      message: "Notification route created successfully",
      route: result.rows[0],
    });

  } catch (error) {
    console.error(
      "Error creating notification route:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to create notification route",
      error: error.message,
    });
  }
});


// ==========================================
// UPDATE NOTIFICATION ROUTE STATUS
// ==========================================
app.put(
  "/api/notification-routes/:id/toggle",
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `
        UPDATE notification_routes
        SET is_active = NOT is_active
        WHERE id = $1
        RETURNING *
        `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Notification route not found",
        });
      }

      console.log(
        `Notification route ${id} status changed to ${
          result.rows[0].is_active
            ? "ACTIVE"
            : "INACTIVE"
        }`
      );

      res.json({
        success: true,
        message: "Notification route status updated",
        route: result.rows[0],
      });

    } catch (error) {
      console.error(
        "Error updating notification route:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update notification route",
      });
    }
  }
);


// ==========================================
// DELETE NOTIFICATION ROUTE
// ==========================================
app.delete(
  "/api/notification-routes/:id",
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `
        DELETE FROM notification_routes
        WHERE id = $1
        RETURNING *
        `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Notification route not found",
        });
      }

      console.log(
        `Notification route ${id} deleted`
      );

      res.json({
        success: true,
        message: "Notification route deleted successfully",
      });

    } catch (error) {
      console.error(
        "Error deleting notification route:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete notification route",
      });
    }
  }
);

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});