import { useLayoutEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import BrandMark from "../common/BrandMark.jsx";
import AccountControls from "./AccountControls.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

function Icon({ name }) {
  const common = "h-5 w-5";
  if (name === "home") return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="m3 10 9-7 9 7"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-7h6v7"/></svg>;
  if (name === "requests") return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M7 4h10"/><path d="M7 8h10"/><rect x="4" y="2" width="16" height="20" rx="3"/><path d="M8 13h8M8 17h5"/></svg>;
  if (name === "bookings") return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="m9 15 2 2 4-4"/></svg>;
  if (name === "dashboard") return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>;
  return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
}

const CUSTOMER_LINKS = [
  { to: "/home", label: "nav.home", icon: "home" },
  { to: "/requests/mine", label: "nav.requests", icon: "requests" },
  { to: "/profile", label: "nav.profile", icon: "profile" },
];

const PROVIDER_LINKS = [
  { to: "/provider/dashboard", label: "nav.dashboard", icon: "dashboard" },
  { to: "/provider/requests", label: "nav.requests", icon: "requests" },
  // A provider is an ordinary customer too now (any user can become one), so they need a way
  // back to the requests they raised themselves — not just the feed they quote on.
  { to: "/requests/mine", label: "nav.myRequests", icon: "requests" },
  { to: "/provider/bookings", label: "nav.bookings", icon: "bookings" },
  { to: "/provider/profile", label: "nav.profile", icon: "profile" },
];

export default function BottomNav({ role, desktopVariant }) {
  const { t } = useLanguage();
  const provider = role === "provider";
  const links = provider ? PROVIDER_LINKS : CUSTOMER_LINKS;
  const heroNavigation = desktopVariant === "hero" && !provider;
  const [dock, setDock] = useState(null);

  useLayoutEffect(() => {
    if (!heroNavigation) return;
    const anchor = document.getElementById("hero-navigation-anchor");
    if (!anchor) return;
    let frame = 0;
    const measure = () => {
      const rect = anchor.getBoundingClientRect();
      setDock({ top: Math.max(12, rect.top), left: rect.left, width: rect.width, pinned: rect.top <= 12 });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const entrance = anchor.closest("main");
    entrance?.addEventListener("animationend", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(anchor);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    measure();
    return () => {
      observer.disconnect();
      entrance?.removeEventListener("animationend", schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [heroNavigation]);

  return (
    <>
      {/* Mobile: native app-style bottom navigation. */}
      <nav aria-label="Main navigation" className="mobile-nav glass-nav fixed bottom-3 left-1/2 z-50 flex w-[calc(100%-24px)] max-w-[496px] -translate-x-1/2 items-center justify-around rounded-2xl border border-white/80 bg-white/92 px-2 py-2 shadow-[0_14px_38px_rgba(23,35,30,0.16)] backdrop-blur-xl lg:hidden">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `nav-item flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition-all ${
                isActive ? "bg-brand-soft text-brand" : "text-gray-400 hover:bg-brand-mist hover:text-brand"
              }`
            }
          >
            <Icon name={link.icon} />
            <span className="truncate">{t(link.label)}</span>
          </NavLink>
        ))}
      </nav>

      <nav aria-label="Main navigation" className="dashboard-nav desktop-nav fixed left-1/2 top-5 z-50 hidden w-[calc(100%-80px)] max-w-[1450px] -translate-x-1/2 items-center justify-between rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.09)] lg:flex xl:px-5">
        <Link to={provider ? "/provider/dashboard" : "/home"} className="rounded-xl transition-transform hover:scale-[1.015]">
          <BrandMark compact />
        </Link>

        <div className={`${provider ? "" : "ml-auto"} flex items-center gap-1 rounded-2xl bg-slate-100 p-1`}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `nav-item inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all xl:px-4 ${
                  isActive
                    ? "bg-white text-brand shadow-sm ring-1 ring-slate-200"
                    : "text-slate-600 hover:bg-white hover:text-brand"
                }`
              }
            >
              <Icon name={link.icon} />
              {t(link.label)}
            </NavLink>
          ))}
        </div>

        <AccountControls compact />
      </nav>
    </>
  );
}

