import axios from "axios";

// Spring Boot backend (Render) — auth, users, requests, quotes, bookings, reviews, mock payments
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Attach the JWT from login/register (see api/auth.js) as a Bearer token. Note: the backend
// doesn't actually validate this on business endpoints yet (see SecurityConfig, PROJECT.md §8),
// so this is forward-wiring, not real enforcement today.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("ubuntulink.token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
