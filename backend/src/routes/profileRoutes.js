const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const profileController = require("../controllers/profileController");

// Profile routes available to all authenticated users
router.get("/profile", authMiddleware, profileController.getProfile);
router.put("/profile", authMiddleware, profileController.updateProfile);
router.put("/profile/password", authMiddleware, profileController.updatePassword);

module.exports = router;
