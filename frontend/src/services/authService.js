const API_URL = "http://localhost:5000/api/auth";
const PROFILE_API_URL = "http://localhost:5000/api/profile";

export const authService = {
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to log in");
      }

      return data;
    } catch (error) {
      if (error.name === "TypeError") {
        throw new Error("Network error. Please check your connection.");
      }
      throw error;
    }
  },

  verifySession: async (token) => {
    try {
      const response = await fetch(`${API_URL}/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Session invalid");
      }

      return data;
    } catch (error) {
      if (error.name === "TypeError") {
        throw new Error("Network error. Please check your connection.");
      }
      throw error;
    }
  },

  updatePassword: async (currentPassword, newPassword) => {
    const token = authService.getToken();
    if (!token) {
      throw new Error("Your session has expired. Please log in again.");
    }

    try {
      const response = await fetch(`${PROFILE_API_URL}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to update password.");
      }

      return data;
    } catch (error) {
      if (error.name === "TypeError") {
        throw new Error("Network error. Please check your connection.");
      }
      throw error;
    }
  },

  setSession: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  },

  clearSession: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getToken: () => {
    return localStorage.getItem("token");
  },

  getUser: () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getCurrentUser: () => {
    const user = authService.getUser();
    if (user && (user.fullName || user.username || user.name)) {
      return {
        id: user.id || 1,
        fullName: user.fullName || user.name || user.username || "Rahul Elango",
        email: user.email || "rahul@example.com",
        role: user.role || "CTO / Executive Admin",
        department: user.department || "IT Infrastructure",
        avatar: (user.fullName || user.name || user.username || "Rahul Elango")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        notifications: 3,
        preferences: {
          language: "English (Default)",
          timezone: "IST (GMT+05:30)",
        },
      };
    }
    return {
      id: 1,
      fullName: "Rahul Elango",
      email: "rahul@example.com",
      role: "CTO / Executive Admin",
      department: "IT Infrastructure",
      avatar: "RE",
      notifications: 3,
      preferences: {
        language: "English (Default)",
        timezone: "IST (GMT+05:30)",
      },
    };
  },

  getUserRole: () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      return user ? user.role : null;
    } catch {
      return null;
    }
  },
};
