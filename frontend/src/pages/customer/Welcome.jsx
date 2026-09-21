import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function Welcome() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col justify-between bg-brand px-6 py-10 text-white">
      <div>
        <p className="text-xl font-bold">UbuntuLink</p>
        <h1 className="mt-10 text-4xl font-bold leading-tight">
          {t("welcome.title")}
        </h1>
        <p className="mt-4 text-white/80">{t("welcome.subtitle")}</p>
      </div>

      <div>
        <button
          onClick={() => navigate("/register")}
          className="w-full rounded-lg bg-white py-3 text-center text-lg font-bold text-brand transition-opacity hover:opacity-90"
        >
          {t("welcome.primary")}
        </button>
        <p className="mt-3 text-center text-sm text-white/80">
          {t("welcome.secondary")} {" "}
          <Link to="/login" className="font-semibold underline">
            {t("welcome.login")}
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-white/70">{t("welcome.tagline")}</p>
      </div>
    </div>
  );
}
