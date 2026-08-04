const pool = require("../db");
const crypto = require("crypto");

// Minimal encryption logic for API keys (in production this should use a secure KMS or stronger setup)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "12345678901234567890123456789012"; // Must be 32 chars
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text) {
  if (!text) return null;
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift(), "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

function maskApiKey(key) {
  if (!key) return null;
  if (key.length <= 8) return "********";
  return key.substring(0, 4) + "_live_" + "*".repeat(key.length - 4);
}

exports.getAllDataSources = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM data_sources ORDER BY created_at DESC");
    
    // Mask API keys before sending to frontend
    const sources = result.rows.map(row => {
      if (row.api_key_encrypted) {
        const decrypted = decrypt(row.api_key_encrypted);
        row.api_key = maskApiKey(decrypted);
        delete row.api_key_encrypted;
      }
      return row;
    });

    res.json(sources);
  } catch (error) {
    console.error("Error fetching data sources:", error);
    res.status(500).json({ error: "Failed to fetch data sources" });
  }
};

exports.createDataSource = async (req, res) => {
  try {
    const {
      name, type, connection_mode, base_url, authentication_type, api_key,
      headers, polling_interval, mappings
    } = req.body;

    const encryptedKey = api_key ? encrypt(api_key) : null;
    
    const result = await pool.query(
      `INSERT INTO data_sources (
        name, type, connection_mode, base_url, authentication_type, 
        api_key_encrypted, headers, polling_interval, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        name, type, connection_mode || 'REAL', base_url, authentication_type,
        encryptedKey, JSON.stringify(headers || {}), polling_interval || 60000, 'Connected'
      ]
    );

    const newSource = result.rows[0];

    // Handle mappings if provided
    if (mappings && Array.isArray(mappings)) {
      for (const map of mappings) {
        await pool.query(
          `INSERT INTO data_source_mappings (source_id, external_field, internal_kpi_id) VALUES ($1, $2, $3)`,
          [newSource.id, map.external_field, map.internal_kpi_id]
        );
      }
    }

    res.status(201).json(newSource);
  } catch (error) {
    console.error("Error creating data source:", error);
    res.status(500).json({ error: "Failed to create data source" });
  }
};

exports.updateDataSource = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, type, connection_mode, base_url, authentication_type, api_key,
      headers, polling_interval, status
    } = req.body;

    let updateQuery = `
      UPDATE data_sources 
      SET name = $1, type = $2, connection_mode = $3, base_url = $4, 
          authentication_type = $5, headers = $6, polling_interval = $7, 
          status = $8, updated_at = CURRENT_TIMESTAMP
    `;
    let queryParams = [
      name, type, connection_mode, base_url, authentication_type,
      JSON.stringify(headers || {}), polling_interval, status
    ];

    if (api_key && !api_key.includes('*')) {
      updateQuery += `, api_key_encrypted = $9 WHERE id = $10 RETURNING *`;
      queryParams.push(encrypt(api_key), id);
    } else {
      updateQuery += ` WHERE id = $9 RETURNING *`;
      queryParams.push(id);
    }

    const result = await pool.query(updateQuery, queryParams);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Data source not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating data source:", error);
    res.status(500).json({ error: "Failed to update data source" });
  }
};

exports.deleteDataSource = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM data_sources WHERE id = $1", [id]);
    res.json({ success: true, message: "Data source deleted" });
  } catch (error) {
    console.error("Error deleting data source:", error);
    res.status(500).json({ error: "Failed to delete data source" });
  }
};

exports.testConnection = async (req, res) => {
  try {
    // Simulated connection test based on body parameters
    const { base_url, api_key } = req.body;
    
    // Artificial latency
    const latency = Math.floor(Math.random() * 500) + 50;
    await new Promise(resolve => setTimeout(resolve, latency));

    if (base_url && base_url.includes("fail")) {
      return res.json({ status: "Host Unreachable", response_time: latency });
    }
    
    if (api_key === "invalid") {
      return res.json({ status: "Authentication Failed", response_time: latency });
    }

    res.json({ status: "Connected", response_time: latency });
  } catch (error) {
    console.error("Error testing connection:", error);
    res.status(500).json({ status: "Error", message: error.message });
  }
};

exports.syncDataSource = async (req, res) => {
  try {
    const { id } = req.params;
    // Call the collector service here. For now, simulate success.
    const dataSourceCollectorService = require("../services/dataSourceCollectorService");
    await dataSourceCollectorService.syncSingleSource(id);
    
    res.json({ success: true, message: "Sync completed" });
  } catch (error) {
    console.error("Error syncing data source:", error);
    res.status(500).json({ error: "Failed to sync data source" });
  }
};

exports.getSyncHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM sync_history WHERE source_id = $1 ORDER BY sync_time DESC LIMIT 50",
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching sync history:", error);
    res.status(500).json({ error: "Failed to fetch sync history" });
  }
};
