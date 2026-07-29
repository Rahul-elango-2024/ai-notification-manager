const pool = require("../db");
const { hashPassword } = require("../utils/password");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = ["Admin", "Manager", "Employee", "Viewer"];

// ==========================================
// AUDIT LOG HELPER
// ==========================================

async function writeAuditLog({ adminUserId, targetUserId, action, description }) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (admin_user_id, target_user_id, action, description)
       VALUES ($1, $2, $3, $4)`,
      [adminUserId, targetUserId || null, action, description]
    );
  } catch (err) {
    // Non-fatal — log but don't break the request
    console.error("⚠️  Audit log write failed:", err.message);
  }
}

// ==========================================
// GET ALL USERS
// ==========================================

exports.getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, department, role, is_active, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("❌ getAllUsers error:", error.message);
    res.status(500).json({ error: "Failed to retrieve users." });
  }
};

// ==========================================
// GET USER BY ID
// ==========================================

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, name, email, department, role, is_active, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("❌ getUserById error:", error.message);
    res.status(500).json({ error: "Failed to retrieve user." });
  }
};

// ==========================================
// CREATE USER
// ==========================================

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, department, role, is_active } = req.body;
    const adminUserId = req.user.id;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        error: "Name, email, password, and role are required.",
      });
    }

    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Name cannot be empty." });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters.",
      });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        error: `Invalid role. Allowed: ${VALID_ROLES.join(", ")}.`,
      });
    }

    // Duplicate email check
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already in use." });
    }

    const hashedPassword = await hashPassword(password);
    const activeStatus = is_active !== undefined ? is_active : true;

    const result = await pool.query(
      `INSERT INTO users (name, email, password, department, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, department, role, is_active, created_at, updated_at`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        hashedPassword,
        department ? department.trim() : null,
        role,
        activeStatus,
      ]
    );

    const newUser = result.rows[0];

    await writeAuditLog({
      adminUserId,
      targetUserId: newUser.id,
      action: "CREATE_USER",
      description: `Admin created user '${newUser.name}' (${newUser.email}) with role '${newUser.role}'.`,
    });

    console.log(`✅ User created: ${newUser.email} by admin #${adminUserId}`);
    res.status(201).json({ message: "User created successfully.", user: newUser });
  } catch (error) {
    console.error("❌ createUser error:", error.message);
    res.status(500).json({ error: "Failed to create user." });
  }
};

// ==========================================
// UPDATE USER
// ==========================================

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department } = req.body;
    const adminUserId = req.user.id;

    if (!name && !email && department === undefined) {
      return res.status(400).json({ error: "Provide at least one field to update." });
    }

    // Fetch existing user
    const existing = await pool.query(
      "SELECT id, name, email, department FROM users WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = existing.rows[0];

    if (email && !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    // Check duplicate email (excluding this user)
    if (email && email.toLowerCase().trim() !== user.email) {
      const dup = await pool.query(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email.toLowerCase().trim(), id]
      );
      if (dup.rows.length > 0) {
        return res.status(409).json({ error: "Email already in use by another user." });
      }
    }

    const updatedName = name ? name.trim() : user.name;
    const updatedEmail = email ? email.toLowerCase().trim() : user.email;
    const updatedDepartment = department !== undefined ? (department ? department.trim() : null) : user.department;

    const result = await pool.query(
      `UPDATE users
       SET name = $1, email = $2, department = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, name, email, department, role, is_active, created_at, updated_at`,
      [updatedName, updatedEmail, updatedDepartment, id]
    );

    await writeAuditLog({
      adminUserId,
      targetUserId: Number(id),
      action: "EDIT_USER",
      description: `Admin updated user #${id} — name: '${updatedName}', email: '${updatedEmail}'.`,
    });

    console.log(`✅ User #${id} updated by admin #${adminUserId}`);
    res.status(200).json({ message: "User updated successfully.", user: result.rows[0] });
  } catch (error) {
    console.error("❌ updateUser error:", error.message);
    res.status(500).json({ error: "Failed to update user." });
  }
};

// ==========================================
// PATCH STATUS (ACTIVATE / DEACTIVATE)
// ==========================================

exports.patchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const adminUserId = req.user.id;

    if (is_active === undefined || typeof is_active !== "boolean") {
      return res.status(400).json({ error: "is_active (boolean) is required." });
    }

    // Self-protection
    if (Number(id) === Number(adminUserId)) {
      return res.status(400).json({
        error: "You cannot activate or deactivate your own account.",
      });
    }

    const existing = await pool.query("SELECT id, name FROM users WHERE id = $1", [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const result = await pool.query(
      `UPDATE users
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, name, email, department, role, is_active, created_at, updated_at`,
      [is_active, id]
    );

    const action = is_active ? "ACTIVATE_USER" : "DEACTIVATE_USER";
    const actionLabel = is_active ? "activated" : "deactivated";

    await writeAuditLog({
      adminUserId,
      targetUserId: Number(id),
      action,
      description: `Admin ${actionLabel} user '${existing.rows[0].name}' (#${id}).`,
    });

    console.log(`✅ User #${id} ${actionLabel} by admin #${adminUserId}`);
    res.status(200).json({
      message: `User ${actionLabel} successfully.`,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("❌ patchStatus error:", error.message);
    res.status(500).json({ error: "Failed to update user status." });
  }
};

// ==========================================
// PATCH PASSWORD (RESET)
// ==========================================

exports.patchPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const adminUserId = req.user.id;

    if (!password) {
      return res.status(400).json({ error: "New password is required." });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters.",
      });
    }

    const existing = await pool.query("SELECT id, name FROM users WHERE id = $1", [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const hashedPassword = await hashPassword(password);

    await pool.query(
      "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [hashedPassword, id]
    );

    await writeAuditLog({
      adminUserId,
      targetUserId: Number(id),
      action: "RESET_PASSWORD",
      description: `Admin reset password for user '${existing.rows[0].name}' (#${id}).`,
    });

    console.log(`✅ Password reset for user #${id} by admin #${adminUserId}`);
    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("❌ patchPassword error:", error.message);
    res.status(500).json({ error: "Failed to reset password." });
  }
};

// ==========================================
// PATCH ROLE
// ==========================================

exports.patchRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const adminUserId = req.user.id;

    // Self-protection
    if (Number(id) === Number(adminUserId)) {
      return res.status(400).json({
        error: "You cannot change your own role.",
      });
    }

    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({
        error: `Invalid role. Allowed: ${VALID_ROLES.join(", ")}.`,
      });
    }

    const existing = await pool.query("SELECT id, name, role FROM users WHERE id = $1", [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const result = await pool.query(
      `UPDATE users
       SET role = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, name, email, department, role, is_active, created_at, updated_at`,
      [role, id]
    );

    await writeAuditLog({
      adminUserId,
      targetUserId: Number(id),
      action: "CHANGE_ROLE",
      description: `Admin changed role of user '${existing.rows[0].name}' (#${id}) from '${existing.rows[0].role}' to '${role}'.`,
    });

    console.log(`✅ Role of user #${id} changed to '${role}' by admin #${adminUserId}`);
    res.status(200).json({ message: "Role updated successfully.", user: result.rows[0] });
  } catch (error) {
    console.error("❌ patchRole error:", error.message);
    res.status(500).json({ error: "Failed to update role." });
  }
};
