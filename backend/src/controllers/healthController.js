const pool = require("../db");

const healthCheck = async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "OK",
      server: "running",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      server: "running",
      database: "disconnected",
      error: error.message,
    });
  }
};

module.exports = {
  healthCheck,
};