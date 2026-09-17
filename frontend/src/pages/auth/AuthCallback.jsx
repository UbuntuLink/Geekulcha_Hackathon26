import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCurrentUser } from "../../api/auth";

/**
 * Spring Security lands the browser here after a successful Google OAuth2 redirect
 * (see backend SecurityConfig — the exact post-login redirect target still needs to be
 * pointed at this route once the frontend is deployed; see PROJECT.md §8).
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setUser(user);
        navigate(user.isProvider ? "/provider/dashboard" : "/home", { replace: true });
      })
      .catch(() => navigate("/login", { replace: true }));
  }, [navigate, setUser]);

  return <p className="p-4 text-center">Signing you in...</p>;
}
