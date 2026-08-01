const express = require("express");
const router = express.Router();

const {
  getNotificationRoutes,
  createNotificationRoute,
  toggleNotificationRoute,
  deleteNotificationRoute,
  getEscalationRules,
  createEscalationRule,
  toggleEscalationRule,
  deleteEscalationRule,
} = require("../controllers/configurationController");

// ==========================================
// NOTIFICATION ROUTES
// ==========================================

router.get(
  "/notification-routes",
  getNotificationRoutes
);

router.post(
  "/notification-routes",
  createNotificationRoute
);

router.put(
  "/notification-routes/:id/toggle",
  toggleNotificationRoute
);

router.delete(
  "/notification-routes/:id",
  deleteNotificationRoute
);

// ==========================================
// ESCALATION RULES
// ==========================================

router.get(
  "/escalation-rules",
  getEscalationRules
);

router.post(
  "/escalation-rules",
  createEscalationRule
);

router.put(
  "/escalation-rules/:id/toggle",
  toggleEscalationRule
);

router.delete(
  "/escalation-rules/:id",
  deleteEscalationRule
);

module.exports = router;