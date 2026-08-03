const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

// User routes for chat
router.get("/chat/users", chatController.getChatUsers);

// Room routes
router.get("/chat/rooms", chatController.getUserRooms);
router.post("/chat/rooms", chatController.createRoom);
router.get("/chat/rooms/:roomId/messages", chatController.getRoomMessages);
router.post("/chat/rooms/:roomId/messages", chatController.sendMessage);
router.put("/chat/rooms/:roomId/read", chatController.markRoomAsRead);

module.exports = router;
