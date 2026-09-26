import { Link, useNavigate } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import { getOnboarding } from "../../lib/preferences.js";
import { useAuth } from "../../context/AuthContext.jsx";
import AccountControls from "../../components/layout/AccountControls.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function Profile() {
  const { name, location, priority } = getOnboarding();
  const { user, logout } = useAuth();
  // On a phone the nav is an icon dock with no room for language or read-aloud, so this screen
  // is where they live — reachable from the nav on every page.
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <Screen title={t("provider.profile")} showBack={false} withNav>
      <Card>
        <p className="text-sm text-gray-500">{t("common.name")}</p>
        <p className="font-medium text-gray-900">{name || t("common.notSet")}</p>
        <p className="mt-3 text-sm text-gray-500">{t("common.location")}</p>
        <p className="font-medium text-gray-900">{location || t("common.notSet")}</p>
        <p className="mt-3 text-sm text-gray-500">{t("form.whatMatters")}</p>
        <p className="font-medium capitalize text-gray-900">{priority || t("common.notSet")}</p>
      </Card>

      {!user?.isProvider && (
        <Card className="mt-3 overflow-hidden border-brand/20 bg-gradient-to-br from-brand/5 to-white">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 3h7v7" />
                <path d="M10 14 21 3" />
                <path d="M19 13v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
                <path d="M3 12v7h7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{t("becomeProvider.ctaTitle")}</p>
              <p className="mt-1 text-sm leading-5 text-gray-500">{t("becomeProvider.ctaSubtitle")}</p>
              <Button className="mt-3" onClick={() => navigate("/become-provider")}>
                {t("becomeProvider.ctaButton")}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="mt-3">
        <p className="text-sm text-gray-500">{t("common.account")}</p>
        {user ? (
          <>
            <p className="font-medium text-gray-900">{user.email}</p>
            <div className="mt-3 lg:hidden">
              <AccountControls />
            </div>
            <Button
              variant="outline"
              className="mt-3 lg:mt-3"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              {t("common.signOut")}
            </Button>
          </>
        ) : (
          <>
            <p className="font-medium text-gray-900">{t("common.notSignedIn")}</p>
            <Link to="/login" className="mt-2 inline-block text-sm font-medium text-brand hover:underline">
              {t("common.signIn")} →
            </Link>
          </>
        )}
      </Card>
    </Screen>
  );
}
