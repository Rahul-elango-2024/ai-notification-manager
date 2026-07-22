const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");
const {
  sendEmail,
  sendEmailWithRetry,
} = require("./emailService");
const { generateAIAnalysis } = require("./aiService");

const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// RETRY CONFIGURATION
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
      JOIN departments d
        ON k.department_id = d.id
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
      JOIN departments d
        ON k.department_id = d.id
      LEFT JOIN LATERAL (
        SELECT
          value,
          source,
          recorded_at
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
      if (target > warning && warning > critical) {
        if (current <= critical) {
          status = "CRITICAL";
        } else if (current <= warning) {
          status = "WARNING";
        }
      }

      // Lower value is better
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
        kpi.status !== "WARNING" &&
        kpi.status !== "CRITICAL"
      ) {
        continue;
      }

      // ==========================================
      // CHECK FOR EXISTING UNRESOLVED ALERT
      // ==========================================

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

      if (existingAlert.rows.length > 0) {
        continue;
      }

      // ==========================================
      // GENERATE AI ANALYSIS
      // ==========================================

      const aiAnalysis = generateAIAnalysis(
        kpi,
        kpi.status
      );

      console.log(
        `AI analysis generated for ${kpi.kpi_name}`
      );

      // ==========================================
      // CREATE ALERT MESSAGE
      // ==========================================

      const message =
        `${aiAnalysis.summary}\n\n` +
        `${aiAnalysis.analysis}\n\n` +
        `Recommendation: ${aiAnalysis.recommendation}`;

      // ==========================================
      // CREATE ALERT
      // ==========================================

      const newAlert = await pool.query(
        `
        INSERT INTO alerts
        (
          kpi_id,
          status,
          message,
          current_value,
          risk_score,
          risk_level,
          deviation_percentage,
          deviation_direction,
          impact_summary,
          possible_causes,
          recommended_actions,
          ai_timeline,
          ai_generated_at,
          escalation_level,
          escalation_status
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10::jsonb,
          $11::jsonb,
          $12::jsonb,
          $13,
          0,
          'NOT_ESCALATED'
        )
        RETURNING *
        `,
        [
          kpi.id,
          kpi.status,
          message,
          kpi.current_value,
          aiAnalysis.riskScore,
          aiAnalysis.riskLevel,
          aiAnalysis.deviationPercentage,
          aiAnalysis.deviationDirection,
          aiAnalysis.impactSummary,
          JSON.stringify(aiAnalysis.possibleCauses || []),
          JSON.stringify(aiAnalysis.recommendedActions || []),
          JSON.stringify(aiAnalysis.timeline || []),
          aiAnalysis.generatedAt,
        ]
      );

      const alertId = newAlert.rows[0].id;

      console.log(
        `New ${kpi.status} alert created for ${kpi.kpi_name}`
      );

      console.log(
        `Risk Score: ${aiAnalysis.riskScore}/100`
      );

      console.log(
        `Risk Level: ${aiAnalysis.riskLevel}`
      );

      console.log(
        `Deviation: ${aiAnalysis.deviationText}`
      );

      // ==========================================
      // SMART ROUTING
      // ==========================================

      const routes = await pool.query(
        `
        SELECT
          id,
          recipient,
          severity,
          channel
        FROM notification_routes
        WHERE department_id = $1
          AND severity = $2
          AND channel = 'EMAIL'
          AND is_active = TRUE
        ORDER BY id
        `,
        [kpi.department_id, kpi.status]
      );

      // ==========================================
      // NO MATCHING ROUTE
      // ==========================================

      if (routes.rows.length === 0) {
        console.log(
          `No active email notification route found for ` +
          `${kpi.department} - ${kpi.status}`
        );

        continue;
      }

      // ==========================================
      // BUILD EMAIL CONTENT
      // ==========================================

      const emailSubject =
        `${kpi.status} Alert - ${kpi.kpi_name}`;

      const possibleCausesText =
        aiAnalysis.possibleCauses &&
        aiAnalysis.possibleCauses.length > 0
          ? aiAnalysis.possibleCauses
              .map(
                (cause, index) =>
                  `${index + 1}. ${cause}`
              )
              .join("\n")
          : "No specific causes identified.";

      const recommendedActionsText =
        aiAnalysis.recommendedActions &&
        aiAnalysis.recommendedActions.length > 0
          ? aiAnalysis.recommendedActions
              .map(
                (action, index) =>
                  `${index + 1}. ${action}`
              )
              .join("\n")
          : aiAnalysis.recommendation;

      const emailBody = `
AI NOTIFICATION MANAGER
============================================

${kpi.status} ALERT

KPI:
${kpi.kpi_name}

Department:
${kpi.department}

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

============================================
AI RISK ASSESSMENT
============================================

Risk Score:
${aiAnalysis.riskScore}/100

Risk Level:
${aiAnalysis.riskLevel}

Deviation:
${aiAnalysis.deviationText}

============================================
AI IMPACT SUMMARY
============================================

${aiAnalysis.impactSummary}

============================================
AI ANALYSIS
============================================

${aiAnalysis.analysis}

============================================
POSSIBLE CAUSES
============================================

${possibleCausesText}

============================================
RECOMMENDED ACTIONS
============================================

${recommendedActionsText}

============================================

Analysis Generated At:
${aiAnalysis.generatedAt}

This is an automated intelligent notification
generated by AI Notification Manager.
`;

      // ==========================================
      // SEND EMAILS WITH AUTOMATIC RETRY
      // ==========================================

      for (const route of routes.rows) {
        console.log(
          `Starting notification delivery to ${route.recipient}`
        );

        const deliveryResult =
          await sendEmailWithRetry(
            route.recipient,
            emailSubject,
            emailBody,
            {
              maxRetries: MAX_EMAIL_RETRIES,
              retryDelay: EMAIL_RETRY_DELAY,
            }
          );

        // ==========================================
        // SUCCESSFUL DELIVERY
        // ==========================================

        if (deliveryResult.success) {
          console.log(
            `Alert email delivered successfully to ${route.recipient}`
          );

          console.log(
            `Total attempts: ${deliveryResult.attempts}`
          );

          await pool.query(
            `
            INSERT INTO notification_logs
            (
              alert_id,
              recipient,
              channel,
              status,
              error_message,
              retry_count,
              max_retries,
              next_retry_at,
              last_retry_at,
              escalation_level
            )
            VALUES
            (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8,
              $9,
              $10
            )
            `,
            [
              alertId,
              route.recipient,
              "EMAIL",
              "SENT",
              null,
              deliveryResult.retryCount,
              MAX_EMAIL_RETRIES,
              null,
              deliveryResult.retryCount > 0
                ? new Date()
                : null,
              0,
            ]
          );

          console.log(
            `Successful notification log saved for ${route.recipient}`
          );

          continue;
        }

        // ==========================================
        // DELIVERY FAILED AFTER ALL RETRIES
        // ==========================================

        console.error(
          `Email delivery permanently failed for ${route.recipient}`
        );

        console.error(
          `Attempts: ${deliveryResult.attempts}`
        );

        console.error(
          `Error: ${deliveryResult.error}`
        );

        // ==========================================
        // SAVE FAILED NOTIFICATION
        // ==========================================

        await pool.query(
          `
          INSERT INTO notification_logs
          (
            alert_id,
            recipient,
            channel,
            status,
            error_message,
            retry_count,
            max_retries,
            next_retry_at,
            last_retry_at,
            escalation_level
          )
          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10
          )
          `,
          [
            alertId,
            route.recipient,
            "EMAIL",
            "FAILED",
            deliveryResult.error,
            deliveryResult.retryCount,
            MAX_EMAIL_RETRIES,
            null,
            new Date(),
            0,
          ]
        );

        console.log(
          `Failed notification logged for ${route.recipient}`
        );

        // ==========================================
        // AUTOMATIC ESCALATION
        // ==========================================

        try {
          console.log(
            `Starting automatic escalation for Alert #${alertId}`
          );

          const escalationLevel = 1;

          // ==========================================
          // UPDATE ALERT ESCALATION STATUS
          // ==========================================

          const escalatedAlert =
            await pool.query(
              `
              UPDATE alerts
              SET
                escalation_level = $1,
                escalation_status = 'ESCALATED',
                last_escalated_at = CURRENT_TIMESTAMP
              WHERE id = $2
                AND is_resolved = FALSE
              RETURNING *
              `,
              [
                escalationLevel,
                alertId,
              ]
            );

          if (escalatedAlert.rows.length === 0) {
            console.log(
              `Alert #${alertId} was not escalated because it is already resolved or does not exist`
            );

            continue;
          }

          // ==========================================
          // UPDATE FAILED NOTIFICATION LOG
          // ==========================================

          await pool.query(
            `
            UPDATE notification_logs
            SET
              escalation_level = $1
            WHERE alert_id = $2
              AND recipient = $3
              AND status = 'FAILED'
            `,
            [
              escalationLevel,
              alertId,
              route.recipient,
            ]
          );

          console.log(
            `Alert #${alertId} automatically escalated to Level ${escalationLevel}`
          );

          console.log(
            `Escalation Status: ESCALATED`
          );
        } catch (escalationError) {
          console.error(
            `Automatic escalation failed for Alert #${alertId}:`,
            escalationError
          );
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

app.post(
  "/api/kpis/:id/readings",
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        value,
        source = "Manual Dashboard Update",
      } = req.body;

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

      const numericValue = Number(value);

      if (Number.isNaN(numericValue)) {
        return res.status(400).json({
          success: false,
          message:
            "KPI value must be a valid number",
        });
      }

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

      const result = await pool.query(
        `
        INSERT INTO kpi_readings
        (
          kpi_id,
          value,
          source,
          recorded_at
        )
        VALUES
        (
          $1,
          $2,
          $3,
          CURRENT_TIMESTAMP
        )
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
        message:
          "KPI value updated successfully",
        reading: result.rows[0],
      });
    } catch (error) {
      console.error(
        "Error updating KPI value:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update KPI value",
        error: error.message,
      });
    }
  }
);

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

        a.risk_score,
        a.risk_level,
        a.deviation_percentage,
        a.deviation_direction,
        a.impact_summary,
        a.possible_causes,
        a.recommended_actions,
        a.ai_timeline,
        a.ai_generated_at,

        a.escalation_level,
        a.escalation_status,
        a.last_escalated_at,

        k.name AS kpi_name,
        k.unit,
        k.target_value,
        k.warning_threshold,
        k.critical_threshold,

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

app.put(
  "/api/alerts/:id/resolve",
  async (req, res) => {
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
        message:
          "Alert resolved successfully",
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
  }
);

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
        ORDER BY
          d.name,
          nr.severity
      `);

      res.json(result.rows);
    } catch (error) {
      console.error(
        "Error fetching notification routes:",
        error
      );

      res.status(500).json({
        error:
          "Failed to fetch notification routes",
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

          nl.retry_count,
          nl.max_retries,
          nl.next_retry_at,
          nl.last_retry_at,
          nl.escalation_level,

          a.status AS alert_status,
          a.message AS alert_message,
          a.escalation_status AS alert_escalation_status,
          a.escalation_level AS alert_escalation_level,
          a.last_escalated_at,

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
        error:
          "Failed to fetch notification logs",
      });
    }
  }
);

// ==========================================
// TEST EMAIL
// ==========================================

app.post(
  "/api/test-email",
  async (req, res) => {
    try {
      await sendEmail(
        process.env.EMAIL_USER,
        "AI Notification Manager - Test Email",
        "Success! Your AI Notification Manager email notification system is working correctly."
      );

      res.json({
        success: true,
        message:
          "Test email sent successfully",
      });
    } catch (error) {
      console.error(
        "Test email error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to send test email",
        error: error.message,
      });
    }
  }
);

// ==========================================
// CREATE NOTIFICATION ROUTE
// ==========================================

app.post(
  "/api/notification-routes",
  async (req, res) => {
    try {
      const {
        department_id,
        severity,
        channel,
        recipient,
      } = req.body;

      if (
        !department_id ||
        !severity ||
        !channel ||
        !recipient
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All fields are required",
        });
      }

      const allowedSeverities = [
        "WARNING",
        "CRITICAL",
      ];

      if (
        !allowedSeverities.includes(
          severity
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid severity",
        });
      }

      if (channel !== "EMAIL") {
        return res.status(400).json({
          success: false,
          message:
            "Only EMAIL channel is currently supported",
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
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          TRUE
        )
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
        message:
          "Notification route created successfully",
        route: result.rows[0],
      });
    } catch (error) {
      console.error(
        "Error creating notification route:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to create notification route",
        error: error.message,
      });
    }
  }
);

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
        SET
          is_active = NOT is_active
        WHERE id = $1
        RETURNING *
        `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Notification route not found",
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
        message:
          "Notification route status updated",
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
          message:
            "Notification route not found",
        });
      }

      console.log(
        `Notification route ${id} deleted`
      );

      res.json({
        success: true,
        message:
          "Notification route deleted successfully",
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
  console.log(
    `Server running on port ${PORT}`
  );

  console.log(
    `Email retry system enabled: maximum ${MAX_EMAIL_RETRIES} retries`
  );

  console.log(
    "Automatic escalation system enabled"
  );
});