import { useLocation, useNavigate } from "react-router-dom";

import Screen from "../../components/layout/Screen.jsx";
import Button from "../../components/common/Button.jsx";

export default function ServiceNotSupported() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    originalDescription,
    advice,
  } = location.state || {};

  return (
    <Screen
      title="Service not currently available"
      subtitle="UbuntuLink doesn't currently offer this type of service."
    >
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-medium text-gray-500">
          Your request
        </p>

        <p className="mt-1 text-gray-900">
          {originalDescription}
        </p>
      </div>

      {advice && (
        <div className="mt-5 rounded-xl border border-brand/30 bg-brand/5 p-4">
          <p className="text-sm font-medium text-gray-700">
            What you can do
          </p>

          <p className="mt-1 text-sm text-gray-900">
            {advice}
          </p>
        </div>
      )}

      <Button
        onClick={() => navigate("/")}
        className="mt-6"
      >
        Back to home
      </Button>
    </Screen>
  );
}