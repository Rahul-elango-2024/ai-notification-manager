const express = require("express");
const router = express.Router();
const apiKeyAuthMiddleware = require("../middleware/apiKeyAuthMiddleware");
const rateLimitMiddleware = require("../middleware/rateLimitMiddleware");
const apiIngestController = require("../controllers/apiIngestController");

// Public secure ingestion endpoint authenticated via API Key (Bearer or x-api-key)
router.post(
  "/kpi-ingest",
  apiKeyAuthMiddleware,
  rateLimitMiddleware,
  apiIngestController.ingestKpiData
);

module.exports = router;
