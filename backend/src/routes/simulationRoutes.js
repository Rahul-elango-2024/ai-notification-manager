const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");
const simulationController = require("../controllers/simulationController");

// Simulation Center routes require Admin role
const guard = [authMiddleware, requireRole(["Admin"])];

router.get("/simulation/status", guard, simulationController.getStatus);
router.get("/simulation/scenarios", guard, simulationController.getScenarios);
router.post("/simulation/start", guard, simulationController.startSimulation);
router.post("/simulation/pause", guard, simulationController.pauseSimulation);
router.post("/simulation/resume", guard, simulationController.resumeSimulation);
router.post("/simulation/stop", guard, simulationController.stopSimulation);
router.post("/simulation/reset", guard, simulationController.resetSimulation);
router.get("/simulation/history", guard, simulationController.getHistory);
router.post("/simulation/settings", guard, simulationController.updateSettings);

module.exports = router;
