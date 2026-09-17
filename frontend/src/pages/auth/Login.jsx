import { GOOGLE_LOGIN_URL } from "../../api/auth";
import Button from "../../components/common/Button";

export default function Login() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="text-2xl font-bold">UbuntuLink</h1>
      <p className="text-gray-500">Local help. Right when you need it.</p>
      <Button onClick={() => (window.location.href = GOOGLE_LOGIN_URL)}>
        Sign in with Google
      </Button>
    </div>
  );
}
