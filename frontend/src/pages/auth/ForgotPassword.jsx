import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button.jsx";
import { Field, TextInput } from "../../components/common/Field.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import AuthShell from "../../components/layout/AuthShell.jsx";
import { resetPassword } from "../../api/auth.js";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await resetPassword({ email, phoneNumber, newPassword });
      navigate("/login", { state: { justReset: true } });
    } catch (err) {
      setError("Couldn't find an account matching that email and phone number.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="Confirm the email and phone number on your account, then choose a new password.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email"><TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <Field label="Phone number"><TextInput value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required /></Field>
        <Field label="New password"><TextInput type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} required /></Field>
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <Button type="submit" disabled={submitting}>{submitting ? "Resetting..." : "Reset password"}</Button>
      </form>
      <p className="mt-5 text-center text-sm text-gray-500"><Link to="/login" className="font-semibold text-brand hover:underline">← Back to sign in</Link></p>
    </AuthShell>
  );
}
