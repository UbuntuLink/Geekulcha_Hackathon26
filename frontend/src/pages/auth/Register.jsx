import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import { Field, TextInput } from "../../components/common/Field.jsx";
import AuthShell from "../../components/layout/AuthShell.jsx";
import { register } from "../../api/auth.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function Register() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", phoneNumber: "", isProvider: false });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await register(form);
      navigate("/login");
    } catch (err) {
      setError("Couldn't register — that email or phone number may already be in use.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title={t("account.create")} subtitle="Join as a customer, or switch on provider mode if you offer local services.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("form.firstName")}><TextInput value={form.firstName} onChange={update("firstName")} placeholder="Leshen" required /></Field>
          <Field label={t("form.lastName")}><TextInput value={form.lastName} onChange={update("lastName")} placeholder="Naicker" required /></Field>
        </div>
        <Field label={t("form.email")}><TextInput type="email" value={form.email} onChange={update("email")} placeholder="you@example.com" required /></Field>
        <Field label={t("form.phone")}><TextInput value={form.phoneNumber} onChange={update("phoneNumber")} placeholder="071 234 5678" required /></Field>
        <Field label={t("form.password")} hint="Use at least 8 characters."><TextInput type="password" minLength={8} value={form.password} onChange={update("password")} required /></Field>

        <label className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 transition-all ${form.isProvider ? "border-brand/30 bg-brand-mist" : "border-gray-200 bg-white"}`}>
          <span>
            <span className="block text-sm font-semibold text-gray-800">{t("provider.account")}</span>
            <span className="mt-0.5 block text-xs text-gray-500">Create a profile and receive job requests.</span>
          </span>
          <input className="h-4 w-4 accent-[#1F5C45]" type="checkbox" checked={form.isProvider} onChange={update("isProvider")} />
        </label>

        {error && <ErrorBanner>{error}</ErrorBanner>}
        <Button type="submit" disabled={submitting}>{submitting ? "Creating account..." : t("action.register")}</Button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">Already have an account? <Link to="/login" className="font-semibold text-brand hover:underline">{t("login.signIn")}</Link></p>
    </AuthShell>
  );
}
