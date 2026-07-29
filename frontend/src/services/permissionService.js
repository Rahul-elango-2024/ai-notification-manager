/**
 * permissionService.js
 *
 * Enterprise Permission Service — Single Source of Truth for all RBAC logic.
 *
 * Reads the authenticated user's role from authService.getUser().role.
 * Never hardcodes role strings in components.
 *
 * Role hierarchy:
 *   Admin    — Full access to everything
 *   Manager  — KPI read, Alert manage, Notifications (no Routing, no Users)
 *   Employee — Read-only (treated internally as Viewer)
 *   Viewer   — Read-only (same as Employee)
 */

import { authService } from "./authService";

// ==========================================
// INTERNAL ROLE READER
// ==========================================

/**
 * Returns the current user's role string, or null if not authenticated.
 * @returns {string|null}
 */
export function getRole() {
  const user = authService.getUser();
  return user ? user.role : null;
}

/**
 * Returns the current user's ID, or null if not authenticated.
 * @returns {number|null}
 */
export function getCurrentUserId() {
  const user = authService.getUser();
  return user ? user.id : null;
}

// ==========================================
// ROLE PREDICATES
// ==========================================

/** @returns {boolean} */
export function isAdmin() {
  return getRole() === "Admin";
}

/** @returns {boolean} */
export function isManager() {
  return getRole() === "Manager";
}

/**
 * Employee and Viewer are treated identically as read-only users.
 * @returns {boolean}
 */
export function isViewer() {
  const role = getRole();
  return role === "Viewer" || role === "Employee";
}

// ==========================================
// FEATURE PERMISSIONS
// ==========================================

/** Admin only — can submit KPI value updates */
export function canUpdateKPIs() {
  return isAdmin();
}

/** Admin and Manager — can resolve alerts */
export function canResolveAlerts() {
  return isAdmin() || isManager();
}

/** Admin and Manager — can acknowledge alerts */
export function canAcknowledgeAlerts() {
  return isAdmin() || isManager();
}

/** Admin only — can view and configure notification routing */
export function canManageRoutes() {
  return isAdmin();
}

/** Admin only — can view the Users page */
export function canManageUsers() {
  return isAdmin();
}

/** Admin only — can create new users */
export function canCreateUsers() {
  return isAdmin();
}

/** Admin only — can edit existing users */
export function canEditUsers() {
  return isAdmin();
}

/**
 * Admin only — can soft-deactivate users.
 * Self-protection is enforced in the backend controller.
 */
export function canDeleteUsers() {
  return isAdmin();
}

/**
 * Admin only — can access the Enterprise API Integration Hub page.
 */
export function canManageApiHub() {
  return isAdmin();
}

/**
 * Admin and Manager only — can access the Predictive Analytics & Forecasting page.
 */
export function canAccessPredictiveAnalytics() {
  return isAdmin() || isManager();
}

/**
 * Admin only — can access the Simulation Center & Scenario Engine page.
 */
export function canAccessSimulationCenter() {
  return isAdmin();
}

/**
 * All authenticated users — can access Profile Center.
 */
export function canAccessProfile() {
  return true;
}

/**
 * All authenticated users — can access Settings Center.
 */
export function canAccessSettings() {
  return true;
}

// ==========================================
// DEFAULT EXPORT (convenience object)
// ==========================================

const permissionService = {
  getRole,
  getCurrentUserId,
  isAdmin,
  isManager,
  isViewer,
  canUpdateKPIs,
  canResolveAlerts,
  canAcknowledgeAlerts,
  canManageRoutes,
  canManageUsers,
  canCreateUsers,
  canEditUsers,
  canDeleteUsers,
  canManageApiHub,
  canAccessPredictiveAnalytics,
  canAccessSimulationCenter,
  canAccessProfile,
  canAccessSettings,
};

export default permissionService;
