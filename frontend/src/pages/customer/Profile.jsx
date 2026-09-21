import { Link, useNavigate } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import { getOnboarding } from "../../lib/preferences.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function Profile() {
  const { name, location, priority } = getOnboarding();
  const { user, logout } = useAuth();
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

      <Card className="mt-3">
        <p className="text-sm text-gray-500">{t("common.account")}</p>
        {user ? (
          <>
            <p className="font-medium text-gray-900">{user.email}</p>
            <Button
              variant="outline"
              className="mt-3"
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
