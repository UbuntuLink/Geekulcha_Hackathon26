import { useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav.jsx";
import BrandMark from "../common/BrandMark.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

const widthClasses = {
  compact: "max-w-3xl",
  normal: "max-w-5xl",
  wide: "max-w-7xl",
};

/**
 * Shared page shell.
 *
 * The layout is the restyled one from Leshen/ChatGPT-improved-ui; navigation lives in BottomNav
 * again rather than a top quick-nav. The language selector and the read-aloud control come from
 * the multilingual work on extra-features and are kept here, because they are the only way to
 * reach either feature.
 */
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
  const { t } = useLanguage();
  const widthClass = widthClasses[size] ?? widthClasses.normal;
  const contentRef = useRef(null);

  return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const readPage = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const synth = window.speechSynthesis;
    const text = [title, subtitle, contentRef.current?.innerText ?? ""]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (!text) {
      return;
    }

    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "zu" ? "zu-ZA" : language === "tn" ? "en-ZA" : language === "af" ? "af-ZA" : "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synth.cancel();
    synth.speak(utterance);
  };

  const controls = user ? (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <button
        type="button"
        onClick={readPage}
        className="rounded-xl border border-brand/15 bg-white/70 px-2.5 py-2 text-[10px] font-semibold text-brand shadow-sm backdrop-blur transition-colors hover:bg-brand/10 sm:px-3 sm:text-xs"
        aria-label={isSpeaking ? t("common.stopReading") : t("common.readPage")}
      >
        {isSpeaking ? t("common.stopReading") : t("common.readPage")}
      </button>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="rounded-xl border border-brand/10 bg-white/70 px-2 py-2 text-[10px] font-medium text-gray-700 shadow-sm outline-none backdrop-blur focus:border-brand sm:text-xs"
        aria-label={t("common.language")}
      >
        {LANGUAGES.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-xl border border-red-200 bg-red-50/80 px-2.5 py-2 text-[10px] font-semibold text-red-600 shadow-sm backdrop-blur transition-colors hover:bg-red-100 sm:px-3 sm:text-xs"
      >
        {t("nav.logout")}
      </button>
    </div>
  ) : null;

  return (
    <div className={`app-canvas ${withNav ? "has-bottom-nav" : ""} relative min-h-screen overflow-hidden bg-cream lg:min-h-screen ${withNav ? "pb-28 lg:pb-28" : "pb-10 lg:pb-14"}`}>
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand/7 blur-3xl lg:h-96 lg:w-96" />
      <div className="pointer-events-none absolute -left-24 top-64 h-52 w-52 rounded-full bg-white/70 blur-3xl lg:h-80 lg:w-80" />

      <div className={`relative mx-auto w-full ${widthClass} px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8 ${withNav && desktopNav !== "hero" ? "lg:pt-28" : "lg:pt-8"} xl:px-10`}>
        {/* No top bar. The nav bar is the app bar; account controls live there on desktop and on
            the Profile screen on phones, where the nav is an icon dock with no room. Only the
            brand mark appears above a phone screen that has no title of its own. */}
        {!title && !showBack && withNav && (
          <div className="mb-4 lg:hidden">
            <BrandMark compact />
          </div>
        )}
        {(title || showBack) && (
          <header className="mb-6 animate-fade-up lg:mb-8">
            <div className={`mb-4 flex items-center gap-3 ${!showBack && withNav ? "lg:hidden" : ""}`}>
              {showBack ? (
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-brand/10 bg-white/70 px-3 text-sm font-semibold text-gray-600 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-brand/25 hover:text-brand active:scale-95"
                  aria-label={t("common.back")}
                >
                  <span aria-hidden="true">←</span>
                  {t("common.back")}
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

        <main key={pathname} ref={contentRef} className="page-content relative">
          {children}
        </main>
      </div>

      {withNav && <BottomNav role={navRole} desktopVariant={desktopNav} />}
    </div>
  );
}
