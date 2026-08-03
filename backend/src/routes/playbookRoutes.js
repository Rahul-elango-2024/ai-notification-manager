const express = require("express");
const router = express.Router();
const playbookController = require("../controllers/playbookController");
const authMiddleware = require("../middleware/authMiddleware");

// Use auth middleware
router.use(authMiddleware);

router.post("/execute", playbookController.executePlaybook);

module.exports = router;
