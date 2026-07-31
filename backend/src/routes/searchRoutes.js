const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/search?q=query
router.get("/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) {
      return res.json({
        incidents: [],
        tasks: [],
        alerts: [],
        users: [],
        kpis: [],
      });
    }

    const searchTerm = `%${q}%`;

    // 1. Search Incidents (columns: id, incident_number, title, description, priority, status)
    const incidentsRes = await pool
      .query(
        `SELECT id, title, priority, status, created_at FROM incidents
         WHERE title ILIKE $1 OR description ILIKE $1 OR priority ILIKE $1 OR status ILIKE $1 OR incident_number ILIKE $1
         ORDER BY created_at DESC LIMIT 5`,
        [searchTerm]
      )
      .catch((e) => { console.error("Search incidents error:", e.message); return { rows: [] }; });

    // 2. Search Executive Tasks (columns: id, title, description, priority, status, owner_name, department)
    const tasksRes = await pool
      .query(
        `SELECT id, title, priority, status, owner_name, department FROM executive_tasks
         WHERE title ILIKE $1 OR description ILIKE $1 OR owner_name ILIKE $1 OR department ILIKE $1
         ORDER BY created_at DESC LIMIT 5`,
        [searchTerm]
      )
      .catch((e) => { console.error("Search tasks error:", e.message); return { rows: [] }; });

    // 3. Search Alerts (columns: id, message, status, risk_level, escalation_status)
    const alertsRes = await pool
      .query(
        `SELECT id, message, status, risk_level, created_at FROM alerts
         WHERE message ILIKE $1 OR status ILIKE $1 OR risk_level ILIKE $1
         ORDER BY created_at DESC LIMIT 5`,
        [searchTerm]
      )
      .catch((e) => { console.error("Search alerts error:", e.message); return { rows: [] }; });

    // 4. Search Users (columns: id, name, email, role, department)
    const usersRes = await pool
      .query(
        `SELECT id, name, email, role, department FROM users
         WHERE name ILIKE $1 OR email ILIKE $1 OR role ILIKE $1 OR department ILIKE $1
         ORDER BY name ASC LIMIT 5`,
        [searchTerm]
      )
      .catch((e) => { console.error("Search users error:", e.message); return { rows: [] }; });

    // 5. Search KPIs (columns: id, name, description, unit, target_value)
    const kpisRes = await pool
      .query(
        `SELECT id, name, description, target_value FROM kpis
         WHERE name ILIKE $1 OR description ILIKE $1
         ORDER BY name ASC LIMIT 5`,
        [searchTerm]
      )
      .catch((e) => { console.error("Search kpis error:", e.message); return { rows: [] }; });

    res.json({
      incidents: incidentsRes.rows,
      tasks: tasksRes.rows,
      alerts: alertsRes.rows,
      users: usersRes.rows,
      kpis: kpisRes.rows,
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
