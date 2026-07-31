const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");
const apiKeyController = require("../controllers/apiKeyController");

// All API Key management routes are Admin-only
router.get("/api-keys", authMiddleware, requireRole(["Admin"]), apiKeyController.getAllApiKeys);
router.post("/api-keys", authMiddleware, requireRole(["Admin"]), apiKeyController.createApiKey);
router.post("/api-keys/:id/rotate", authMiddleware, requireRole(["Admin"]), apiKeyController.rotateApiKey);
router.patch("/api-keys/:id/status", authMiddleware, requireRole(["Admin"]), apiKeyController.updateKeyStatus);
router.post("/api-keys/:id/revoke", authMiddleware, requireRole(["Admin"]), apiKeyController.revokeApiKey);
router.delete("/api-keys/:id", authMiddleware, requireRole(["Admin"]), apiKeyController.deleteApiKey);

module.exports = router;
