const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");
const userController = require("../controllers/userController");

// All user management routes are Admin-only
// Security chain: authenticateJWT → requireRole → controller

router.get("/users", authMiddleware, requireRole(["Admin"]), userController.getAllUsers);

router.get("/users/:id", authMiddleware, requireRole(["Admin"]), userController.getUserById);

router.post("/users", authMiddleware, requireRole(["Admin"]), userController.createUser);

router.put("/users/:id", authMiddleware, requireRole(["Admin"]), userController.updateUser);

router.patch("/users/:id/status", authMiddleware, requireRole(["Admin"]), userController.patchStatus);

router.patch("/users/:id/password", authMiddleware, requireRole(["Admin"]), userController.patchPassword);

router.patch("/users/:id/role", authMiddleware, requireRole(["Admin"]), userController.patchRole);

module.exports = router;
