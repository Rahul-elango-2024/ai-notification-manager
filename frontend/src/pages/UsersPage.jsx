import { useState, useEffect, useCallback, useRef } from "react";
import { authService } from "../services/authService";
import { getCurrentUserId } from "../services/permissionService";
import "./UsersPage.css";

const API_URL = "http://localhost:5000";
const VALID_ROLES = ["Admin", "Manager", "Employee", "Viewer"];

// ==========================================
// HELPERS
// ==========================================

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(dateValue) {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function authHeaders() {
  const token = authService.getToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ==========================================
// TOAST SYSTEM
// ==========================================

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="toast-icon">
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
          </span>
          <span>{t.message}</span>
          <button className="toast-close" onClick={() => onDismiss(t.id)}>
            ×
          </button>
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

// ==========================================
// ROLE BADGE
// ==========================================

function RoleBadge({ role }) {
  const normalized = (role || "").toLowerCase();
  return (
    <span className={`role-badge ${normalized}`}>{role}</span>
  );
}

// ==========================================
// STATUS BADGE
// ==========================================

function StatusBadge({ isActive }) {
  return (
    <span className={`user-status-badge ${isActive ? "active" : "inactive"}`}>
      <span className="status-dot" />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

// ==========================================
// FIELD COMPONENT
// ==========================================

function FormField({ label, required, error, hint, children }) {
  return (
    <div className="form-field">
      <label className="form-label">
        {label}
        {required && <span className="required"> *</span>}
      </label>
      {children}
      {hint && !error && <span className="form-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

// ==========================================
// CREATE USER MODAL
// ==========================================

function CreateUserModal({ onClose, onSuccess, addToast }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    role: "Viewer",
    is_active: true,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim()) {
      e.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Enter a valid email address.";
    }
    if (!form.password) {
      e.password = "Password is required.";
    } else if (form.password.length < 8) {
      e.password = "Password must be at least 8 characters.";
    }
    if (!form.role) e.role = "Role is required.";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          email: form.email.trim(),
          department: form.department.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user.");
      addToast(`User '${data.user.name}' created successfully.`, "success");
      onSuccess();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  function onChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="create-user-title">
        <div className="modal-header">
          <div>
            <h3 id="create-user-title">Create New User</h3>
            <p>Add a new enterprise user account.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <FormField label="Full Name" required error={errors.name} className="full-width">
                <input
                  className={`form-input${errors.name ? " error" : ""}`}
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={(e) => onChange("name", e.target.value)}
                />
              </FormField>

              <FormField label="Email Address" required error={errors.email}>
                <input
                  className={`form-input${errors.email ? " error" : ""}`}
                  type="email"
                  placeholder="jane@company.com"
                  value={form.email}
                  onChange={(e) => onChange("email", e.target.value)}
                />
              </FormField>

              <FormField label="Password" required error={errors.password} hint="Minimum 8 characters">
                <input
                  className={`form-input${errors.password ? " error" : ""}`}
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => onChange("password", e.target.value)}
                />
              </FormField>

              <FormField label="Department" error={errors.department}>
                <input
                  className="form-input"
                  placeholder="Engineering"
                  value={form.department}
                  onChange={(e) => onChange("department", e.target.value)}
                />
              </FormField>

              <FormField label="Role" required error={errors.role}>
                <select
                  className={`form-select${errors.role ? " error" : ""}`}
                  value={form.role}
                  onChange={(e) => onChange("role", e.target.value)}
                >
                  {VALID_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Status">
                <select
                  className="form-select"
                  value={form.is_active ? "active" : "inactive"}
                  onChange={(e) => onChange("is_active", e.target.value === "active")}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </FormField>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// EDIT USER MODAL
// ==========================================

function EditUserModal({ user, onClose, onSuccess, addToast }) {
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    department: user.department || "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim()) {
      e.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Enter a valid email address.";
    }
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/users/${user.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          department: form.department.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user.");
      addToast(`User '${data.user.name}' updated successfully.`, "success");
      onSuccess();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  function onChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-user-title">
        <div className="modal-header">
          <div>
            <h3 id="edit-user-title">Edit User</h3>
            <p>Update account details for {user.name}.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <FormField label="Full Name" required error={errors.name} className="full-width">
                <input
                  className={`form-input${errors.name ? " error" : ""}`}
                  value={form.name}
                  onChange={(e) => onChange("name", e.target.value)}
                />
              </FormField>

              <FormField label="Email Address" required error={errors.email}>
                <input
                  className={`form-input${errors.email ? " error" : ""}`}
                  type="email"
                  value={form.email}
                  onChange={(e) => onChange("email", e.target.value)}
                />
              </FormField>

              <FormField label="Department" error={errors.department}>
                <input
                  className="form-input"
                  value={form.department}
                  onChange={(e) => onChange("department", e.target.value)}
                />
              </FormField>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// RESET PASSWORD MODAL
// ==========================================

function ResetPasswordModal({ user, onClose, addToast }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const e = {};
    if (!password) {
      e.password = "New password is required.";
    } else if (password.length < 8) {
      e.password = "Password must be at least 8 characters.";
    }
    if (password !== confirm) {
      e.confirm = "Passwords do not match.";
    }
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/users/${user.id}/password`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password.");
      addToast(`Password reset for ${user.name}.`, "success");
      onClose();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="reset-pwd-title">
        <div className="modal-header">
          <div>
            <h3 id="reset-pwd-title">Reset Password</h3>
            <p>Set a new password for {user.name}.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <FormField label="New Password" required error={errors.password} hint="Minimum 8 characters" className="full-width">
                <input
                  className={`form-input${errors.password ? " error" : ""}`}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                />
              </FormField>

              <FormField label="Confirm Password" required error={errors.confirm} className="full-width">
                <input
                  className={`form-input${errors.confirm ? " error" : ""}`}
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setErrors((prev) => ({ ...prev, confirm: undefined }));
                  }}
                />
              </FormField>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// CHANGE ROLE MODAL
// ==========================================

function ChangeRoleModal({ user, onClose, onSuccess, addToast }) {
  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);
  const currentUserId = getCurrentUserId();
  const isSelf = Number(user.id) === Number(currentUserId);

  async function handleSubmit(e) {
    e.preventDefault();
    if (role === user.role) {
      addToast("Role is unchanged.", "info");
      onClose();
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/users/${user.id}/role`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change role.");
      addToast(`Role changed to ${role} for ${user.name}.`, "success");
      onSuccess();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="change-role-title">
        <div className="modal-header">
          <div>
            <h3 id="change-role-title">Change Role</h3>
            <p>Update access level for {user.name}.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {isSelf && (
              <div className="self-warning">
                <span>⚠️</span>
                <span>You cannot change your own role. Self-modification is not permitted for security.</span>
              </div>
            )}

            <FormField label="Select New Role" required>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isSelf}
              >
                {VALID_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving || isSelf}>
              {saving ? "Changing..." : "Change Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// MAIN USERS PAGE
// ==========================================

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  // Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [roleUser, setRoleUser] = useState(null);

  const { toasts, addToast, dismissToast } = useToast();
  const currentUserId = getCurrentUserId();

  // ----------------------------------------
  // FETCH USERS
  // ----------------------------------------
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users.");
      setUsers(data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/users`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load users.");
        if (!cancelled) setUsers(data);
      } catch (err) {
        if (!cancelled) addToast(err.message, "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------
  // TOGGLE STATUS
  // ----------------------------------------
  async function toggleStatus(user) {
    const isSelf = Number(user.id) === Number(currentUserId);
    if (isSelf) {
      addToast("You cannot activate or deactivate your own account.", "error");
      return;
    }

    const action = user.is_active ? "deactivate" : "activate";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.name}?`
    );
    if (!confirmed) return;

    setActionLoading(user.id);
    try {
      const res = await fetch(`${API_URL}/api/users/${user.id}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} user.`);
      addToast(data.message, "success");
      await fetchUsers();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  }

  // ----------------------------------------
  // FILTERED USERS
  // ----------------------------------------
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  // ----------------------------------------
  // STATS
  // ----------------------------------------
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const inactiveUsers = users.filter((u) => !u.is_active).length;
  const adminCount = users.filter((u) => u.role === "Admin").length;

  return (
    <div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <div className="users-header-row">
        <div>
          <span className="eyebrow">USER MANAGEMENT</span>
          <h1 style={{ margin: "6px 0 4px", fontSize: "26px", fontWeight: 800, color: "#172033" }}>
            Enterprise Users
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#8a94a6" }}>
            Manage user accounts, roles, and access levels.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          + Create User
        </button>
      </div>

      {/* Stats */}
      <div className="users-stats">
        <div className="user-stat-card">
          <span className="user-stat-label">Total Users</span>
          <span className="user-stat-value blue">{totalUsers}</span>
        </div>
        <div className="user-stat-card">
          <span className="user-stat-label">Active</span>
          <span className="user-stat-value green">{activeUsers}</span>
        </div>
        <div className="user-stat-card">
          <span className="user-stat-label">Inactive</span>
          <span className="user-stat-value red">{inactiveUsers}</span>
        </div>
        <div className="user-stat-card">
          <span className="user-stat-label">Administrators</span>
          <span className="user-stat-value amber">{adminCount}</span>
        </div>
      </div>

      {/* Table Panel */}
      <div className="users-table-panel">
        <div className="users-table-header">
          <div>
            <h2>All Users</h2>
            <p>
              {filteredUsers.length} of {totalUsers} users
              {search ? ` matching "${search}"` : ""}
            </p>
          </div>
          <div className="users-search-row">
            <input
              className="users-search-input"
              type="text"
              placeholder="Search by name, email, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="users-loading">
            <span className="spinner" />
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="users-empty">
            <div className="users-empty-icon">◇</div>
            <h3>{search ? "No matching users" : "No users found"}</h3>
            <p>
              {search
                ? "Try adjusting your search terms."
                : "Create your first user to get started."}
            </p>
          </div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isSelf = Number(user.id) === Number(currentUserId);
                  const isLoading = actionLoading === user.id;

                  return (
                    <tr key={user.id}>
                      <td>
                        <span className="user-id">#{user.id}</span>
                      </td>

                      <td>
                        <div className="user-name-cell">
                          <div className="user-avatar">
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <div className="user-name-primary">
                              {user.name}
                              {isSelf && (
                                <span style={{ fontSize: 11, color: "#8a94a6", marginLeft: 6 }}>
                                  (You)
                                </span>
                              )}
                            </div>
                            <div className="user-email">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      <td>{user.department || <span style={{ color: "#b0bac9" }}>—</span>}</td>

                      <td>
                        <RoleBadge role={user.role} />
                      </td>

                      <td>
                        <StatusBadge isActive={user.is_active} />
                      </td>

                      <td style={{ color: "#6b7587", fontSize: 13 }}>
                        {formatDate(user.created_at)}
                      </td>

                      <td>
                        <div className="user-actions">
                          <button
                            className="btn-action btn-edit"
                            onClick={() => setEditUser(user)}
                            disabled={isLoading}
                            title="Edit user details"
                          >
                            Edit
                          </button>

                          <button
                            className={`btn-action ${user.is_active ? "btn-deactivate" : "btn-activate"}`}
                            onClick={() => toggleStatus(user)}
                            disabled={isLoading || isSelf}
                            title={isSelf ? "Cannot modify your own account" : user.is_active ? "Deactivate user" : "Activate user"}
                          >
                            {isLoading
                              ? "..."
                              : user.is_active
                              ? "Deactivate"
                              : "Activate"}
                          </button>

                          <button
                            className="btn-action btn-role"
                            onClick={() => setRoleUser(user)}
                            disabled={isLoading || isSelf}
                            title={isSelf ? "Cannot change your own role" : "Change role"}
                          >
                            Role
                          </button>

                          <button
                            className="btn-action btn-password"
                            onClick={() => setResetUser(user)}
                            disabled={isLoading}
                            title="Reset password"
                          >
                            Password
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            fetchUsers();
          }}
          addToast={addToast}
        />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSuccess={() => {
            setEditUser(null);
            fetchUsers();
          }}
          addToast={addToast}
        />
      )}

      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
          addToast={addToast}
        />
      )}

      {roleUser && (
        <ChangeRoleModal
          user={roleUser}
          onClose={() => setRoleUser(null)}
          onSuccess={() => {
            setRoleUser(null);
            fetchUsers();
          }}
          addToast={addToast}
        />
      )}
    </div>
  );
}
