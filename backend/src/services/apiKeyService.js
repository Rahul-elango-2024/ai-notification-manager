const crypto = require("crypto");
const pool = require("../db");

async function writeAuditLog({ adminUserId, targetUserId, action, description }) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (admin_user_id, target_user_id, action, description)
       VALUES ($1, $2, $3, $4)`,
      [adminUserId, targetUserId || null, action, description]
    );
  } catch (err) {
    console.error("⚠️ Audit log write failed:", err.message);
  }
}

class ApiKeyService {
  /**
   * Create a new API Key.
   * Generates a cryptographically random raw key (ank_live_...)
   * Stores SHA-256 hash in DB and key prefix for identification.
   */
  async createApiKey({ key_name, department_id, created_by, owner_name, description, expires_at }) {
    const randomHex = crypto.randomBytes(24).toString("hex");
    const rawKey = `ank_live_${randomHex}`;

    const keyHash = crypto
      .createHash("sha256")
      .update(rawKey)
      .digest("hex");

    const keyPrefix = `ank_live_${randomHex.slice(0, 6)}...`;

    const result = await pool.query(
      `INSERT INTO api_keys (
        key_name, api_key_hash, key_prefix, department_id, created_by, owner_name, description, expires_at, is_deleted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)
      RETURNING id, key_name, key_prefix, department_id, created_by, owner_name, description, status, expires_at, created_at`,
      [
        key_name.trim(),
        keyHash,
        keyPrefix,
        department_id || null,
        created_by || null,
        owner_name ? owner_name.trim() : null,
        description ? description.trim() : null,
        expires_at || null,
      ]
    );

    const newKey = result.rows[0];

    await writeAuditLog({
      adminUserId: created_by,
      action: "CREATE_API_KEY",
      description: `Created API Key '${newKey.key_name}' (#${newKey.id}) for owner '${newKey.owner_name || "N/A"}'`,
    });

    return {
      key: newKey,
      plainTextKey: rawKey, // Exposed ONCE during creation
    };
  }

  /**
   * Get all API Keys (with department name).
   * Filters out deleted keys (WHERE is_deleted = FALSE OR is_deleted IS NULL).
   */
  async getAllApiKeys() {
    const result = await pool.query(`
      SELECT 
        k.id,
        k.key_name,
        k.key_prefix,
        k.department_id,
        d.name AS department_name,
        k.created_by,
        u.name AS creator_name,
        k.owner_name,
        k.description,
        k.status,
        k.expires_at,
        k.last_used_at,
        k.created_at,
        k.updated_at
      FROM api_keys k
      LEFT JOIN departments d ON k.department_id = d.id
      LEFT JOIN users u ON k.created_by = u.id
      WHERE (k.is_deleted = FALSE OR k.is_deleted IS NULL)
      ORDER BY k.created_at DESC
    `);
    return result.rows;
  }

  /**
   * Rotate an API Key. Invalidates old hash and issues a new key string.
   */
  async rotateApiKey(id, adminUserId) {
    const randomHex = crypto.randomBytes(24).toString("hex");
    const rawKey = `ank_live_${randomHex}`;

    const keyHash = crypto
      .createHash("sha256")
      .update(rawKey)
      .digest("hex");

    const keyPrefix = `ank_live_${randomHex.slice(0, 6)}...`;

    const existing = await pool.query("SELECT id, key_name FROM api_keys WHERE id = $1 AND (is_deleted = FALSE OR is_deleted IS NULL)", [id]);
    if (existing.rows.length === 0) {
      const err = new Error("API Key not found.");
      err.status = 404;
      throw err;
    }

    const result = await pool.query(
      `UPDATE api_keys 
       SET api_key_hash = $1, key_prefix = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND (is_deleted = FALSE OR is_deleted IS NULL)
       RETURNING id, key_name, key_prefix, department_id, status, expires_at, updated_at`,
      [keyHash, keyPrefix, id]
    );

    await writeAuditLog({
      adminUserId,
      action: "ROTATE_API_KEY",
      description: `Rotated credentials for API Key '${existing.rows[0].key_name}' (#${id})`,
    });

    return {
      key: result.rows[0],
      plainTextKey: rawKey, // Exposed ONCE during rotation
    };
  }

  /**
   * Toggle status (ACTIVE / DISABLED).
   */
  async updateKeyStatus(id, status, adminUserId) {
    const validStatuses = ["ACTIVE", "DISABLED"];
    if (!validStatuses.includes(status)) {
      const err = new Error("Invalid status. Allowed: ACTIVE, DISABLED");
      err.status = 400;
      throw err;
    }

    const existing = await pool.query("SELECT id, key_name FROM api_keys WHERE id = $1 AND (is_deleted = FALSE OR is_deleted IS NULL)", [id]);
    if (existing.rows.length === 0) {
      const err = new Error("API Key not found.");
      err.status = 404;
      throw err;
    }

    const result = await pool.query(
      `UPDATE api_keys SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND (is_deleted = FALSE OR is_deleted IS NULL) RETURNING *`,
      [status, id]
    );

    await writeAuditLog({
      adminUserId,
      action: "UPDATE_API_KEY_STATUS",
      description: `Changed status of API Key '${existing.rows[0].key_name}' (#${id}) to '${status}'`,
    });

    return result.rows[0];
  }

  /**
   * Revoke an API Key. Updates status = 'REVOKED' (does NOT delete).
   */
  async revokeApiKey(id, adminUserId) {
    const existing = await pool.query("SELECT id, key_name FROM api_keys WHERE id = $1 AND (is_deleted = FALSE OR is_deleted IS NULL)", [id]);
    if (existing.rows.length === 0) {
      const err = new Error("API Key not found.");
      err.status = 404;
      throw err;
    }

    const result = await pool.query(
      `UPDATE api_keys SET status = 'REVOKED', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    await writeAuditLog({
      adminUserId,
      action: "REVOKE_API_KEY",
      description: `Revoked API Key '${existing.rows[0].key_name}' (#${id})`,
    });

    return result.rows[0];
  }

  /**
   * Permanently Delete an API Key from PostgreSQL.
   * Unlinks dependent logs and executes hard DELETE + is_deleted soft flag.
   */
  async deleteApiKey(id, adminUserId) {
    const existing = await pool.query(
      "SELECT id, key_name FROM api_keys WHERE id = $1 AND (is_deleted = FALSE OR is_deleted IS NULL)",
      [id]
    );
    if (existing.rows.length === 0) {
      const err = new Error("API Key not found or already deleted.");
      err.status = 404;
      throw err;
    }

    const keyName = existing.rows[0].key_name;

    // 1. Unlink dependent request logs
    await pool.query("UPDATE api_request_logs SET api_key_id = NULL WHERE api_key_id = $1", [id]);

    // 2. Perform hard SQL DELETE from api_keys
    const hardDeleteRes = await pool.query(
      "DELETE FROM api_keys WHERE id = $1 RETURNING id",
      [id]
    );

    // If hard delete was prevented, set soft delete flag as backup
    if (hardDeleteRes.rows.length === 0) {
      await pool.query(
        "UPDATE api_keys SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP WHERE id = $1",
        [id]
      );
    }

    // 3. Write audit log
    await writeAuditLog({
      adminUserId,
      action: "DELETE_API_KEY",
      description: `Permanently deleted API Key '${keyName}' (#${id})`,
    });

    return { id: Number(id), key_name: keyName };
  }
}

module.exports = new ApiKeyService();
