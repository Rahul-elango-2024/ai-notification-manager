const pool = require("../db");

// ==========================================
// GET NOTIFICATION ROUTES
// ==========================================

const getNotificationRoutes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        nr.id,
        nr.department_id,
        d.name AS department,
        nr.severity,
        nr.recipient,
        nr.channel,
        nr.is_active,
        nr.created_at
      FROM notification_routes nr
      JOIN departments d
        ON nr.department_id = d.id
      ORDER BY nr.department_id, nr.severity
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching notification routes:", error);

    res.status(500).json({
      error: "Failed to fetch notification routes",
    });
  }
};

// ==========================================
// GET ESCALATION RULES
// ==========================================

const getEscalationRules = async (req, res) => {
  try {
    const result = await pool.query(`
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
    console.error("Error fetching escalation rules:", error);

    res.status(500).json({
      error: "Failed to fetch escalation rules",
    });
  }
};

// ==========================================
// CREATE ESCALATION RULE
// ==========================================

const createEscalationRule = async (req, res) => {
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

    const result = await pool.query(
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
        escalate_after_minutes || 15,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Escalation rule created successfully",
      rule: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating escalation rule:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        error:
          "An escalation rule already exists for this department, severity and level",
      });
    }

    res.status(500).json({
      error: "Failed to create escalation rule",
    });
  }
};

// ==========================================
// TOGGLE ESCALATION RULE
// ==========================================

const toggleEscalationRule = async (req, res) => {
  try {
    const ruleId = req.params.id;

    const result = await pool.query(
      `
      UPDATE escalation_rules
      SET is_active = NOT is_active
      WHERE id = $1
      RETURNING *
      `,
      [ruleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Escalation rule not found",
      });
    }

    res.json({
      success: true,
      message: "Escalation rule status updated successfully",
      rule: result.rows[0],
    });
  } catch (error) {
    console.error("Error toggling escalation rule:", error);

    res.status(500).json({
      error: "Failed to update escalation rule",
    });
  }
};

// ==========================================
// DELETE ESCALATION RULE
// ==========================================

const deleteEscalationRule = async (req, res) => {
  try {
    const ruleId = req.params.id;

    const result = await pool.query(
      `
      DELETE FROM escalation_rules
      WHERE id = $1
      RETURNING *
      `,
      [ruleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Escalation rule not found",
      });
    }

    res.json({
      success: true,
      message: "Escalation rule deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting escalation rule:", error);

    res.status(500).json({
      error: "Failed to delete escalation rule",
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  getNotificationRoutes,
  getEscalationRules,
  createEscalationRule,
  toggleEscalationRule,
  deleteEscalationRule,
};