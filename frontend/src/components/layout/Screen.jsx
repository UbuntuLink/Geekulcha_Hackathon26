import { useNavigate, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav.jsx";
import BrandMark from "../common/BrandMark.jsx";

const widthClasses = {
  compact: "max-w-3xl",
  normal: "max-w-5xl",
  wide: "max-w-7xl",
};

export default function Screen({
  title,
  subtitle,
  showBack = true,
  withNav = false,
  navRole,
  desktopNav,
  eyebrow,
  size = "compact",
  children,
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const widthClass = widthClasses[size] ?? widthClasses.normal;

  return (
    <div className={`app-canvas ${withNav ? "has-bottom-nav" : ""} relative min-h-screen overflow-hidden bg-cream lg:min-h-screen ${withNav ? "pb-28 lg:pb-28" : "pb-10 lg:pb-14"}`}>
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand/7 blur-3xl lg:h-96 lg:w-96" />
      <div className="pointer-events-none absolute -left-24 top-64 h-52 w-52 rounded-full bg-white/70 blur-3xl lg:h-80 lg:w-80" />

      <div className={`relative mx-auto w-full ${widthClass} px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8 ${withNav && desktopNav !== "hero" ? "lg:pt-28" : "lg:pt-8"} xl:px-10`}>
        {!title && !showBack && withNav && <div className="mb-4 lg:hidden"><BrandMark compact /></div>}
        {(title || showBack) && (
          <header className="mb-6 animate-fade-up lg:mb-8">
            <div className={`mb-4 flex items-center justify-between gap-3 ${!showBack && withNav ? "lg:hidden" : ""}`}>
              {showBack ? (
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-brand/10 bg-white/70 px-3 text-sm font-semibold text-gray-600 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-brand/25 hover:text-brand active:scale-95"
                  aria-label="Go back"
                >
                  <span aria-hidden="true">←</span>
                  Back
                </button>
              ) : (
                <BrandMark compact />
              )}
            </div>

            {eyebrow && (
              <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.18em] text-brand/70">{eyebrow}</p>
            )}
            {title && (
              <h1 className="max-w-3xl text-[1.72rem] font-extrabold leading-tight tracking-[-0.025em] text-ink sm:text-3xl lg:text-[2.15rem]">
                {title}
              </h1>
            )}
            {subtitle && <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-[15px]">{subtitle}</p>}
          </header>
        )}

        <main key={pathname} className="page-content relative">{children}</main>
      </div>

      {withNav && <BottomNav role={navRole} desktopVariant={desktopNav} />}
    </div>
  );
}
