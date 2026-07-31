const crypto = require("crypto");
const pool = require("../db");

/**
 * Middleware to authenticate requests using an API Key.
 * Checks Authorization header (Bearer <key>) or x-api-key header.
 */
const apiKeyAuthMiddleware = async (req, res, next) => {
  try {
    let rawKey = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      rawKey = authHeader.split(" ")[1];
    } else if (req.headers["x-api-key"]) {
      rawKey = req.headers["x-api-key"];
    }

    if (!rawKey || !rawKey.trim()) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "API Key is required. Pass in Authorization header (Bearer <key>) or x-api-key header.",
      });
    }

    const keyHash = crypto
      .createHash("sha256")
      .update(rawKey.trim())
      .digest("hex");

    const result = await pool.query(
      `SELECT id, key_name, key_prefix, department_id, status, expires_at 
       FROM api_keys 
       WHERE api_key_hash = $1 AND (is_deleted = FALSE OR is_deleted IS NULL)
       LIMIT 1`,
      [keyHash]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid API key.",
      });
    }

    const apiKey = result.rows[0];

    if (apiKey.status !== "ACTIVE") {
      return res.status(403).json({
        error: "Forbidden",
        message: `API key is ${apiKey.status.toLowerCase()}. Please contact an administrator.`,
      });
    }

    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return res.status(403).json({
        error: "Forbidden",
        message: "API key has expired.",
      });
    }

    // Attach key data to request object
    req.apiKey = apiKey;

    // Asynchronously update last_used_at without blocking request
    pool.query("UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1", [apiKey.id])
      .catch((err) => console.error("Failed to update last_used_at:", err.message));

    next();
  } catch (error) {
    console.error("API Key Auth Error:", error.message);
    res.status(500).json({ error: "Internal server error during authentication." });
  }
};

module.exports = apiKeyAuthMiddleware;
