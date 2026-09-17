import axios from "axios";

// Spring Boot backend (Render) — auth, users, requests, quotes, bookings, reviews, mock payments
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  withCredentials: true, // needed for the Google OAuth2 session cookie
});
