const simulationService = require("../services/simulationService");

exports.getStatus = async (req, res) => {
  try {
    const status = simulationService.getStatus();
    res.status(200).json(status);
  } catch (error) {
    console.error("getStatus Error:", error.message);
    res.status(500).json({ error: "Failed to fetch simulation status." });
  }
};

exports.getScenarios = async (req, res) => {
  try {
    const scenarios = simulationService.getScenarios();
    res.status(200).json(scenarios);
  } catch (error) {
    console.error("getScenarios Error:", error.message);
    res.status(500).json({ error: "Failed to fetch simulation scenarios." });
  }
};

exports.startSimulation = async (req, res) => {
  try {
    const { scenarioId, speedSeconds } = req.body;
    const status = await simulationService.start(scenarioId || "NORMAL", speedSeconds || 10);
    res.status(200).json({ message: "Simulation started successfully.", status });
  } catch (error) {
    console.error("startSimulation Error:", error.message);
    res.status(500).json({ error: error.message || "Failed to start simulation." });
  }
};

exports.pauseSimulation = async (req, res) => {
  try {
    const status = simulationService.pause();
    res.status(200).json({ message: "Simulation paused.", status });
  } catch (error) {
    console.error("pauseSimulation Error:", error.message);
    res.status(500).json({ error: "Failed to pause simulation." });
  }
};

exports.resumeSimulation = async (req, res) => {
  try {
    const status = simulationService.resume();
    res.status(200).json({ message: "Simulation resumed.", status });
  } catch (error) {
    console.error("resumeSimulation Error:", error.message);
    res.status(500).json({ error: "Failed to resume simulation." });
  }
};

exports.stopSimulation = async (req, res) => {
  try {
    const status = await simulationService.stop();
    res.status(200).json({ message: "Simulation stopped.", status });
  } catch (error) {
    console.error("stopSimulation Error:", error.message);
    res.status(500).json({ error: "Failed to stop simulation." });
  }
};

exports.resetSimulation = async (req, res) => {
  try {
    const status = await simulationService.reset();
    res.status(200).json({ message: "Simulation reset to initial targets.", status });
  } catch (error) {
    console.error("resetSimulation Error:", error.message);
    res.status(500).json({ error: "Failed to reset simulation." });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const history = await simulationService.getHistory(limit);
    res.status(200).json(history);
  } catch (error) {
    console.error("getHistory Error:", error.message);
    res.status(500).json({ error: "Failed to fetch simulation history." });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { speedSeconds, randomEventsEnabled } = req.body;
    if (speedSeconds !== undefined) {
      simulationService.speedSeconds = Number(speedSeconds);
    }
    if (randomEventsEnabled !== undefined) {
      simulationService.randomEventsEnabled = Boolean(randomEventsEnabled);
    }
    res.status(200).json({ message: "Simulation settings updated.", status: simulationService.getStatus() });
  } catch (error) {
    console.error("updateSettings Error:", error.message);
    res.status(500).json({ error: "Failed to update simulation settings." });
  }
};
