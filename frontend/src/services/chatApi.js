import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/chat";

export const chatApi = {
  getUsers: async () => {
    const res = await axios.get(`${API_BASE_URL}/users`);
    return res.data;
  },

  getRooms: async (userId) => {
    const res = await axios.get(`${API_BASE_URL}/rooms?user_id=${userId}`);
    return res.data;
  },

  createRoom: async (type, name, department, participantIds) => {
    const res = await axios.post(`${API_BASE_URL}/rooms`, { type, name, department, participantIds });
    return res.data;
  },

  getMessages: async (roomId) => {
    const res = await axios.get(`${API_BASE_URL}/rooms/${roomId}/messages`);
    return res.data;
  },

  sendMessage: async (roomId, messageData) => {
    const res = await axios.post(`${API_BASE_URL}/rooms/${roomId}/messages`, messageData);
    return res.data;
  },

  markAsRead: async (roomId, userId) => {
    const res = await axios.put(`${API_BASE_URL}/rooms/${roomId}/read`, { user_id: userId });
    return res.data;
  }
};
