const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

router.get("/notification-logs", notificationController.getNotificationLogs);

module.exports = router;
