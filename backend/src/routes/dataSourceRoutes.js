const express = require("express");
const router = express.Router();
const dataSourceController = require("../controllers/dataSourceController");

// CRUD operations
router.get("/", dataSourceController.getAllDataSources);
router.post("/", dataSourceController.createDataSource);
router.put("/:id", dataSourceController.updateDataSource);
router.delete("/:id", dataSourceController.deleteDataSource);

// Actions
router.post("/:id/test", dataSourceController.testConnection);
router.post("/:id/sync", dataSourceController.syncDataSource);
router.get("/:id/history", dataSourceController.getSyncHistory);

module.exports = router;
