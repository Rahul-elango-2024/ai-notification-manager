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
// MULTI-LEVEL ESCALATION FUNCTION
// ==========================================

async function startEscalation({
  alertId,
  kpi,
  originalRecipient,
}) {
  try {
    console.log(
      `Starting database-driven escalation for Alert #${alertId}`
    );

    // Get the first active escalation rule.
    // Later levels will be processed by the scheduled escalation checker.
    const ruleResult = await pool.query(
      `
      SELECT
        id,
        department_id,
        severity,
        escalation_level,
        recipient,
        channel,
        escalate_after_minutes
      FROM escalation_rules
      WHERE department_id = $1
        AND severity = $2
        AND is_active = TRUE
      ORDER BY escalation_level ASC
      LIMIT 1
      `,
      [kpi.department_id, kpi.status]
    );

    if (ruleResult.rows.length === 0) {
      console.log(
        `No escalation rule found for ${kpi.department} - ${kpi.status}`
      );

      return;
    }

    const rule = ruleResult.rows[0];

    // Make sure the alert still exists and is unresolved/unacknowledged.
    const alertResult = await pool.query(
      `
      SELECT
        id,
        is_resolved,
        is_acknowledged,
        escalation_level
      FROM alerts
      WHERE id = $1
      LIMIT 1
      `,
      [alertId]
    );

    if (alertResult.rows.length === 0) {
      console.log(`Alert #${alertId} does not exist`);
      return;
    }

    const alert = alertResult.rows[0];

    if (alert.is_resolved) {
      console.log(
        `Alert #${alertId} is already resolved. Escalation cancelled.`
      );
      return;
    }

    if (alert.is_acknowledged) {
      console.log(
        `Alert #${alertId} is acknowledged. Escalation cancelled.`
      );
      return;
    }

    if (
      Number(alert.escalation_level || 0) >=
      Number(rule.escalation_level)
    ) {
      console.log(
        `Alert #${alertId} is already at escalation Level ${alert.escalation_level}`
      );
      return;
    }

    // Update the alert to the first escalation level.
    const escalatedAlert = await pool.query(
      `
      UPDATE alerts
      SET
        escalation_level = $1,
        escalation_status = 'ESCALATED',
        last_escalated_at = CURRENT_TIMESTAMP
      WHERE id = $2
        AND is_resolved = FALSE
        AND is_acknowledged = FALSE
        AND COALESCE(escalation_level, 0) < $1
      RETURNING *
      `,
      [
        rule.escalation_level,
        alertId,
      ]
    );

    if (escalatedAlert.rows.length === 0) {
      console.log(
        `Alert #${alertId} was not escalated because its state changed`
      );
      return;
    }

    // Update the failed original notification log.
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
        rule.escalation_level,
        alertId,
        originalRecipient,
      ]
    );

    console.log(
      `Alert #${alertId} automatically escalated to Level ${rule.escalation_level}`
    );

    console.log(
      `Escalation recipient: ${rule.recipient}`
    );

    console.log(
      "Escalation Status: ESCALATED"
    );

    console.log(
      `Next escalation threshold: ${rule.escalate_after_minutes} minute(s)`
    );
  } catch (error) {
    console.error(
      `Automatic escalation failed for Alert #${alertId}:`,
      error
    );
  }
}

// ==========================================
// PROCESS TIME-BASED ESCALATIONS
// ==========================================

async function processTimedEscalations() {
  try {
    console.log(
      "Checking for timed escalations..."
    );

    const alertsResult = await pool.query(
      `
      SELECT
        a.id,
        a.kpi_id,
        a.status,
        a.message,
        a.current_value,
        a.created_at,
        a.escalation_level,
        a.last_escalated_at,

        k.name AS kpi_name,
        k.department_id,
        k.unit,
        k.target_value,

        d.name AS department

      FROM alerts a

      JOIN kpis k
        ON a.kpi_id = k.id

      JOIN departments d
        ON k.department_id = d.id

      WHERE a.is_resolved = FALSE
        AND a.is_acknowledged = FALSE
        AND COALESCE(a.escalation_level, 0) > 0

      ORDER BY a.created_at ASC
      `
    );

    for (const alert of alertsResult.rows) {
      const currentLevel =
        Number(alert.escalation_level || 0);

      // Get the next active escalation rule.
      const nextRuleResult = await pool.query(
        `
        SELECT
          id,
          department_id,
          severity,
          escalation_level,
          recipient,
          channel,
          escalate_after_minutes
        FROM escalation_rules
        WHERE department_id = $1
          AND severity = $2
          AND escalation_level > $3
          AND is_active = TRUE
        ORDER BY escalation_level ASC
        LIMIT 1
        `,
        [
          alert.department_id,
          alert.status,
          currentLevel,
        ]
      );

      if (nextRuleResult.rows.length === 0) {
        continue;
      }

      const nextRule =
        nextRuleResult.rows[0];

      // ==========================================
      // POSTGRESQL-BASED TIME CHECK
      // ==========================================

      const dueResult = await pool.query(
        `
        SELECT
          CURRENT_TIMESTAMP >=
          $1::timestamp +
          ($2::numeric * INTERVAL '1 minute')
          AS escalation_due
        `,
        [
          alert.last_escalated_at ||
            alert.created_at,

          nextRule.escalate_after_minutes,
        ]
      );

      const escalationDue =
        dueResult.rows[0].escalation_due;

      console.log(
        `Alert #${alert.id}: current Level ${currentLevel}, next Level ${nextRule.escalation_level}, due: ${escalationDue}`
      );

      if (!escalationDue) {
        continue;
      }

      // ==========================================
      // ATOMIC ESCALATION UPDATE
      // ==========================================

      const updateResult = await pool.query(
        `
        UPDATE alerts
        SET
          escalation_level = $1,
          escalation_status = 'ESCALATED',
          last_escalated_at = CURRENT_TIMESTAMP
        WHERE id = $2
          AND is_resolved = FALSE
          AND is_acknowledged = FALSE
          AND COALESCE(escalation_level, 0) = $3
        RETURNING *
        `,
        [
          nextRule.escalation_level,
          alert.id,
          currentLevel,
        ]
      );

      if (updateResult.rows.length === 0) {
        console.log(
          `Alert #${alert.id}: escalation skipped because its state changed`
        );
        continue;
      }

      console.log(
        `Alert #${alert.id} escalated from Level ${currentLevel} to Level ${nextRule.escalation_level}`
      );

      console.log(
        `Escalation recipient: ${nextRule.recipient}`
      );

      // Only EMAIL is currently supported.
      if (nextRule.channel !== "EMAIL") {
        console.log(
          `Unsupported escalation channel: ${nextRule.channel}`
        );
        continue;
      }

      const escalationSubject =
        `ESCALATION LEVEL ${nextRule.escalation_level} - ${alert.status} Alert - ${alert.kpi_name}`;

      const escalationBody = `
AI NOTIFICATION MANAGER
============================================

AUTOMATIC ESCALATION

Escalation Level:
${nextRule.escalation_level}

Alert ID:
${alert.id}

KPI:
${alert.kpi_name}

Department:
${alert.department}

Severity:
${alert.status}

Current Value:
${alert.current_value} ${alert.unit}

Target Value:
${alert.target_value} ${alert.unit}

============================================
ALERT MESSAGE
============================================

${alert.message}

============================================

This alert remains unresolved and has automatically
advanced from escalation Level ${currentLevel}
to escalation Level ${nextRule.escalation_level}.

Escalation Recipient:
${nextRule.recipient}

This is an automated escalation generated by
AI Notification Manager.
`;

      const deliveryResult =
        await sendEmailWithRetry(
          nextRule.recipient,
          escalationSubject,
          escalationBody,
          {
            maxRetries: MAX_EMAIL_RETRIES,
            retryDelay: EMAIL_RETRY_DELAY,
          }
        );

      if (deliveryResult.success) {
        console.log(
          `Level ${nextRule.escalation_level} escalation email delivered successfully to ${nextRule.recipient}`
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
            alert.id,
            nextRule.recipient,
            "EMAIL",
            "SENT",
            null,
            deliveryResult.retryCount,
            MAX_EMAIL_RETRIES,
            null,

            deliveryResult.retryCount > 0
              ? new Date()
              : null,

            nextRule.escalation_level,
          ]
        );
      } else {
        console.error(
          `Level ${nextRule.escalation_level} escalation email failed for ${nextRule.recipient}`
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
            alert.id,
            nextRule.recipient,
            "EMAIL",
            "FAILED",
            deliveryResult.error,
            deliveryResult.retryCount,
            MAX_EMAIL_RETRIES,
            null,
            new Date(),
            nextRule.escalation_level,
          ]
        );
      }
    }
  } catch (error) {
    console.error(
      "Timed escalation processing failed:",
      error
    );
  }
}

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

    const monitoringData =
      result.rows.map((kpi) => {
        const current =
          Number(kpi.current_value);

        const target =
          Number(kpi.target_value);

        const warning =
          Number(kpi.warning_threshold);

        const critical =
          Number(kpi.critical_threshold);

        let status = "NORMAL";

        // Higher value is better.
        if (
          target > warning &&
          warning > critical
        ) {
          if (current <= critical) {
            status = "CRITICAL";
          } else if (current <= warning) {
            status = "WARNING";
          }
        }

        // Lower value is better.
        else if (
          target < warning &&
          warning < critical
        ) {
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
      // CHECK EXISTING ACTIVE ALERT
      // ==========================================

      const existingAlert =
        await pool.query(
          `
          SELECT id
          FROM alerts
          WHERE kpi_id = $1
            AND status = $2
            AND is_resolved = FALSE
          LIMIT 1
          `,
          [
            kpi.id,
            kpi.status,
          ]
        );

      if (
        existingAlert.rows.length > 0
      ) {
        continue;
      }

      // ==========================================
      // GENERATE AI ANALYSIS
      // ==========================================

      const aiAnalysis =
        generateAIAnalysis(
          kpi,
          kpi.status
        );

      console.log(
        `AI analysis generated for ${kpi.kpi_name}`
      );

      const message =
        `${aiAnalysis.summary}\n\n` +
        `${aiAnalysis.analysis}\n\n` +
        `Recommendation: ${aiAnalysis.recommendation}`;

      // ==========================================
      // CREATE ALERT WITH DUPLICATE PROTECTION
      // ==========================================

      const newAlert =
        await pool.query(
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
          ON CONFLICT (kpi_id, status)
          WHERE is_resolved = FALSE
          DO NOTHING
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
            JSON.stringify(
              aiAnalysis.possibleCauses || []
            ),
            JSON.stringify(
              aiAnalysis.recommendedActions || []
            ),
            JSON.stringify(
              aiAnalysis.timeline || []
            ),
            aiAnalysis.generatedAt,
          ]
        );

      if (
        newAlert.rows.length === 0
      ) {
        console.log(
          `Duplicate active ${kpi.status} alert prevented for ${kpi.kpi_name}`
        );
        continue;
      }

      const alertId =
        newAlert.rows[0].id;

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

      const routes =
        await pool.query(
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
          [
            kpi.department_id,
            kpi.status,
          ]
        );

      if (
        routes.rows.length === 0
      ) {
        console.log(
          `No active email notification route found for ${kpi.department} - ${kpi.status}`
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

Impact:
${aiAnalysis.impactSummary}

============================================
POSSIBLE CAUSES
============================================

${possibleCausesText}

============================================
RECOMMENDED ACTIONS
============================================

${recommendedActionsText}

============================================

This notification was automatically generated
by the AI Notification Manager.
`;

      // ==========================================
      // SEND NOTIFICATIONS
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
              maxRetries:
                MAX_EMAIL_RETRIES,

              retryDelay:
                EMAIL_RETRY_DELAY,
            }
          );

        if (deliveryResult.success) {
          console.log(
            `Notification delivered successfully to ${route.recipient}`
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
              route.channel,
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
        } else {
          console.error(
            `Email delivery permanently failed for ${route.recipient}`
          );

          console.error(
            `Attempts: ${deliveryResult.attempts}`
          );

          console.error(
            `Error: ${deliveryResult.error}`
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
              route.channel,
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

          await startEscalation({
            alertId,
            kpi,
            originalRecipient:
              route.recipient,
          });
        }
      }
    }

    res.json(monitoringData);
  } catch (error) {
    console.error(
      "Monitoring error:",
      error
    );

    res.status(500).json({
      error:
        "Failed to fetch monitoring data",
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
        a.kpi_id,
        k.name AS kpi_name,
        d.name AS department,
        a.status,
        a.message,
        a.current_value,
        a.risk_score,
        a.risk_level,
        a.deviation_percentage,
        a.deviation_direction,
        a.impact_summary,
        a.possible_causes,
        a.recommended_actions,
        a.ai_timeline,
        a.ai_generated_at,
        a.is_resolved,
        a.resolved_at,
        a.resolved_by,
        a.resolution_note,
        a.escalation_level,
        a.escalation_status,
        a.last_escalated_at,
        a.is_acknowledged,
        a.acknowledged_by,
        a.acknowledged_at,
        a.created_at
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
// GET SINGLE ALERT
// ==========================================

app.get("/api/alerts/:id", async (req, res) => {
  try {
    const alertId = req.params.id;

    const result = await pool.query(
      `
      SELECT
        a.*,
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
      WHERE a.id = $1
      LIMIT 1
      `,
      [alertId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Alert not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(
      "Error fetching alert:",
      error
    );

    res.status(500).json({
      error: "Failed to fetch alert",
    });
  }
});

// ==========================================
// ACKNOWLEDGE ALERT
// ==========================================

app.put(
  "/api/alerts/:id/acknowledge",
  async (req, res) => {
    try {
      const alertId = req.params.id;

      const {
        acknowledged_by,
      } = req.body;

      if (
        !acknowledged_by ||
        !acknowledged_by.trim()
      ) {
        return res.status(400).json({
          error:
            "acknowledged_by is required",
        });
      }

      const result =
        await pool.query(
          `
          UPDATE alerts
          SET
            is_acknowledged = TRUE,
            acknowledged_by = $1,
            acknowledged_at = CURRENT_TIMESTAMP,
            escalation_status = 'ACKNOWLEDGED'
          WHERE id = $2
            AND is_resolved = FALSE
            AND is_acknowledged = FALSE
          RETURNING *
          `,
          [
            acknowledged_by.trim(),
            alertId,
          ]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          error:
            "Alert not found, already acknowledged, or already resolved",
        });
      }

      console.log(
        `Alert #${alertId} acknowledged by ${acknowledged_by.trim()}`
      );

      res.json({
        success: true,
        message:
          "Alert acknowledged successfully",
        alert: result.rows[0],
      });
    } catch (error) {
      console.error(
        "Error acknowledging alert:",
        error
      );

      res.status(500).json({
        error:
          "Failed to acknowledge alert",
      });
    }
  }
);

// ==========================================
// RESOLVE ALERT
// ==========================================

app.put(
  "/api/alerts/:id/resolve",
  async (req, res) => {
    try {
      const alertId = req.params.id;

      const {
        resolved_by,
        resolution_note,
      } = req.body;

      // Validate resolved by
      if (
        !resolved_by ||
        !resolved_by.trim()
      ) {
        return res.status(400).json({
          error: "Resolved By is required",
        });
      }

      // Validate resolution note
      if (
        !resolution_note ||
        !resolution_note.trim()
      ) {
        return res.status(400).json({
          error: "Resolution Note is required",
        });
      }

      const result = await pool.query(
        `
        UPDATE alerts
        SET
          is_resolved = TRUE,
          resolved_at = CURRENT_TIMESTAMP,
          resolved_by = $2,
          resolution_note = $3,
          escalation_status = 'RESOLVED'
        WHERE id = $1
          AND is_resolved = FALSE
        RETURNING *
        `,
        [
          alertId,
          resolved_by.trim(),
          resolution_note.trim(),
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error:
            "Alert not found or already resolved",
        });
      }

      console.log(
        `Alert #${alertId} resolved by ${resolved_by.trim()}`
      );

      res.json({
        success: true,
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
        error:
          "Failed to resolve alert",
      });
    }
  }
);
// ==========================================
// ADD NEW KPI READING
// ==========================================

app.post(
  "/api/kpis/:id/readings",
  async (req, res) => {
    try {
      const kpiId =
        req.params.id;

      const {
        value,
        source,
      } = req.body;

      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return res.status(400).json({
          error: "value is required",
        });
      }

      const numericValue =
        Number(value);

      if (
        Number.isNaN(numericValue)
      ) {
        return res.status(400).json({
          error:
            "value must be a valid number",
        });
      }

      // Check that the KPI exists.
      const kpiResult =
        await pool.query(
          `
          SELECT
            id,
            name
          FROM kpis
          WHERE id = $1
          LIMIT 1
          `,
          [kpiId]
        );

      if (
        kpiResult.rows.length === 0
      ) {
        return res.status(404).json({
          error: "KPI not found",
        });
      }

      const result =
        await pool.query(
          `
          INSERT INTO kpi_readings
          (
            kpi_id,
            value,
            source
          )
          VALUES
          (
            $1,
            $2,
            $3
          )
          RETURNING *
          `,
          [
            kpiId,
            numericValue,
            source ||
              "Manual API Entry",
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
        "Error adding KPI reading:",
        error
      );

      res.status(500).json({
        error:
          "Failed to add KPI reading",
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
      const result =
        await pool.query(`
          SELECT
            nl.*,
            a.status AS alert_status,
            a.kpi_id,
            k.name AS kpi_name,
            d.name AS department
          FROM notification_logs nl
          JOIN alerts a
            ON nl.alert_id = a.id
          JOIN kpis k
            ON a.kpi_id = k.id
          JOIN departments d
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
// GET ESCALATION RULES
// ==========================================

app.get(
  "/api/escalation-rules",
  async (req, res) => {
    try {
      const result =
        await pool.query(`
          SELECT
            er.id,
            er.department_id,
            d.name AS department,
            er.severity,
            er.escalation_level,
            er.recipient,
            er.channel,
            er.escalate_after_minutes,
            er.is_active,
            er.created_at
          FROM escalation_rules er
          JOIN departments d
            ON er.department_id = d.id
          ORDER BY
            er.department_id,
            er.severity,
            er.escalation_level
        `);

      res.json(result.rows);
    } catch (error) {
      console.error(
        "Error fetching escalation rules:",
        error
      );

      res.status(500).json({
        error:
          "Failed to fetch escalation rules",
      });
    }
  }
);

// ==========================================
// CREATE ESCALATION RULE
// ==========================================

app.post(
  "/api/escalation-rules",
  async (req, res) => {
    try {
      const {
        department_id,
        severity,
        escalation_level,
        recipient,
        channel,
        escalate_after_minutes,
      } = req.body;

      if (
        !department_id ||
        !severity ||
        !escalation_level ||
        !recipient
      ) {
        return res.status(400).json({
          error:
            "department_id, severity, escalation_level and recipient are required",
        });
      }

      const result =
        await pool.query(
          `
          INSERT INTO escalation_rules
          (
            department_id,
            severity,
            escalation_level,
            recipient,
            channel,
            escalate_after_minutes
          )
          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
          )
          RETURNING *
          `,
          [
            department_id,
            severity,
            escalation_level,
            recipient,
            channel || "EMAIL",
            escalate_after_minutes ||
              15,
          ]
        );

      res.status(201).json({
        success: true,
        message:
          "Escalation rule created successfully",
        rule: result.rows[0],
      });
    } catch (error) {
      console.error(
        "Error creating escalation rule:",
        error
      );

      if (
        error.code === "23505"
      ) {
        return res.status(409).json({
          error:
            "An escalation rule already exists for this department, severity and level",
        });
      }

      res.status(500).json({
        error:
          "Failed to create escalation rule",
      });
    }
  }
);

// ==========================================
// TOGGLE ESCALATION RULE
// ==========================================

app.put(
  "/api/escalation-rules/:id/toggle",
  async (req, res) => {
    try {
      const ruleId =
        req.params.id;

      const result =
        await pool.query(
          `
          UPDATE escalation_rules
          SET
            is_active = NOT is_active
          WHERE id = $1
          RETURNING *
          `,
          [ruleId]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          error:
            "Escalation rule not found",
        });
      }

      res.json({
        success: true,
        message:
          "Escalation rule status updated successfully",
        rule: result.rows[0],
      });
    } catch (error) {
      console.error(
        "Error toggling escalation rule:",
        error
      );

      res.status(500).json({
        error:
          "Failed to update escalation rule",
      });
    }
  }
);

// ==========================================
// DELETE ESCALATION RULE
// ==========================================

app.delete(
  "/api/escalation-rules/:id",
  async (req, res) => {
    try {
      const ruleId =
        req.params.id;

      const result =
        await pool.query(
          `
          DELETE FROM escalation_rules
          WHERE id = $1
          RETURNING *
          `,
          [ruleId]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          error:
            "Escalation rule not found",
        });
      }

      res.json({
        success: true,
        message:
          "Escalation rule deleted successfully",
      });
    } catch (error) {
      console.error(
        "Error deleting escalation rule:",
        error
      );

      res.status(500).json({
        error:
          "Failed to delete escalation rule",
      });
    }
  }
);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get(
  "/api/health",
  async (req, res) => {
    try {
      await pool.query(
        "SELECT 1"
      );

      res.json({
        status: "OK",
        server: "running",
        database: "connected",
        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        status: "ERROR",
        server: "running",
        database: "disconnected",
        error: error.message,
      });
    }
  }
);

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

const server = app.listen(
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