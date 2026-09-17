import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

// Auth is disabled for now (see PROJECT.md §8) so screens are navigable without a backend.
// When Google auth is turned back on, restore the useEffect that calls getCurrentUser()
// from ../api/auth on mount and sets loading accordingly.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const loading = false;

  return <AuthContext.Provider value={{ user, loading, setUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
