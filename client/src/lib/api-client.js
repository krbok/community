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
    
    // Add token to auth header except for login/signup routes
    if (token && 
        !config.url.includes("/login") && 
        !config.url.includes("/signup")
    ) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CORS headers
    config.headers['Access-Control-Allow-Origin'] = '*';
    config.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    config.headers['Access-Control-Allow-Headers'] = 'Origin, Content-Type, Accept, Authorization';

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear token and redirect to auth page if unauthorized
      Cookies.remove("access-token");
      window.location.href = "/auth";
      return Promise.reject(error);
    }

    // Handle other errors
    if (error.response?.status === 403) {
      console.error("Forbidden access:", error);
    } else if (error.response?.status === 404) {
      console.error("Resource not found:", error);
    } else if (error.response?.status === 500) {
      console.error("Server error:", error);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
