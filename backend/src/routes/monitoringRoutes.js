const express = require("express");
const router = express.Router();
const monitoringController = require("../controllers/monitoringController");

router.get("/monitoring", monitoringController.getMonitoringData);

module.exports = router;
