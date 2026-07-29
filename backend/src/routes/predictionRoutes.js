const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");
const predictionController = require("../controllers/predictionController");

// Predictive Analytics routes require Admin or Manager role
const guard = [authMiddleware, requireRole(["Admin", "Manager"])];

router.get("/predictions/overview", guard, predictionController.getOverview);
router.get("/predictions/forecast", guard, predictionController.getForecasts);
router.get("/predictions/risk", guard, predictionController.getRiskPredictions);
router.get("/predictions/anomalies", guard, predictionController.getAnomalies);
router.get("/predictions/recommendations", guard, predictionController.getRecommendations);
router.get("/predictions/history", guard, predictionController.getPredictionHistory);

module.exports = router;
