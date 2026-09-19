import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button.jsx";
import { Field, TextInput } from "../../components/common/Field.jsx";
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
    <div className="flex min-h-screen flex-col justify-center bg-cream px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900">UbuntuLink</h1>
      <p className="mt-1 text-gray-500">Local help. Right when you need it.</p>

      {state?.justReset && (
        <p className="mt-4 rounded-lg border border-brand/30 bg-brand/5 px-3 py-2 text-sm text-brand">
          Password updated — sign in with your new password.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Field label="Email">
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password">
          <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="mt-4 flex flex-col items-center gap-2 text-sm text-gray-500">
        <Link to="/forgot-password" className="font-medium text-brand">
          Forgot password?
        </Link>
        <p>
          No account? <Link to="/register" className="font-medium text-brand">Register</Link>
        </p>
      </div>
    </div>
  );
}
