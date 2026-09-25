import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export const CUSTOMER_LINKS = [
  { to: "/home", label: "nav.home" },
  { to: "/requests/mine", label: "nav.requests" },
  { to: "/profile", label: "nav.profile" },
];

export const PROVIDER_LINKS = [
  { to: "/provider/dashboard", label: "nav.dashboard" },
  { to: "/provider/requests", label: "nav.requests" },
  { to: "/provider/bookings", label: "nav.bookings" },
  { to: "/provider/profile", label: "nav.profile" },
];

/** Kept for compatibility; the app now uses the top quick-nav instead of a fixed bottom nav. */
export default function BottomNav({ role }) {
  const links = role === "provider" ? PROVIDER_LINKS : CUSTOMER_LINKS;
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useLanguage();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return null;
}
