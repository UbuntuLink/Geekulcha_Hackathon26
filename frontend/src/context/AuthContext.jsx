import { createContext, useContext, useState } from "react";
import { getStoredUser, logout as apiLogout } from "../api/auth";

const AuthContext = createContext(null);

// Reflects the email/password + JWT login (PROJECT.md §8). This is a client-side convenience
// only — the backend doesn't validate the JWT on business endpoints yet, so being "logged in"
// here doesn't currently change what the app can do (routes aren't gated, see AppRoutes.jsx).
export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const loading = false;

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, setUser, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
