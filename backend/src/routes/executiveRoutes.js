const express = require("express");
const router = express.Router();
const executiveController = require("../controllers/executiveController");

router.get("/dashboard", executiveController.getDashboardOverview);
router.get("/activity-feed", executiveController.getActivityFeed);
router.get("/users", executiveController.getUsers);
router.get("/departments", executiveController.getDepartments);
router.get("/tasks", executiveController.getTasks);
router.post("/tasks", executiveController.createTask);
router.put("/tasks/:id", executiveController.updateTask);
router.delete("/tasks/:id", executiveController.deleteTask);
router.get("/messages", executiveController.getMessages);
router.post("/messages", executiveController.sendMessage);
router.get("/approvals", executiveController.getApprovals);
router.post("/approvals/:id/action", executiveController.actOnApproval);

module.exports = router;
