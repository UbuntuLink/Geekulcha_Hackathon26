import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { LANGUAGES, useLanguage } from "../../context/LanguageContext.jsx";
import { CUSTOMER_LINKS, PROVIDER_LINKS } from "./BottomNav.jsx";

/** Shared page shell: title, neat top navigation, and visible language control. */
export default function Screen({ title, subtitle, showBack = true, withNav = false, navRole, children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const resolvedRole = navRole || (user?.isProvider ? "provider" : "customer");
  const quickLinks = resolvedRole === "provider" ? PROVIDER_LINKS : CUSTOMER_LINKS;
  const contentRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-cream px-2 pt-3 pb-8 sm:px-4 lg:px-6">
      <div className="mx-auto w-full max-w-5xl">
        {user && (
          <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 w-full overflow-x-auto sm:w-auto sm:flex-1">
                <div className="flex min-w-max items-center gap-1.5 sm:gap-2">
                  {quickLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `rounded-lg px-2 py-2 text-[10px] font-semibold whitespace-nowrap transition-colors sm:px-3 sm:text-xs ${
                          isActive ? "bg-brand/10 text-brand" : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                        }`
                      }
                    >
                      {t(link.label)}
                    </NavLink>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={readPage}
                  className="rounded-lg border border-brand/20 bg-brand/5 px-2.5 py-2 text-[10px] font-semibold text-brand transition-colors hover:bg-brand/10 sm:px-3 sm:text-xs"
                  aria-label={isSpeaking ? t("common.stopReading") : t("common.readPage")}
                >
                  {isSpeaking ? t("common.stopReading") : t("common.readPage")}
                </button>
                <label className="sr-only">{t("common.language")}</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-[10px] font-medium text-gray-700 outline-none focus:border-brand sm:text-xs"
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
                  className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-[10px] font-semibold text-red-600 transition-colors hover:bg-red-100 sm:px-3 sm:text-xs"
                >
                  {t("nav.logout")}
                </button>
              </div>
            </div>
          </div>
        )}

        {(title || showBack) && (
          <div className="mb-4">
            {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
        )}
        <div ref={contentRef}>{children}</div>
      </div>
    </div>
  );
}
