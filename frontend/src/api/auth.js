import { apiClient } from "./client";

export const GOOGLE_LOGIN_URL = `${apiClient.defaults.baseURL}/oauth2/authorization/google`;

export function getCurrentUser() {
  return apiClient.get("/api/auth/me").then((res) => res.data);
}
