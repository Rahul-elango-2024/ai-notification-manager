const pool = require("../db");

exports.getNotificationLogs = async (req, res) => {
  try {
    const result = await pool.query(`
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
      ORDER BY CASE WHEN nl.status = 'FAILED' THEN 0 ELSE 1 END, nl.sent_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching notification logs:", error);

    res.status(500).json({
      error: "Failed to fetch notification logs",
    });
  }
};
