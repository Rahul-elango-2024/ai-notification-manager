const predictionService = require("../services/predictionService");

exports.getOverview = async (req, res) => {
  try {
    const data = await predictionService.getPredictions();
    res.status(200).json(data.overview);
  } catch (error) {
    console.error("getOverview Error:", error.message);
    res.status(500).json({ error: "Failed to retrieve predictive overview." });
  }
};

exports.getForecasts = async (req, res) => {
  try {
    const data = await predictionService.getPredictions();
    res.status(200).json(data.forecasts);
  } catch (error) {
    console.error("getForecasts Error:", error.message);
    res.status(500).json({ error: "Failed to retrieve forecast data." });
  }
};

exports.getRiskPredictions = async (req, res) => {
  try {
    const data = await predictionService.getPredictions();
    res.status(200).json({
      overallRiskScore: data.overview.overallRiskScore,
      overallRiskLevel: data.overview.overallRiskLevel,
      departmentRisks: data.departmentRisks,
    });
  } catch (error) {
    console.error("getRiskPredictions Error:", error.message);
    res.status(500).json({ error: "Failed to retrieve risk predictions." });
  }
};

exports.getAnomalies = async (req, res) => {
  try {
    const data = await predictionService.getPredictions();
    res.status(200).json(data.anomalies);
  } catch (error) {
    console.error("getAnomalies Error:", error.message);
    res.status(500).json({ error: "Failed to retrieve anomaly predictions." });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const data = await predictionService.getPredictions();
    res.status(200).json(data.recommendations);
  } catch (error) {
    console.error("getRecommendations Error:", error.message);
    res.status(500).json({ error: "Failed to retrieve AI recommendations." });
  }
};

exports.getPredictionHistory = async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const history = await predictionService.getPredictionHistory(limit);
    res.status(200).json(history);
  } catch (error) {
    console.error("getPredictionHistory Error:", error.message);
    res.status(500).json({ error: "Failed to retrieve prediction history." });
  }
};
