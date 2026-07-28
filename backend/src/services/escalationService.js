const pool = require("../db");
const { sendEmailWithRetry } = require("../emailService");

const MAX_EMAIL_RETRIES = 3;
const EMAIL_RETRY_DELAY = 5000;

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
// AUTO RESOLVE ALERTS
// ==========================================

async function autoResolveAlert(kpi) {
  try {
    const result = await pool.query(
      `
      UPDATE alerts
      SET
        is_resolved = TRUE,
        resolved_at = CURRENT_TIMESTAMP,
        resolved_by = 'SYSTEM',
        resolution_note = 'Automatically resolved because KPI returned to NORMAL.',
        escalation_status = 'AUTO_RESOLVED'
      WHERE
        kpi_id = $1
        AND is_resolved = FALSE
      RETURNING id, status
      `,
      [kpi.id]
    );

    if (result.rows.length > 0) {
      console.log(
        `${result.rows.length} alert(s) automatically resolved for ${kpi.kpi_name}`
      );
    }
  } catch (error) {
    console.error(
      `Auto resolve failed for ${kpi.kpi_name}:`,
      error
    );
  }
}



module.exports = {
  startEscalation,
  processTimedEscalations,
  autoResolveAlert
};
