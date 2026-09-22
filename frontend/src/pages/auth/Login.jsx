import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import { Field, TextInput } from "../../components/common/Field.jsx";
import AuthShell from "../../components/layout/AuthShell.jsx";
import { login, getCurrentUser } from "../../api/auth.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(email, password);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      navigate(currentUser.isProvider ? "/provider/dashboard" : "/home");
    } catch (err) {
      setError("Invalid email or password.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue to your UbuntuLink account.">
      {state?.justReset && (
        <div className="mb-4 rounded-xl border border-brand/20 bg-brand-mist px-3.5 py-3 text-sm font-medium text-brand">
          ✓ Password updated — sign in with your new password.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email">
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
        </Field>
        <Field label="Password">
          <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
        </Field>
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="mt-5 flex flex-col items-center gap-2 text-sm text-gray-500">
        <Link to="/forgot-password" className="font-semibold text-brand hover:underline">Forgot password?</Link>
        <p>No account? <Link to="/register" className="font-semibold text-brand hover:underline">Create one</Link></p>
      </div>
    </AuthShell>
  );
}
