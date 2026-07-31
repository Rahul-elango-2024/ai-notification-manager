const express = require("express");
const router = express.Router();
const { processAiChat } = require("../services/aiService");

// POST /api/ai/chat
router.post("/ai/chat", async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const result = await processAiChat({ message, conversationHistory });
    res.json(result);
  } catch (err) {
    console.error("AI Assistant error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
