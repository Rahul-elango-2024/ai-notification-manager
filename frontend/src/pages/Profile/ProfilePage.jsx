import React, { useState, useEffect, useCallback, useRef } from "react";
import { authService } from "../../services/authService";
import "./ProfilePage.css";

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

export default function ProfilePage({ onLogout }) {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Edit Personal Info State
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [phone, setPhone] = useState("+1 (555) 234-5678");
  const [location, setLocation] = useState("HQ - Global Operations");

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { toasts, addToast, dismissToast } = useToast();

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    setFullName(user.fullName);
  }, []);

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    setSavingProfile(true);

    const updatedUser = {
      ...currentUser,
      fullName,
      avatar: fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
    };

    authService.setSession(authService.getToken() || "mock_token", updatedUser);
    setCurrentUser(updatedUser);
    setSavingProfile(false);
    addToast("Profile details updated successfully!", "success");
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast("New password and confirm password do not match.", "error");
      return;
    }

    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      addToast("Password changed successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }, 500);
  };

  return (
    <div className="profile-page">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Profile Header Banner */}
      <div className="profile-header-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="avatar-wrapper">
            <div className="avatar-placeholder">
              {currentUser.avatar}
            </div>
          </div>

          <div className="header-info">
            <div className="name-role-group">
              <h1>{currentUser.fullName}</h1>
              <span className="status-badge normal">
                {currentUser.role}
              </span>
            </div>

            <div className="header-meta-row">
              <span>Email: {currentUser.email}</span>
              <span>Department: {currentUser.department}</span>
            </div>
          </div>
        </div>
        {onLogout && (
          <button 
            className="secondary-button" 
            onClick={onLogout}
            style={{ borderColor: 'rgba(239, 68, 68, 0.5)', color: '#ef4444' }}
          >
            Logout
          </button>
        )}
      </div>

      {/* Main Profile Grid */}
      <div className="profile-layout-grid">
        {/* Personal & Account Information Panel */}
        <div className="section-card">
          <div className="section-card-header">
            <div>
              <h2 className="section-title">Personal & Identity Details</h2>
              <p className="caption-text">Manage your display name, contact details, and department assignment.</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="profile-form">
            <div className="form-group">
              <label className="caption-text">Full Display Name</label>
              <input
                type="text"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label className="caption-text">Email Address (Read-only)</label>
                <input type="email" className="form-input" value={currentUser.email} disabled />
              </div>

              <div className="form-group flex-1">
                <label className="caption-text">Role Title (Read-only)</label>
                <input type="text" className="form-input" value={currentUser.role} disabled />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label className="caption-text">Department (Read-only)</label>
                <input type="text" className="form-input" value={currentUser.department} disabled />
              </div>

              <div className="form-group flex-1">
                <label className="caption-text">Work Location</label>
                <input
                  type="text"
                  className="form-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save Profile Details"}
              </button>
            </div>
          </form>
        </div>

        {/* Security & Password Change Panel */}
        <div className="section-card">
          <div className="section-card-header">
            <div>
              <h2 className="section-title">Security & Authentication</h2>
              <p className="caption-text">Manage account password and active session settings.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="profile-form">
            <div className="form-group">
              <label className="caption-text">Current Password</label>
              <input
                type="password"
                className="form-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="caption-text">New Password</label>
              <input
                type="password"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="caption-text">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
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
        </div>
      </div>
    </div>
  );
}
