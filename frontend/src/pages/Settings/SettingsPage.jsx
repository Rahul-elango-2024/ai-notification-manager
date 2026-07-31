import React, { useState, useEffect, useCallback, useRef } from "react";
import { authService } from "../../services/authService";
import { getRole } from "../../services/permissionService";
import { useTheme } from "../../context/ThemeContext";
import "./SettingsPage.css";

const API_URL = "http://localhost:5000";

function authHeaders() {
  const token = authService.getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Toast System
function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="toast-icon">
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
          </span>
          <span>{t.message}</span>
          <button className="toast-close" onClick={() => onDismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const addToast = useCallback((message, type = "info") => {
    counterRef.current += 1;
    const id = counterRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general"); // general | appearance | notifications | monitoring | aiSettings | apiHub | security | about
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { applyTheme } = useTheme();
  const { toasts, addToast, dismissToast } = useToast();
  const userRole = getRole() || authService.getUserRole() || "Viewer";
  const isAdmin = userRole === "Admin";
  const isReadOnly = userRole === "Viewer";
  const canEditTab = (tab) => {
    if (isReadOnly) return false;
    if (isAdmin) return true;
    return tab === "appearance" || tab === "notifications";
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/settings`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch application settings.");
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSection = async (sectionKey, sectionPayload) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ section: sectionKey, settings: sectionPayload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings.");

      if (sectionKey === "appearance") {
        applyTheme(sectionPayload.theme, sectionPayload.accentColor, sectionPayload.compactLayout);
      }

      addToast(`Settings for '${sectionKey}' updated successfully!`, "success");
      fetchSettings();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading Enterprise Settings...</div>;
  }

  return (
    <div className="settings-page">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <span className="eyebrow">ENTERPRISE SYSTEM CONFIGURATION</span>
          <h1>System & User Settings</h1>
          <p>Manage application preferences, appearance themes, notification channels, AI rules, and security policies.</p>
        </div>

        <button className="secondary-button" onClick={fetchSettings}>
          ↻ Refresh Settings
        </button>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="hub-tabs-header">
        <button className={`hub-tab-button ${activeTab === "general" ? "active" : ""}`} onClick={() => setActiveTab("general")}>
          <span className="tab-icon">🌐</span> General
        </button>
        <button className={`hub-tab-button ${activeTab === "appearance" ? "active" : ""}`} onClick={() => setActiveTab("appearance")}>
          <span className="tab-icon">🎨</span> Appearance
        </button>
        <button className={`hub-tab-button ${activeTab === "notifications" ? "active" : ""}`} onClick={() => setActiveTab("notifications")}>
          <span className="tab-icon">✉</span> Notifications
        </button>
        <button className={`hub-tab-button ${activeTab === "monitoring" ? "active" : ""}`} onClick={() => setActiveTab("monitoring")}>
          <span className="tab-icon">📊</span> Monitoring
        </button>
        <button className={`hub-tab-button ${activeTab === "aiSettings" ? "active" : ""}`} onClick={() => setActiveTab("aiSettings")}>
          <span className="tab-icon">🤖</span> AI Settings
        </button>
        <button className={`hub-tab-button ${activeTab === "apiHub" ? "active" : ""}`} onClick={() => setActiveTab("apiHub")}>
          <span className="tab-icon">🔌</span> API Hub
        </button>
        <button className={`hub-tab-button ${activeTab === "security" ? "active" : ""}`} onClick={() => setActiveTab("security")}>
          <span className="tab-icon">🔒</span> Security
        </button>
        <button className={`hub-tab-button ${activeTab === "about" ? "active" : ""}`} onClick={() => setActiveTab("about")}>
          <span className="tab-icon">ℹ</span> About
        </button>
      </div>

      {/* Tab Body */}
      <div className="hub-tab-body">
        {/* General Tab */}
        {activeTab === "general" && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>General System Preferences</h2>
                <p>Global organizational identity, timezone, and locale formatting.</p>
              </div>
              {!canEditTab("general") && <span className="status-badge normal">READ ONLY</span>}
            </div>

            <div className="settings-form">
              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  className="search-input"
                  value={settings?.general?.companyName || ""}
                  disabled={!canEditTab("general")}
                  onChange={(e) => setSettings({ ...settings, general: { ...settings.general, companyName: e.target.value } })}
                />
              </div>

              <div className="form-group">
                <label>Organization Unit</label>
                <input
                  type="text"
                  className="search-input"
                  value={settings?.general?.orgName || ""}
                  disabled={!canEditTab("general")}
                  onChange={(e) => setSettings({ ...settings, general: { ...settings.general, orgName: e.target.value } })}
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="caption-text">Timezone</label>
                  <select
                    className="form-select"
                    value={settings?.general?.timezone || "IST (GMT+05:30)"}
                    disabled={!canEditTab("general")}
                    onChange={(e) => setSettings({ ...settings, general: { ...settings.general, timezone: e.target.value } })}
                  >
                    <option value="UTC (GMT+00:00)">UTC (GMT+00:00)</option>
                    <option value="EST (GMT-05:00)">EST (GMT-05:00)</option>
                    <option value="PST (GMT-08:00)">PST (GMT-08:00)</option>
                    <option value="IST (GMT+05:30)">IST (GMT+05:30)</option>
                    <option value="CET (GMT+01:00)">CET (GMT+01:00)</option>
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label className="caption-text">Language</label>
                  <select
                    className="form-select"
                    value={settings?.general?.language || "English (Default)"}
                    disabled={!canEditTab("general")}
                    onChange={(e) => setSettings({ ...settings, general: { ...settings.general, language: e.target.value } })}
                  >
                    <option value="English (Default)">English (Default)</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Spanish">Spanish</option>
                  </select>
                </div>
              </div>

              {canEditTab("general") && (
                <div className="form-actions">
                  <button className="primary-button blue" disabled={saving} onClick={() => handleSaveSection("general", settings.general)}>
                    {saving ? "Saving..." : "Save General Settings"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === "appearance" && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Appearance & UI Theme</h2>
                <p>Customize UI color mode, accent colors, and layout density.</p>
              </div>
            </div>

            <div className="settings-form">
              <div className="form-group">
                <label>Theme Mode</label>
                <select
                  className="filter-select"
                  value={settings?.appearance?.theme || "dark"}
                  onChange={(e) => setSettings({ ...settings, appearance: { ...settings.appearance, theme: e.target.value } })}
                >
                  <option value="dark">Dark Theme (Default Enterprise)</option>
                  <option value="light">Light Theme</option>
                  <option value="system">System Preference (Auto)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Accent Color</label>
                <select
                  className="filter-select"
                  value={settings?.appearance?.accentColor || "#0284c7"}
                  onChange={(e) => setSettings({ ...settings, appearance: { ...settings.appearance, accentColor: e.target.value } })}
                >
                  <option value="#0284c7">Sky Blue (Default Azure)</option>
                  <option value="#10b981">Emerald Green</option>
                  <option value="#8b5cf6">Purple Neon</option>
                  <option value="#f59e0b">Amber Orange</option>
                  <option value="#ef4444">Crimson Red</option>
                  <option value="#64748b">Slate Gray</option>
                </select>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings?.appearance?.compactLayout || false}
                    onChange={(e) => setSettings({ ...settings, appearance: { ...settings.appearance, compactLayout: e.target.checked } })}
                  />
                  <span>Enable Compact Dashboard Cards Layout</span>
                </label>
              </div>

              {canEditTab("appearance") && (
                <div className="form-actions">
                  <button className="primary-button blue" disabled={saving} onClick={() => handleSaveSection("appearance", settings.appearance)}>
                    {saving ? "Saving..." : "Save Appearance Settings"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Notification Preferences</h2>
                <p>Configure alerts, email dispatch, sound effects, and auto-refresh.</p>
              </div>
            </div>

            <div className="settings-form">
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings?.notifications?.emailNotifications ?? true}
                    onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, emailNotifications: e.target.checked } })}
                  />
                  <span>Enable Email Notifications for Critical & Warning Alerts</span>
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings?.notifications?.browserNotifications ?? true}
                    onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, browserNotifications: e.target.checked } })}
                  />
                  <span>Enable Real-Time Browser Pop-up Notifications</span>
                </label>
              </div>

              <div className="form-group">
                <label>Auto-Refresh Interval (Seconds)</label>
                <input
                  type="number"
                  className="search-input"
                  value={settings?.notifications?.autoRefreshInterval || 10}
                  onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, autoRefreshInterval: Number(e.target.value) } })}
                />
              </div>

              {canEditTab("notifications") && (
                <div className="form-actions">
                  <button className="primary-button blue" disabled={saving} onClick={() => handleSaveSection("notifications", settings.notifications)}>
                    {saving ? "Saving..." : "Save Notification Preferences"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === "monitoring" && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Monitoring Engine Parameters</h2>
                <p>Configure threshold evaluation timers and polling frequencies.</p>
              </div>
              {!canEditTab("monitoring") && <span className="status-badge normal">READ ONLY</span>}
            </div>

            <div className="settings-form">
              <div className="form-group">
                <label>Monitoring Engine Check Interval (Seconds)</label>
                <input
                  type="number"
                  className="search-input"
                  value={settings?.monitoring?.monitoringInterval || 60}
                  disabled={!canEditTab("monitoring")}
                  onChange={(e) => setSettings({ ...settings, monitoring: { ...settings.monitoring, monitoringInterval: Number(e.target.value) } })}
                />
              </div>

              {canEditTab("monitoring") && (
                <div className="form-actions">
                  <button className="primary-button blue" disabled={saving} onClick={() => handleSaveSection("monitoring", settings.monitoring)}>
                    {saving ? "Saving..." : "Save Monitoring Settings"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Settings Tab */}
        {activeTab === "aiSettings" && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>AI Analysis & Risk Settings</h2>
                <p>Configure automated AI risk assessment sensitivity and model options.</p>
              </div>
              {!canEditTab("aiSettings") && <span className="status-badge normal">READ ONLY</span>}
            </div>

            <div className="settings-form">
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings?.aiSettings?.aiEnabled ?? true}
                    disabled={!canEditTab("aiSettings")}
                    onChange={(e) => setSettings({ ...settings, aiSettings: { ...settings.aiSettings, aiEnabled: e.target.checked } })}
                  />
                  <span>Enable Automated AI Risk Analysis & Executive Recommendations</span>
                </label>
              </div>

              {canEditTab("aiSettings") && (
                <div className="form-actions">
                  <button className="primary-button blue" disabled={saving} onClick={() => handleSaveSection("aiSettings", settings.aiSettings)}>
                    {saving ? "Saving..." : "Save AI Settings"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* API Hub Tab */}
        {activeTab === "apiHub" && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>API Integration Hub Settings</h2>
                <p>Configure default rate limits and webhook timeout retries.</p>
              </div>
              {!canEditTab("apiHub") && <span className="status-badge normal">READ ONLY</span>}
            </div>

            <div className="settings-form">
              <div className="form-group">
                <label>Default Rate Limit (Requests / Hour / API Key)</label>
                <input
                  type="number"
                  className="search-input"
                  value={settings?.apiHub?.defaultRateLimit || 1000}
                  disabled={!canEditTab("apiHub")}
                  onChange={(e) => setSettings({ ...settings, apiHub: { ...settings.apiHub, defaultRateLimit: Number(e.target.value) } })}
                />
              </div>

              {canEditTab("apiHub") && (
                <div className="form-actions">
                  <button className="primary-button blue" disabled={saving} onClick={() => handleSaveSection("apiHub", settings.apiHub)}>
                    {saving ? "Saving..." : "Save API Hub Settings"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Enterprise Security Policies</h2>
                <p>Session timeout, password expiry, and login attempt limits.</p>
              </div>
              {!canEditTab("security") && <span className="status-badge normal">READ ONLY</span>}
            </div>

            <div className="settings-form">
              <div className="form-group">
                <label>Session Timeout (Minutes)</label>
                <input
                  type="number"
                  className="search-input"
                  value={settings?.security?.sessionTimeout || 60}
                  disabled={!canEditTab("security")}
                  onChange={(e) => setSettings({ ...settings, security: { ...settings.security, sessionTimeout: Number(e.target.value) } })}
                />
              </div>

              {canEditTab("security") && (
                <div className="form-actions">
                  <button className="primary-button blue" disabled={saving} onClick={() => handleSaveSection("security", settings.security)}>
                    {saving ? "Saving..." : "Save Security Policies"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* About Tab */}
        {activeTab === "about" && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>System Diagnostics & About Application</h2>
                <p>Enterprise platform version, build number, and connection status.</p>
              </div>
              <span className="active-badge">HEALTHY</span>
            </div>

            <div className="about-grid">
              <div className="about-item">
                <span>Application Version</span>
                <strong>{settings?.about?.appVersion}</strong>
              </div>
              <div className="about-item">
                <span>Frontend Framework</span>
                <strong>{settings?.about?.frontendVersion}</strong>
              </div>
              <div className="about-item">
                <span>Backend Framework</span>
                <strong>{settings?.about?.backendVersion}</strong>
              </div>
              <div className="about-item">
                <span>Database Engine</span>
                <strong>{settings?.about?.databaseStatus}</strong>
              </div>
              <div className="about-item">
                <span>Real-Time Events</span>
                <strong>{settings?.about?.socketStatus}</strong>
              </div>
              <div className="about-item">
                <span>AI Provider</span>
                <strong>{settings?.about?.aiProvider}</strong>
              </div>
              <div className="about-item">
                <span>Build Number</span>
                <strong>{settings?.about?.buildNumber}</strong>
              </div>
              <div className="about-item">
                <span>Environment</span>
                <strong>{settings?.about?.environment}</strong>
              </div>
              <div className="about-item">
                <span>Licensing</span>
                <strong>{settings?.about?.license}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
