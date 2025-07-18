
import axios from "axios";
import Cookies from "js-cookie";

// Create Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired/invalid token in responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid - clean up and redirect
      Cookies.remove("accessToken");
      window.location.href = "/login"; // Adjust path if your login route is different
    }
    return Promise.reject(error);
  }
);

export default api;
