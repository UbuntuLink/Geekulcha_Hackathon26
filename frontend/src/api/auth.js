import { apiClient } from "./client";

const TOKEN_KEY = "ubuntulink.token";
const USER_KEY = "ubuntulink.user";

// AuthController returns a raw JWT string (no user info in the body). The real user object
// (id/email/name/isProvider) comes from GET /api/users/me, which the backend now actually
// enforces the JWT on — see PROJECT.md §8.
export function login(email, password) {
  return apiClient.post("/auth/login", { email, password }, { responseType: "text" }).then((res) => {
    localStorage.setItem(TOKEN_KEY, res.data);
    return res.data;
  });
}

export function register({ firstName, lastName, email, password, phoneNumber, isProvider }) {
  return apiClient
    .post("/auth/register", { firstName, lastName, email, password, phoneNumber, isProvider })
    .then((res) => res.data);
}

// DEMO ONLY — verifies email + phone number match, nothing stronger (no emailed code/link).
// See backend ResetPasswordRequest's javadoc before reusing this pattern anywhere real.
export function resetPassword({ email, phoneNumber, newPassword }) {
  return apiClient
    .post("/auth/reset-password", { email, phoneNumber, newPassword }, { responseType: "text" })
    .then((res) => res.data);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/** Hits the backend (requires a valid token) and caches the result for getStoredUser(). */
export function getCurrentUser() {
  return apiClient.get("/api/users/me").then((res) => {
    localStorage.setItem(USER_KEY, JSON.stringify(res.data));
    return res.data;
  });
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}
