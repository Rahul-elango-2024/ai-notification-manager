const webhookService = require("../services/webhookService");

exports.getAllWebhooks = async (req, res) => {
  try {
    const webhooks = await webhookService.getAllWebhooks();
    res.status(200).json(webhooks);
  } catch (error) {
    console.error("getAllWebhooks Error:", error.message);
    res.status(500).json({ error: "Failed to retrieve webhooks." });
  }
};

exports.createWebhook = async (req, res) => {
  try {
    const { name, target_url, secret_header, events, department_id } = req.body;
    const adminUserId = req.user.id;

    const webhook = await webhookService.createWebhook({
      name,
      target_url,
      secret_header,
      events,
      department_id: department_id ? Number(department_id) : null,
      created_by: adminUserId,
    });

    res.status(201).json({ message: "Webhook created successfully.", webhook });
  } catch (error) {
    console.error("createWebhook Error:", error.message);
    res.status(error.status || 500).json({ error: error.message || "Failed to create webhook." });
  }
};

exports.updateWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user.id;

    const updated = await webhookService.updateWebhook(id, req.body, adminUserId);
    res.status(200).json({ message: "Webhook updated successfully.", webhook: updated });
  } catch (error) {
    console.error("updateWebhook Error:", error.message);
    res.status(error.status || 500).json({ error: error.message || "Failed to update webhook." });
  }
};

exports.toggleWebhookStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user.id;

    const toggled = await webhookService.toggleWebhookStatus(id, adminUserId);
    res.status(200).json({ message: "Webhook status toggled successfully.", webhook: toggled });
  } catch (error) {
    console.error("toggleWebhookStatus Error:", error.message);
    res.status(error.status || 500).json({ error: error.message || "Failed to toggle webhook status." });
  }
};

exports.deleteWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user.id;

    await webhookService.deleteWebhook(id, adminUserId);
    res.status(200).json({ message: "Webhook deleted successfully." });
  } catch (error) {
    console.error("deleteWebhook Error:", error.message);
    res.status(error.status || 500).json({ error: error.message || "Failed to delete webhook." });
  }
};

exports.getWebhookLogs = async (req, res) => {
  try {
    const logs = await webhookService.getWebhookLogs(100);
    res.status(200).json(logs);
  } catch (error) {
    console.error("getWebhookLogs Error:", error.message);
    res.status(500).json({ error: "Failed to retrieve webhook logs." });
  }
};
