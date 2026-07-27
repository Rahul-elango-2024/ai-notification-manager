const express = require("express");
const router = express.Router();

const {
  getNotificationRoutes,
  getEscalationRules,
} = require("../controllers/configurationController");

// ==========================================
// NOTIFICATION ROUTES
// ==========================================

router.get(
  "/notification-routes",
  getNotificationRoutes
);

// ==========================================
// ESCALATION RULES
// ==========================================

router.get(
  "/escalation-rules",
  getEscalationRules
);

module.exports = router;