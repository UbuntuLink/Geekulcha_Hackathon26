import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import { Field, TextInput } from "../../components/common/Field.jsx";
import AuthShell from "../../components/layout/AuthShell.jsx";
import { login, getCurrentUser } from "../../api/auth.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { setUser } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acceptedDisclaimer) {
      setError("Please read and accept the platform disclaimer before signing in.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await login(email, password);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      // `next` comes from registering with "I'm a service provider" ticked, so that choice
      // survives the trip through the login screen instead of being forgotten.
      navigate(state?.next ?? (currentUser.isProvider ? "/provider/dashboard" : "/home"));
    } catch (err) {
      setError("Invalid email or password.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title={t("login.title")} subtitle={t("login.subtitle")}>
      {state?.justReset && (
        <div className="mb-4 rounded-xl border border-brand/20 bg-brand-mist px-3.5 py-3 text-sm font-medium text-brand">
          ✓ Password updated — sign in with your new password.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t("form.email")}>
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
        </Field>
        <Field label={t("form.password")}>
          <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
        </Field>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
          <label className="flex cursor-pointer items-start gap-2">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#1F5C45]" checked={acceptedDisclaimer} onChange={(e) => setAcceptedDisclaimer(e.target.checked)} />
            <span>I understand that UbuntuLink is a connector between customers and service providers and is not liable for the work, conduct, loss, damage, or disputes arising between them.</span>
          </label>
          <button type="button" className="mt-2 ml-6 font-semibold text-brand hover:underline" onClick={() => setShowDisclaimer((open) => !open)}>
            {showDisclaimer ? "Hide details" : "Read more"}
          </button>
          {showDisclaimer && (
            <p className="mt-2 ml-6 text-xs leading-relaxed text-gray-500">
              Users are responsible for choosing providers, confirming prices and arrangements, and resolving service issues directly. UbuntuLink facilitates the connection and does not provide, supervise, guarantee, or insure the services. This notice does not replace professional legal advice.
            </p>
          )}
        </div>
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <Button type="submit" disabled={submitting || !acceptedDisclaimer}>
          {submitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="mt-5 flex flex-col items-center gap-2 text-sm text-gray-500">
        <Link to="/forgot-password" className="font-semibold text-brand hover:underline">{t("login.forgot")}</Link>
        <p>{t("login.noAccount")} <Link to="/register" className="font-semibold text-brand hover:underline">{t("login.register")}</Link></p>
      </div>
    </AuthShell>
  );
}
