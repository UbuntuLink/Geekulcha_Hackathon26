import { useState } from "react";
import { Link } from "react-router-dom";

// Temporary click-through nav so every screen is reachable without auth or a running backend.
// Dynamic-param routes point at a dummy id ("1") since there's no real data yet.
// Remove this once real navigation (buttons/links inside each screen) replaces it.
const LINKS = [
  { section: "Auth", items: [
    ["/login", "Login"],
    ["/register", "Register"],
  ]},
  { section: "Customer journey", items: [
    ["/", "1. Welcome"],
    ["/onboarding", "2. Onboarding"],
    ["/home", "3. Home"],
    ["/requests/new", "4. Describe Problem"],
    ["/requests/1/classification", "5. AI Identification"],
    ["/requests/1/matches", "6. Matching Providers"],
    ["/requests/1/compare", "7. Compare Providers"],
    ["/providers/1", "8. Provider Profile"],
    ["/requests/1/quote", "9. Quote Request"],
    ["/bookings/1/confirmation", "10. Booking Confirmation"],
    ["/bookings/1", "11. Booking Tracking"],
    ["/bookings/1/review", "12. Review Provider"],
    ["/requests/mine", "My Requests (nav)"],
    ["/profile", "Profile (nav)"],
  ]},
  { section: "Provider side", items: [
    ["/provider/onboarding", "Provider Onboarding"],
    ["/provider/dashboard", "Provider Dashboard"],
    ["/provider/requests", "Requests Feed"],
    ["/provider/requests/1", "Request Detail"],
    ["/provider/bookings", "Provider Bookings"],
    ["/provider/profile", "Provider Profile Edit"],
  ]},
];

export default function DevNav() {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b bg-yellow-50 text-sm">
      <button
        className="w-full px-3 py-1 text-left font-medium text-yellow-800"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "▾" : "▸"} Dev nav — jump to any screen (auth disabled, see PROJECT.md §8)
      </button>
      {open && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-3 pb-2">
          {LINKS.map(({ section, items }) => (
            <div key={section} className="min-w-[10rem]">
              <p className="text-xs font-semibold uppercase text-yellow-700">{section}</p>
              <ul>
                {items.map(([to, label]) => (
                  <li key={to}>
                    <Link className="text-emerald-700 hover:underline" to={to}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
