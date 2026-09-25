import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { LANGUAGES, useLanguage } from "../../context/LanguageContext.jsx";

/**
 * Language, read-aloud and sign-out.
 *
 * These used to sit in a bar of their own above every page title, which meant two bars stacked at
 * the top of the screen once the nav bar was there too. They live in the nav now, so there is one
 * bar. On phones the nav is an icon dock with no room for them, so they appear on the Profile
 * screen instead — which is where an account action belongs anyway.
 *
 * `compact` drops the labels down to icon-sized controls for the nav bar.
 */
export default function AccountControls({ compact = false }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!user) return null;

  const readPage = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const synth = window.speechSynthesis;
    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    // Reads whatever page is open, which is why this control has to travel with the chrome
    // rather than live on one screen.
    const main = document.querySelector("main");
    const text = (main?.innerText ?? "").replace(/\s+/g, " ").trim();
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang =
      language === "zu" ? "zu-ZA" : language === "tn" ? "en-ZA" : language === "af" ? "af-ZA" : "en-US";
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synth.cancel();
    synth.speak(utterance);
  };

  const size = compact ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-xs";

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={readPage}
        className={`rounded-xl border border-brand/15 bg-white/70 font-semibold text-brand transition-colors hover:bg-brand/10 ${size}`}
        aria-label={isSpeaking ? t("common.stopReading") : t("common.readPage")}
      >
        {isSpeaking ? t("common.stopReading") : t("common.readPage")}
      </button>

      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className={`rounded-xl border border-brand/10 bg-white/70 font-medium text-gray-700 outline-none focus:border-brand ${size}`}
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
        onClick={() => {
          logout();
          navigate("/login");
        }}
        className={`rounded-xl border border-red-200 bg-red-50/80 font-semibold text-red-600 transition-colors hover:bg-red-100 ${size}`}
      >
        {t("nav.logout")}
      </button>
    </div>
  );
}
