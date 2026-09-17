import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/common/Card.jsx";
import BottomNav from "../../components/layout/BottomNav.jsx";
import { getOnboarding } from "../../lib/preferences.js";
import { getMyServiceRequests, listServices } from "../../api/services.js";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function CustomerHome() {
  const navigate = useNavigate();
  const { name } = getOnboarding();
  const [recentRequests, setRecentRequests] = useState([]);
  const [services, setServices] = useState([]);

  useEffect(() => {
    getMyServiceRequests().then(setRecentRequests).catch(() => setRecentRequests([]));
    listServices().then(setServices).catch(() => setServices([]));
  }, []);

  return (
    <div className="min-h-screen bg-cream px-4 pb-24 pt-6">
      <p className="text-sm text-gray-500">
        {greeting()}, {name || "there"}
      </p>
      <h1 className="mt-1 text-2xl font-bold text-gray-900">What do you need help with?</h1>

      <button
        onClick={() => navigate("/requests/new")}
        className="mt-4 w-full rounded-xl bg-brand p-4 text-left text-white"
      >
        <p className="text-lg font-semibold">Describe your problem</p>
        <p className="text-sm text-white/80">We'll help identify the right service.</p>
      </button>

      <div className="mt-6">
        <h2 className="mb-2 text-base font-semibold text-gray-900">Recent requests</h2>
        {recentRequests.length === 0 && (
          <p className="text-sm text-gray-500">No requests yet — describe a problem to get started.</p>
        )}
        {recentRequests.slice(0, 3).map((req) => (
          <Card key={req.id} className="mb-2 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{req.service?.name ?? "Service request"}</p>
              <p className="text-sm text-gray-500 capitalize">{req.status?.toLowerCase().replace("_", " ")}</p>
            </div>
            <button
              onClick={() => navigate(`/requests/${req.id}/matches`)}
              className="text-sm font-medium text-brand"
            >
              View
            </button>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-base font-semibold text-gray-900">Recommended near you</h2>
        {services.length === 0 ? (
          <p className="text-sm text-gray-500">Loading services...</p>
        ) : (
          <Card>
            <p className="font-medium text-gray-900">Local {services[0].name.toLowerCase()} providers</p>
            <p className="text-sm text-gray-500">Available today</p>
          </Card>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
