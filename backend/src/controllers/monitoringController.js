const monitoringService = require("../services/monitoringService");

exports.getMonitoringData = async (req, res) => {
  try {
    const monitoringData = await monitoringService.processMonitoring();
    res.json(monitoringData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
