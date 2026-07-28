const pool = require("../db");
const { autoResolveAlert, startEscalation } = require("./escalationService");
const { generateAIAnalysis } = require("../aiService");
const { sendEmailWithRetry } = require("../emailService");
const { getIo } = require("../socket/index");

const MAX_EMAIL_RETRIES = 3;
const EMAIL_RETRY_DELAY = 5000;

const processMonitoring = async () => {
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

  if (kpi.status === "NORMAL") {
    await autoResolveAlert(kpi);
    continue;
  }

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

// ==========================================
// SOCKET.IO REAL-TIME NOTIFICATION
// ==========================================

const io = getIo();

io.emit("newAlert", {
  id: alertId,
  kpi_name: kpi.kpi_name,
  department: kpi.department,
  status: kpi.status,
  current_value: kpi.current_value,
});

// ==========================================
// LOGS
// ==========================================

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

    
    return monitoringData;
  } catch (error) {
    console.error("Monitoring error:", error);
    throw new Error("Failed to fetch monitoring data");
  }
};

module.exports = {
  processMonitoring
};
