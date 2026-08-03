const playbookExecutionService = require("../services/playbookExecutionService");

exports.executePlaybook = async (req, res) => {
  try {
    const { recommendation } = req.body;
    const userId = req.user ? req.user.id : 1; // fallback to 1 if no user context
    
    if (!recommendation) {
      return res.status(400).json({ error: "Recommendation data is required" });
    }

    const result = await playbookExecutionService.executePlaybook(userId, recommendation);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("executePlaybook Error:", error.message);
    res.status(500).json({ error: "Failed to execute playbook." });
  }
};
