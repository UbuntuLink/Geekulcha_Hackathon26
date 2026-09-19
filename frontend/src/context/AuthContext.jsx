import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, getStoredUser, getToken, logout as apiLogout } from "../api/auth";

const AuthContext = createContext(null);

// The backend now enforces the JWT on every route except /auth/** (PROJECT.md §8) — so on
// mount, if we have a token, confirm it's still good and fetch the real user (id/isProvider)
// rather than trusting whatever's cached in localStorage.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    getCurrentUser()
      .then(setUser)
      .catch(() => {
        apiLogout();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, setUser, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
