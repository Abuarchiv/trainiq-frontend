import axios from "axios";
import { useAuthStore } from "@/store/auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost/api",
  timeout: 30000, // 30s — prevents UI from hanging on unresponsive backend
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = useAuthStore.getState().token;
    const guestToken = localStorage.getItem("guest_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (guestToken) {
      config.headers["X-Guest-Token"] = guestToken;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login") &&
      !window.location.pathname.startsWith("/register")
    ) {
      // Only redirect when not a guest session
      const guestToken = localStorage.getItem("guest_token");
      if (!guestToken) {
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
