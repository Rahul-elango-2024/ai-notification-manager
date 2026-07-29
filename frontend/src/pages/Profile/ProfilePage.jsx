import React, { useState, useEffect, useCallback, useRef } from "react";
import { authService } from "../../services/authService";
import "./ProfilePage.css";

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

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [recentActivity, setRecentActivity] = useState({ alerts: [], notifications: [], auditLogs: [] });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Edit Personal Info State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { toasts, addToast, dismissToast } = useToast();

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/profile`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch profile details.");
      const data = await res.json();
      setProfile(data.user);
      setRecentActivity(data.recentActivity || {});

      setFirstName(data.user.first_name || "");
      setLastName(data.user.last_name || "");
      setPhone(data.user.phone || "+1 (555) 234-5678");
      setLocation(data.user.location || "HQ - Global Operations");
      setAvatarUrl(data.user.avatar_url || "");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const res = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone,
          location,
          avatar_url: avatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile.");

      addToast("Profile details updated successfully!", "success");
      fetchProfile();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast("New password and confirm password do not match.", "error");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch(`${API_URL}/api/profile/password`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password.");

      addToast("Password changed successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading Enterprise Profile...</div>;
  }

  const fullName = `${firstName} ${lastName}`.trim() || profile?.username || "Enterprise User";

  return (
    <div className="profile-page">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Profile Header Banner */}
      <div className="profile-header-banner">
        <div className="avatar-wrapper">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="profile-avatar-img" />
          ) : (
            <div className="avatar-placeholder">
              {fullName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="header-info">
          <div className="name-role-group">
            <h1>{fullName}</h1>
            <span className={`status-badge ${(profile?.role || "").toLowerCase()}`}>
              {profile?.role}
            </span>
            <span className="status-badge normal">
              {profile?.status}
            </span>
          </div>

          <div className="header-meta-row">
            <span>📧 {profile?.email}</span>
            <span>🏢 {profile?.department || "Global Operations"}</span>
            <span>🆔 {profile?.employee_id}</span>
          </div>
        </div>
      </div>

      {/* Main Profile Grid */}
      <div className="profile-layout-grid">
        {/* Personal & Account Information Panel */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Personal & Identity Details</h2>
              <p>Update your display name, contact phone, and location.</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  className="search-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name"
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  className="search-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email Address (Read-only)</label>
                <input type="email" className="search-input" value={profile?.email || ""} disabled />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  className="search-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Department (Read-only)</label>
                <input type="text" className="search-input" value={profile?.department || "Global Operations"} disabled />
              </div>

              <div className="form-group">
                <label>Work Location</label>
                <input
                  type="text"
                  className="search-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Profile Picture URL</label>
              <input
                type="text"
                className="search-input"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-button blue" disabled={savingProfile}>
                {savingProfile ? "Saving Profile..." : "Save Profile Details"}
              </button>
            </div>
          </form>
        </div>

        {/* Security & Password Change Panel */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Security & Authentication</h2>
              <p>Manage account password and security settings.</p>
            </div>
            <span className="impact-score-tag">2FA Placeholder</span>
          </div>

          <form onSubmit={handleChangePassword} className="profile-form">
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                className="search-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                className="search-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                className="search-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="secondary-button" disabled={savingPassword}>
                {savingPassword ? "Updating..." : "Change Password"}
              </button>
            </div>
          </form>

          {/* Login Devices */}
          <div className="security-subpanel">
            <h3>Active Login Devices</h3>
            <div className="device-row">
              <div>
                <strong>Chrome 126.0 (Windows 11) — Current Session</strong>
                <span>IP: 192.168.1.100 • Last Active: Just Now</span>
              </div>
              <span className="status-badge normal">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent User Activity Feed */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Recent Account Activity</h2>
            <p>Audit log of alerts, notifications, and security events for your account.</p>
          </div>
        </div>

        <div className="activity-lists-grid">
          <div>
            <h3>Recent Active Alerts</h3>
            {recentActivity.alerts && recentActivity.alerts.length > 0 ? (
              <ul className="activity-list">
                {recentActivity.alerts.map((a) => (
                  <li key={a.id}>
                    <span className={`status-badge ${(a.status || "").toLowerCase()}`}>{a.status}</span>
                    <span>{a.message.split("\n")[0]}</span>
                    <small>{new Date(a.created_at).toLocaleString()}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-text">No active alerts.</p>
            )}
          </div>

          <div>
            <h3>Recent Security Audit Logs</h3>
            {recentActivity.auditLogs && recentActivity.auditLogs.length > 0 ? (
              <ul className="activity-list">
                {recentActivity.auditLogs.map((l) => (
                  <li key={l.id}>
                    <strong>{l.action}</strong>
                    <span>{l.description}</span>
                    <small>{new Date(l.created_at).toLocaleString()}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-text">No recent audit logs.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
