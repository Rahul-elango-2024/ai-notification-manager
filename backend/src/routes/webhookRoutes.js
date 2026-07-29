const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");
const webhookController = require("../controllers/webhookController");

// All Webhook routes are Admin-only
router.get("/webhooks", authMiddleware, requireRole(["Admin"]), webhookController.getAllWebhooks);
router.post("/webhooks", authMiddleware, requireRole(["Admin"]), webhookController.createWebhook);
router.put("/webhooks/:id", authMiddleware, requireRole(["Admin"]), webhookController.updateWebhook);
router.patch("/webhooks/:id/status", authMiddleware, requireRole(["Admin"]), webhookController.toggleWebhookStatus);
router.delete("/webhooks/:id", authMiddleware, requireRole(["Admin"]), webhookController.deleteWebhook);
router.get("/webhook-logs", authMiddleware, requireRole(["Admin"]), webhookController.getWebhookLogs);

module.exports = router;
