import { NavLink } from "react-router-dom";

const CUSTOMER_LINKS = [
  { to: "/home", label: "Home" },
  { to: "/requests/mine", label: "Requests" },
  { to: "/profile", label: "Profile" },
];

const PROVIDER_LINKS = [
  { to: "/provider/dashboard", label: "Dashboard" },
  { to: "/provider/requests", label: "Requests" },
  { to: "/provider/bookings", label: "Bookings" },
  { to: "/provider/profile", label: "Profile" },
];

/** role: "provider" switches to the provider's 4 tabs; anything else is the customer's 3. */
export default function BottomNav({ role }) {
  const links = role === "provider" ? PROVIDER_LINKS : CUSTOMER_LINKS;

  return (
    <nav className="fixed bottom-0 left-1/2 flex w-full max-w-[480px] -translate-x-1/2 justify-around border-t border-gray-200 bg-white py-3">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `text-sm font-medium ${isActive ? "text-brand" : "text-gray-400"}`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
