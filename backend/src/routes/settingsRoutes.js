const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const settingsController = require("../controllers/settingsController");

// Settings routes guarded by authMiddleware (RBAC enforced in controller)
router.get("/settings", authMiddleware, settingsController.getSettings);
router.put("/settings", authMiddleware, settingsController.updateSettings);

module.exports = router;
