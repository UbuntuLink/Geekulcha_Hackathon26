import { apiClient } from "./client";

const TOKEN_KEY = "ubuntulink.token";
const USER_KEY = "ubuntulink.user";

// AuthController returns a raw JWT string (no user info in the body), and the token itself only
// carries a `sub` (user id) claim — see backend JwtService. So we keep the email/name the person
// typed at login/register time alongside the token, purely for display; nothing here is
// cryptographically verified client-side. See PROJECT.md §8.
export function login(email, password) {
  return apiClient.post("/auth/login", { email, password }, { responseType: "text" }).then((res) => {
    const token = res.data;
    saveSession(token, { email });
    return token;
  });
}

export function register({ firstName, lastName, email, password, phoneNumber, isProvider }) {
  return apiClient
    .post("/auth/register", { firstName, lastName, email, password, phoneNumber, isProvider })
    .then((res) => res.data);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
