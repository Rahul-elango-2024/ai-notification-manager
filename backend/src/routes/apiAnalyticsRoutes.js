const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");
const apiAnalyticsController = require("../controllers/apiAnalyticsController");

// All API Analytics routes are Admin-only
router.get("/api-analytics/summary", authMiddleware, requireRole(["Admin"]), apiAnalyticsController.getAnalyticsSummary);
router.get("/api-analytics/logs", authMiddleware, requireRole(["Admin"]), apiAnalyticsController.getRequestLogs);

module.exports = router;
