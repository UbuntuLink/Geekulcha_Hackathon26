import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** role: "customer" | "provider" (optional) — redirects the wrong role to their own home. */
export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="p-4 text-center">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;

  if (role === "provider" && !user.isProvider) return <Navigate to="/home" replace />;
  if (role === "customer" && user.isProvider) return <Navigate to="/provider/dashboard" replace />;

  return children;
}
