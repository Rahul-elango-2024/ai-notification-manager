const apiKeyService = require("../services/apiKeyService");

exports.getAllApiKeys = async (req, res) => {
  try {
    const keys = await apiKeyService.getAllApiKeys();
    res.status(200).json(keys);
  } catch (error) {
    console.error("getAllApiKeys Error:", error.message);
    res.status(500).json({ error: "Failed to retrieve API keys." });
  }
};

exports.createApiKey = async (req, res) => {
  try {
    const { key_name, department_id, owner_name, description, expires_at } = req.body;
    const adminUserId = req.user.id;

    if (!key_name || typeof key_name !== "string" || !key_name.trim()) {
      return res.status(400).json({ error: "key_name is required." });
    }

    const result = await apiKeyService.createApiKey({
      key_name: key_name.trim(),
      department_id: department_id ? Number(department_id) : null,
      created_by: adminUserId,
      owner_name,
      description,
      expires_at: expires_at || null,
    });

    console.log(`✅ API Key created by Admin #${adminUserId}: ${result.key.key_name}`);

    res.status(201).json({
      message: "API Key created successfully. Save this key immediately as it will not be shown again.",
      key: result.key,
      plainTextKey: result.plainTextKey,
    });
  } catch (error) {
    console.error("createApiKey Error:", error.message);
    res.status(500).json({ error: "Failed to create API key." });
  }
};

exports.rotateApiKey = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user.id;

    const result = await apiKeyService.rotateApiKey(id, adminUserId);

    res.status(200).json({
      message: "API Key rotated successfully. Update your application with the new key.",
      key: result.key,
      plainTextKey: result.plainTextKey,
    });
  } catch (error) {
    console.error("rotateApiKey Error:", error.message);
    res.status(error.status || 500).json({ error: error.message || "Failed to rotate API key." });
  }
};

exports.updateKeyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminUserId = req.user.id;

    if (!status) {
      return res.status(400).json({ error: "Status is required." });
    }

    const updated = await apiKeyService.updateKeyStatus(id, status, adminUserId);
    res.status(200).json({ message: `API Key status updated to '${status}'.`, key: updated });
  } catch (error) {
    console.error("updateKeyStatus Error:", error.message);
    res.status(error.status || 500).json({ error: error.message || "Failed to update API key status." });
  }
};

exports.revokeApiKey = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user.id;

    const revoked = await apiKeyService.revokeApiKey(id, adminUserId);
    res.status(200).json({ message: "API Key revoked successfully.", key: revoked });
  } catch (error) {
    console.error("revokeApiKey Error:", error.message);
    res.status(error.status || 500).json({ error: error.message || "Failed to revoke API key." });
  }
};

exports.deleteApiKey = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user.id;

    const deleted = await apiKeyService.deleteApiKey(id, adminUserId);
    res.status(200).json({ message: "API Key deleted successfully.", deleted });
  } catch (error) {
    console.error("deleteApiKey Error:", error.message);
    res.status(error.status || 500).json({ error: error.message || "Failed to delete API key." });
  }
};
