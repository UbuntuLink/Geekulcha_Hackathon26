import { NavLink } from "react-router-dom";

const links = [
  { to: "/home", label: "Home" },
  { to: "/requests/mine", label: "Requests" },
  { to: "/profile", label: "Profile" },
];

export default function BottomNav() {
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
