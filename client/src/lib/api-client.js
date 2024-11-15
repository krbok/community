import axios from "axios";
import Cookies from "js-cookie";
import { HOST } from "./constants";

const apiClient = axios.create({
  baseURL: HOST,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get("access-token");
    
    if (token && !config.url.includes("/login") && !config.url.includes("/signup")) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error("Response error:", {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      message: error.message
    });

    if (error.response?.status === 401) {
      Cookies.remove("access-token");
      window.location.href = "/auth";
    }

    return Promise.reject(error);
  }
);

export default apiClient;
