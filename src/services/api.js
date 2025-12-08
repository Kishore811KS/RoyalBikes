// src/services/api.js
import axios from "axios";

// Change this if your backend is hosted elsewhere
const API_BASE_URL = "http://localhost:5000";

// Create an Axios instance for consistent configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Authentication endpoints
export const loginUser = async (credentials) => {
  try {
    const response = await api.post("/login", credentials);
    return response.data; // should contain access_token
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    throw error.response?.data || { error: "Login failed" };
  }
};

export const logoutUser = async () => {
  try {
    await api.post("/logout");
    localStorage.removeItem("access_token");
  } catch (error) {
    console.error("Logout error:", error.response?.data || error.message);
    throw error.response?.data || { error: "Logout failed" };
  }
};

export default api;