import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/executive";

export const executiveApi = {
  getOverview: async () => {
    const res = await axios.get(`${API_BASE_URL}/dashboard`);
    return res.data;
  },

  getActivityFeed: async () => {
    const res = await axios.get(`${API_BASE_URL}/activity-feed`);
    return res.data;
  },

  getUsers: async () => {
    const res = await axios.get(`${API_BASE_URL}/users`);
    return res.data;
  },

  getDepartments: async () => {
    const res = await axios.get(`${API_BASE_URL}/departments`);
    return res.data;
  },

  getTasks: async () => {
    const res = await axios.get(`${API_BASE_URL}/tasks`);
    return res.data;
  },

  createTask: async (taskData) => {
    const res = await axios.post(`${API_BASE_URL}/tasks`, taskData);
    return res.data;
  },

  updateTask: async (id, updateData) => {
    const res = await axios.put(`${API_BASE_URL}/tasks/${id}`, updateData);
    return res.data;
  },

  deleteTask: async (id) => {
    const res = await axios.delete(`${API_BASE_URL}/tasks/${id}`);
    return res.data;
  },

  getMessages: async () => {
    const res = await axios.get(`${API_BASE_URL}/messages`);
    return res.data;
  },

  sendMessage: async (msgData) => {
    const res = await axios.post(`${API_BASE_URL}/messages`, msgData);
    return res.data;
  },

  getApprovals: async () => {
    const res = await axios.get(`${API_BASE_URL}/approvals`);
    return res.data;
  },

  actOnApproval: async (id, actionData) => {
    const res = await axios.post(`${API_BASE_URL}/approvals/${id}/action`, actionData);
    return res.data;
  },
};
