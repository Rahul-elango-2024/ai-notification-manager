const express = require("express");
const router = express.Router();

const {
  getAllAlerts,
  getAlertById,
  getAlertDetails,
  acknowledgeAlert,
  resolveAlert,
} = require("../controllers/alertController");

router.get("/alerts", getAllAlerts);

router.get("/alerts/:id", getAlertById);

router.get("/alerts/:id/details", getAlertDetails);

router.put("/alerts/:id/acknowledge", acknowledgeAlert);

router.put("/alerts/:id/resolve", resolveAlert);

module.exports = router;