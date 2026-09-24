import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button.jsx";
import { Field, TextInput } from "../../components/common/Field.jsx";
import { register } from "../../api/auth.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function Register() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
    isProvider: false,
  });
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
    <div className="flex min-h-screen flex-col justify-center bg-cream px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900">{t("account.create")}</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="flex gap-2">
          <Field label={t("form.firstName")}>
            <TextInput value={form.firstName} onChange={update("firstName")} required />
          </Field>
          <Field label={t("form.lastName")}>
            <TextInput value={form.lastName} onChange={update("lastName")} required />
          </Field>
        </div>
        <Field label={t("form.email")}>
          <TextInput type="email" value={form.email} onChange={update("email")} required />
        </Field>
        <Field label={t("form.phone")}>
          <TextInput value={form.phoneNumber} onChange={update("phoneNumber")} required />
        </Field>
        <Field label={t("form.password")}>
          <TextInput type="password" value={form.password} onChange={update("password")} required />
        </Field>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.isProvider} onChange={update("isProvider")} />
          {t("provider.account")}
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : t("action.register")}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        Already have an account? <Link to="/login" className="font-medium text-brand">{t("login.signIn")}</Link>
      </p>
    </div>
  );
}
