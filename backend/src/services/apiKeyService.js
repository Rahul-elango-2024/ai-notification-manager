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
        key_name, api_key_hash, key_prefix, department_id, created_by, owner_name, description, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
   * Never exposes api_key_hash.
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

    const existing = await pool.query("SELECT id, key_name FROM api_keys WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      const err = new Error("API Key not found.");
      err.status = 404;
      throw err;
    }

    const result = await pool.query(
      `UPDATE api_keys 
       SET api_key_hash = $1, key_prefix = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
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

    const existing = await pool.query("SELECT id, key_name FROM api_keys WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      const err = new Error("API Key not found.");
      err.status = 404;
      throw err;
    }

    const result = await pool.query(
      `UPDATE api_keys SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
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
   * Revoke an API Key.
   */
  async revokeApiKey(id, adminUserId) {
    const existing = await pool.query("SELECT id, key_name FROM api_keys WHERE id = $1", [id]);
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
      description: `Permanently revoked API Key '${existing.rows[0].key_name}' (#${id})`,
    });

    return result.rows[0];
  }
}

module.exports = new ApiKeyService();
