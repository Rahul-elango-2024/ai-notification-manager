const pool = require("../db");
const bcrypt = require("bcrypt");

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    const userRes = await pool.query(
      `SELECT 
        u.id, u.name AS username, u.email, u.role, u.department, u.is_active, u.created_at,
        u.first_name, u.last_name, u.phone, u.location, u.avatar_url
       FROM users u
       WHERE u.id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const user = userRes.rows[0];

    // Fetch Recent Activity (Alerts, Notifications, Audit Logs, KPI updates)
    const [alertsRes, notifsRes, auditRes] = await Promise.all([
      pool.query(`SELECT id, status, message, created_at FROM alerts WHERE is_resolved = FALSE ORDER BY created_at DESC LIMIT 5`),
      pool.query(`SELECT id, recipient, status, sent_at AS created_at FROM notification_logs WHERE recipient = $1 ORDER BY sent_at DESC LIMIT 5`, [user.email]),
      pool.query(`SELECT id, action, description, created_at FROM audit_logs WHERE admin_user_id = $1 ORDER BY created_at DESC LIMIT 5`, [userId]),
    ]);

    res.status(200).json({
      user: {
        ...user,
        employee_id: `EMP-${String(user.id).padStart(4, "0")}`,
        status: user.is_active ? "ACTIVE" : "INACTIVE",
        password_last_changed: user.created_at,
      },
      recentActivity: {
        alerts: alertsRes.rows,
        notifications: notifsRes.rows,
        auditLogs: auditRes.rows,
      },
    });
  } catch (error) {
    console.error("getProfile Error:", error.message);
    res.status(500).json({ error: "Failed to fetch profile details." });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { first_name, last_name, phone, location, avatar_url } = req.body;

    const updateRes = await pool.query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           location = COALESCE($4, location),
           avatar_url = COALESCE($5, avatar_url)
       WHERE id = $6
       RETURNING id, name AS username, email, role, department, first_name, last_name, phone, location, avatar_url`,
      [first_name, last_name, phone, location, avatar_url, userId]
    );

    res.status(200).json({
      message: "Profile updated successfully.",
      user: updateRes.rows[0],
    });
  } catch (error) {
    console.error("updateProfile Error:", error.message);
    res.status(500).json({ error: "Failed to update profile." });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long." });
    }

    const userRes = await pool.query(`SELECT password FROM users WHERE id = $1`, [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const validPassword = await bcrypt.compare(currentPassword, userRes.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ error: "Incorrect current password." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(`UPDATE users SET password = $1 WHERE id = $2`, [hashedPassword, userId]);

    // Record audit log
    await pool.query(
      `INSERT INTO audit_logs (admin_user_id, target_user_id, action, description) VALUES ($1, $2, $3, $4)`,
      [userId, userId, "PASSWORD_CHANGED", "User updated account password successfully."]
    );

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("updatePassword Error:", error.message);
    res.status(500).json({ error: "Failed to update password." });
  }
};
