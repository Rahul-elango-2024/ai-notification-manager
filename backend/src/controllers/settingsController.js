const pool = require("../db");

const DEFAULT_SETTINGS = {
  general: {
    companyName: "Acme Enterprise Solutions",
    orgName: "Global AI Operations & Infrastructure",
    timezone: "UTC+05:30 (India Standard Time)",
    language: "English (US)",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "24-Hour (HH:mm:ss)",
  },
  appearance: {
    theme: "dark",
    accentColor: "#0284c7",
    compactLayout: false,
    sidebarCollapsed: false,
    fontSize: "medium",
  },
  notifications: {
    emailNotifications: true,
    browserNotifications: true,
    notificationSound: true,
    autoRefreshInterval: 10,
    quietHours: "22:00 - 06:00",
    desktopNotifications: true,
  },
  monitoring: {
    monitoringInterval: 60,
    kpiRefreshRate: 10,
    autoMonitoring: true,
    simulationDefaultSpeed: 10,
    alertRefresh: 5,
  },
  aiSettings: {
    aiEnabled: true,
    predictionRefresh: 300,
    riskSensitivity: "HIGH",
    recommendationLength: "200 Words (Executive Summary)",
    forecastWindow: "24 Hours / 7 Days / 30 Days",
  },
  apiHub: {
    defaultRateLimit: 1000,
    webhookRetryCount: 3,
    webhookTimeout: 10,
    apiLogging: true,
  },
  security: {
    sessionTimeout: 60,
    passwordExpiryDays: 90,
    maxLoginAttempts: 5,
    autoLogout: true,
    apiKeyExpirationDays: 365,
  },
  about: {
    appVersion: "v2.4.0-Enterprise",
    frontendVersion: "React 18 + Vite 8.1",
    backendVersion: "Node.js 20 + Express 4.19",
    databaseStatus: "PostgreSQL 16 (Connected & Healthy)",
    socketStatus: "Socket.IO (Active & Streaming)",
    aiProvider: "Google DeepMind Antigravity AI Engine",
    buildNumber: "BUILD-2026-0729",
    environment: "Production",
    license: "Enterprise Commercial License",
  },
};

exports.getSettings = async (req, res) => {
  try {
    const dbSettingsRes = await pool.query(`SELECT setting_key, setting_value FROM system_settings`);
    
    const settingsMap = { ...DEFAULT_SETTINGS };
    for (const row of dbSettingsRes.rows) {
      if (settingsMap[row.setting_key]) {
        settingsMap[row.setting_key] = { ...settingsMap[row.setting_key], ...row.setting_value };
      }
    }

    res.status(200).json(settingsMap);
  } catch (error) {
    console.error("getSettings Error:", error.message);
    res.status(500).json({ error: "Failed to fetch settings." });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id || req.user.userId;
    const { section, settings } = req.body;

    if (!section || !settings) {
      return res.status(400).json({ error: "Section and settings payload are required." });
    }

    // Role-based Access Control Enforcement
    if (userRole === "Viewer") {
      return res.status(403).json({ error: "Viewers have read-only access to settings." });
    }

    // Non-admins can only update Appearance and Notifications
    if (userRole !== "Admin" && section !== "appearance" && section !== "notifications") {
      return res.status(403).json({ error: `Users with role '${userRole}' can only update personal Appearance and Notification preferences.` });
    }

    await pool.query(
      `INSERT INTO system_settings (setting_key, setting_value, updated_by, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (setting_key)
       DO UPDATE SET setting_value = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP`,
      [section, JSON.stringify(settings), userId]
    );

    // Audit log entry for Admin updates
    if (userRole === "Admin") {
      await pool.query(
        `INSERT INTO audit_logs (admin_user_id, action, description) VALUES ($1, $2, $3)`,
        [userId, "UPDATE_SETTINGS", `Admin updated '${section}' settings.`]
      );
    }

    res.status(200).json({ message: `Settings for '${section}' updated successfully.` });
  } catch (error) {
    console.error("updateSettings Error:", error.message);
    res.status(500).json({ error: "Failed to update settings." });
  }
};
