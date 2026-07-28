const express = require("express");
const router = express.Router();
const kpiController = require("../controllers/kpiController");

router.get("/kpis", kpiController.getAllKpis);
router.post("/kpis/:id/readings", kpiController.addKpiReading);

module.exports = router;
