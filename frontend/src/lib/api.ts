import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

api.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem("token");
    
    // For testing: ALWAYS use admin-dev-token if inside admin portal
    if (window.location.pathname.startsWith("/admin")) {
        token = "admin-dev-token";
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
