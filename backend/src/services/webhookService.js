const pool = require("../db");

async function writeAuditLog({ adminUserId, action, description }) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (admin_user_id, action, description)
       VALUES ($1, $2, $3)`,
      [adminUserId, action, description]
    );
  } catch (err) {
    console.error("⚠️ Audit log write failed:", err.message);
  }
}

class WebhookService {
  async getAllWebhooks() {
    const result = await pool.query(`
      SELECT 
        w.id,
        w.name,
        w.target_url,
        w.secret_header,
        w.events,
        w.department_id,
        d.name AS department_name,
        w.is_active,
        w.created_by,
        u.name AS creator_name,
        w.created_at,
        w.updated_at
      FROM webhooks w
      LEFT JOIN departments d ON w.department_id = d.id
      LEFT JOIN users u ON w.created_by = u.id
      ORDER BY w.created_at DESC
    `);
    return result.rows;
  }

  async createWebhook({ name, target_url, secret_header, events, department_id, created_by }) {
    if (!name || !target_url || !events || !Array.isArray(events) || events.length === 0) {
      const err = new Error("Name, target_url, and at least one event type are required.");
      err.status = 400;
      throw err;
    }

    const result = await pool.query(
      `INSERT INTO webhooks (name, target_url, secret_header, events, department_id, created_by)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6)
       RETURNING *`,
      [
        name.trim(),
        target_url.trim(),
        secret_header ? secret_header.trim() : null,
        JSON.stringify(events),
        department_id || null,
        created_by || null,
      ]
    );

    const newWebhook = result.rows[0];

    await writeAuditLog({
      adminUserId: created_by,
      action: "CREATE_WEBHOOK",
      description: `Created Webhook '${newWebhook.name}' (#${newWebhook.id}) targeting '${newWebhook.target_url}'`,
    });

    return newWebhook;
  }

  async updateWebhook(id, { name, target_url, secret_header, events, department_id }, adminUserId) {
    const existing = await pool.query("SELECT * FROM webhooks WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      const err = new Error("Webhook not found.");
      err.status = 404;
      throw err;
    }

    const updatedName = name ? name.trim() : existing.rows[0].name;
    const updatedUrl = target_url ? target_url.trim() : existing.rows[0].target_url;
    const updatedSecret = secret_header !== undefined ? (secret_header ? secret_header.trim() : null) : existing.rows[0].secret_header;
    const updatedEvents = events && Array.isArray(events) ? JSON.stringify(events) : existing.rows[0].events;
    const updatedDept = department_id !== undefined ? department_id : existing.rows[0].department_id;

    const result = await pool.query(
      `UPDATE webhooks
       SET name = $1, target_url = $2, secret_header = $3, events = $4::jsonb, department_id = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [updatedName, updatedUrl, updatedSecret, updatedEvents, updatedDept, id]
    );

    await writeAuditLog({
      adminUserId,
      action: "EDIT_WEBHOOK",
      description: `Updated Webhook '${updatedName}' (#${id})`,
    });

    return result.rows[0];
  }

  async toggleWebhookStatus(id, adminUserId) {
    const existing = await pool.query("SELECT id, name, is_active FROM webhooks WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      const err = new Error("Webhook not found.");
      err.status = 404;
      throw err;
    }

    const newStatus = !existing.rows[0].is_active;

    const result = await pool.query(
      `UPDATE webhooks SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [newStatus, id]
    );

    await writeAuditLog({
      adminUserId,
      action: newStatus ? "ENABLE_WEBHOOK" : "DISABLE_WEBHOOK",
      description: `Toggled status of Webhook '${existing.rows[0].name}' (#${id}) to ${newStatus ? "ACTIVE" : "INACTIVE"}`,
    });

    return result.rows[0];
  }

  async deleteWebhook(id, adminUserId) {
    const existing = await pool.query("SELECT id, name FROM webhooks WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      const err = new Error("Webhook not found.");
      err.status = 404;
      throw err;
    }

    await pool.query("DELETE FROM webhooks WHERE id = $1", [id]);

    await writeAuditLog({
      adminUserId,
      action: "DELETE_WEBHOOK",
      description: `Deleted Webhook '${existing.rows[0].name}' (#${id})`,
    });

    return true;
  }

  async getWebhookLogs(limit = 50) {
    const result = await pool.query(
      `SELECT 
        l.id,
        l.webhook_id,
        w.name AS webhook_name,
        w.target_url,
        l.event_type,
        l.payload,
        l.response_status,
        l.response_body,
        l.latency_ms,
        l.status,
        l.attempt_count,
        l.error_message,
        l.created_at
       FROM webhook_logs l
       LEFT JOIN webhooks w ON l.webhook_id = w.id
       ORDER BY l.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Dispatch webhook payloads asynchronously to subscribed target URLs.
   */
  async triggerWebhooks(eventType, payload) {
    try {
      const result = await pool.query(
        `SELECT id, name, target_url, secret_header, department_id 
         FROM webhooks 
         WHERE is_active = TRUE 
           AND events::jsonb @> $1::jsonb`,
        [JSON.stringify([eventType])]
      );

      const subscribers = result.rows;
      if (subscribers.length === 0) return;

      for (const webhook of subscribers) {
        // Filter by department if specified on the webhook
        if (webhook.department_id && payload.department_id && Number(webhook.department_id) !== Number(payload.department_id)) {
          continue;
        }

        this.dispatchSingleWebhook(webhook, eventType, payload).catch((err) =>
          console.error(`Webhook delivery error for #${webhook.id}:`, err.message)
        );
      }
    } catch (err) {
      console.error("Error fetching webhook subscribers:", err.message);
    }
  }

  async dispatchSingleWebhook(webhook, eventType, payload) {
    const startTime = Date.now();
    const bodyString = JSON.stringify({
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    const headers = {
      "Content-Type": "application/json",
      "X-Webhook-Event": eventType,
      "User-Agent": "AI-Notification-Manager-Webhook/1.0",
    };

    if (webhook.secret_header) {
      headers["X-Webhook-Secret"] = webhook.secret_header;
    }

    let status = "FAILED";
    let responseStatus = null;
    let responseBody = null;
    let errorMessage = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(webhook.target_url, {
        method: "POST",
        headers,
        body: bodyString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      responseStatus = response.status;
      const text = await response.text();
      responseBody = text.slice(0, 1000); // Limit payload stored in log

      if (response.ok) {
        status = "SUCCESS";
      } else {
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }
    } catch (err) {
      errorMessage = err.name === "AbortError" ? "Request timeout (10s)" : err.message;
    }

    const latencyMs = Date.now() - startTime;

    await pool.query(
      `INSERT INTO webhook_logs (
        webhook_id, event_type, payload, response_status, response_body, latency_ms, status, error_message
      ) VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8)`,
      [
        webhook.id,
        eventType,
        JSON.stringify(payload),
        responseStatus,
        responseBody,
        latencyMs,
        status,
        errorMessage,
      ]
    );
  }
}

module.exports = new WebhookService();
