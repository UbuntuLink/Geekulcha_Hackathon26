import { Link, useNavigate } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import { getOnboarding } from "../../lib/preferences.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Profile() {
  const { name, location, priority } = getOnboarding();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Screen title="Your profile" showBack={false} withNav>
      <Card>
        <p className="text-sm text-gray-500">Name</p>
        <p className="font-medium text-gray-900">{name || "Not set"}</p>
        <p className="mt-3 text-sm text-gray-500">Location</p>
        <p className="font-medium text-gray-900">{location || "Not set"}</p>
        <p className="mt-3 text-sm text-gray-500">What matters most</p>
        <p className="font-medium capitalize text-gray-900">{priority || "Not set"}</p>
      </Card>

      <Card className="mt-3">
        <p className="text-sm text-gray-500">Account</p>
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
              Sign out
            </Button>
          </>
        ) : (
          <>
            <p className="font-medium text-gray-900">Not signed in</p>
            <Link to="/login" className="mt-2 inline-block text-sm font-medium text-brand hover:underline">
              Sign in →
            </Link>
          </>
        )}
      </Card>
    </Screen>
  );
}
