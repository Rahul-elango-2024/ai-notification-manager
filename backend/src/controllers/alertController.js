const pool = require("../db");

// ==========================================
// GET ALL ALERTS
// ==========================================

const getAllAlerts = async (req, res) => {
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
    console.error("Error fetching alerts:", error);

    res.status(500).json({
      error: "Failed to fetch alerts",
    });
  }
};

// ==========================================
// GET SINGLE ALERT
// ==========================================

const getAlertById = async (req, res) => {
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
    console.error("Error fetching alert:", error);

    res.status(500).json({
      error: "Failed to fetch alert",
    });
  }
};

// ==========================================
// GET ALERT DETAILS
// ==========================================

const getAlertDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const alertResult = await pool.query(
      `
      SELECT
        a.*,
        k.name AS kpi_name,
        d.name AS department
      FROM alerts a
      JOIN kpis k
        ON a.kpi_id = k.id
      JOIN departments d
        ON k.department_id = d.id
      WHERE a.id = $1
      `,
      [id]
    );

    if (alertResult.rows.length === 0) {
      return res.status(404).json({
        error: "Alert not found",
      });
    }

    const notificationResult = await pool.query(
      `
      SELECT
        id,
        recipient,
        channel,
        status,
        retry_count,
        max_retries,
        escalation_level,
        error_message,
        sent_at,
        last_retry_at,
        next_retry_at
      FROM notification_logs
      WHERE alert_id = $1
      ORDER BY escalation_level ASC, sent_at ASC
      `,
      [id]
    );

    res.json({
      alert: alertResult.rows[0],
      notificationHistory: notificationResult.rows,
    });
  } catch (error) {
    console.error("Error fetching alert details:", error);

    res.status(500).json({
      error: "Failed to fetch alert details",
    });
  }
};

// ==========================================
// ACKNOWLEDGE ALERT
// ==========================================

const acknowledgeAlert = async (req, res) => {
  try {
    const alertId = req.params.id;
    const { acknowledged_by } = req.body;

    if (!acknowledged_by || !acknowledged_by.trim()) {
      return res.status(400).json({
        error: "acknowledged_by is required",
      });
    }

    const result = await pool.query(
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
      [acknowledged_by.trim(), alertId]
    );

    if (result.rows.length === 0) {
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
      message: "Alert acknowledged successfully",
      alert: result.rows[0],
    });
  } catch (error) {
    console.error("Error acknowledging alert:", error);

    res.status(500).json({
      error: "Failed to acknowledge alert",
    });
  }
};

// ==========================================
// RESOLVE ALERT
// ==========================================

const resolveAlert = async (req, res) => {
  try {
    const alertId = req.params.id;

    const { resolved_by, resolution_note } = req.body;

    if (!resolved_by || !resolved_by.trim()) {
      return res.status(400).json({
        error: "Resolved By is required",
      });
    }

    if (!resolution_note || !resolution_note.trim()) {
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
        error: "Alert not found or already resolved",
      });
    }

    console.log(
      `Alert #${alertId} resolved by ${resolved_by.trim()}`
    );

    res.json({
      success: true,
      message: "Alert resolved successfully",
      alert: result.rows[0],
    });
  } catch (error) {
    console.error("Error resolving alert:", error);

    res.status(500).json({
      error: "Failed to resolve alert",
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  getAllAlerts,
  getAlertById,
  getAlertDetails,
  acknowledgeAlert,
  resolveAlert,
};