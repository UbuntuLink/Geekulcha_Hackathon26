import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button.jsx";
import { Field, TextInput } from "../../components/common/Field.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import { resetPassword } from "../../api/auth.js";

/**
 * DEMO ONLY — there's no email/SMS infrastructure to send a real reset code, so this just
 * checks you know the account's email AND phone number before letting you set a new password.
 * That's a much lower bar than a real "forgot password" flow. See PROJECT.md §8.
 */
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
    <div className="flex min-h-screen flex-col justify-center bg-cream px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
      <p className="mt-1 text-sm text-gray-500">
        Enter the email and phone number on your account, then choose a new password.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Field label="Email">
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Phone number">
          <TextInput value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
        </Field>
        <Field label="New password">
          <TextInput
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
          />
        </Field>
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Resetting..." : "Reset password"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        <Link to="/login" className="font-medium text-brand">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
