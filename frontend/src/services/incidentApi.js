import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Fetch all incidents with optional query filters
 * GET /api/incidents
 * @param {Object} filters - { status, priority, assigned_to }
 */
export const fetchIncidents = async (filters = {}) => {
  try {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.assigned_to) params.assigned_to = filters.assigned_to;

    const response = await api.get("/incidents", { params });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to fetch incidents";
    throw new Error(message);
  }
};

/**
 * Fetch single incident with timeline and AI analysis
 * GET /api/incidents/:id
 * @param {number|string} id 
 */
export const fetchIncidentById = async (id) => {
  try {
    const response = await api.get(`/incidents/${id}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || `Failed to fetch incident #${id}`;
    throw new Error(message);
  }
};

/**
 * Create a new incident
 * POST /api/incidents
 * @param {Object} incidentData - { alert_id, title, description, priority, category, severity, created_by, source, tags }
 */
export const createIncident = async (incidentData) => {
  try {
    const response = await api.post("/incidents", incidentData);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to create incident";
    throw new Error(message);
  }
};

/**
 * Update existing incident
 * PUT /api/incidents/:id
 * @param {number|string} id 
 * @param {Object} updateData - { status, priority, assigned_to, description, category, severity, tags, performed_by }
 */
export const updateIncident = async (id, updateData) => {
  try {
    const response = await api.put(`/incidents/${id}`, updateData);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to update incident";
    throw new Error(message);
  }
};

/**
 * Delete an incident
 * DELETE /api/incidents/:id
 * @param {number|string} id 
 */
export const deleteIncident = async (id) => {
  try {
    const response = await api.delete(`/incidents/${id}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to delete incident";
    throw new Error(message);
  }
};

/**
 * Resolve an incident
 * POST /api/incidents/:id/resolve
 * @param {number|string} id 
 * @param {Object} resolveData - { notes, root_cause, preventive_action, performed_by }
 */
export const resolveIncident = async (id, resolveData = {}) => {
  try {
    const response = await api.post(`/incidents/${id}/resolve`, resolveData);
    return response.data;
  } catch (error) {
    // Fallback to PUT if POST returns 404 or method not allowed
    try {
      const fallbackResponse = await api.put(`/incidents/${id}/resolve`, resolveData);
      return fallbackResponse.data;
    } catch (fallbackError) {
      const message = error.response?.data?.message || error.message || "Failed to resolve incident";
      throw new Error(message);
    }
  }
};

/**
 * Fetch users list for Assignment & Creator dropdowns
 * GET /api/users
 */
export const fetchUsers = async () => {
  try {
    const response = await api.get("/users");
    const data = response.data;
    return Array.isArray(data) ? data : data.users || [];
  } catch (err) {
    console.error("Error fetching users for dropdown:", err);
    return [];
  }
};

export default api;
