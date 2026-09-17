import BottomNav from "../../components/layout/BottomNav.jsx";
import Card from "../../components/common/Card.jsx";
import { getOnboarding } from "../../lib/preferences.js";

export default function Profile() {
  const { name, location, priority } = getOnboarding();

  return (
    <div className="min-h-screen bg-cream px-4 pb-24 pt-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Your profile</h1>
      <Card>
        <p className="text-sm text-gray-500">Name</p>
        <p className="font-medium text-gray-900">{name || "Not set"}</p>
        <p className="mt-3 text-sm text-gray-500">Location</p>
        <p className="font-medium text-gray-900">{location || "Not set"}</p>
        <p className="mt-3 text-sm text-gray-500">What matters most</p>
        <p className="font-medium capitalize text-gray-900">{priority || "Not set"}</p>
      </Card>
      <p className="mt-4 text-xs text-gray-400">
        Google sign-in is temporarily disabled — see PROJECT.md §8. This is local-only for now.
      </p>
      <BottomNav />
    </div>
  );
}
