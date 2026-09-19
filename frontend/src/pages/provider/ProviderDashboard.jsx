import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import { getMyBookings, getMyProviderProfile, getOpenRequests } from "../../api/services.js";

const ACTIVE_STATUSES = ["REQUEST_SENT", "ACCEPTED", "ON_THE_WAY"];

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [openCount, setOpenCount] = useState(null);
  const [activeCount, setActiveCount] = useState(null);

  useEffect(() => {
    getMyProviderProfile().then((p) => {
      setProfile(p);
      if (!p.bio) navigate("/provider/onboarding", { replace: true });
    });
    getOpenRequests().then((list) => setOpenCount(list.length));
    getMyBookings().then((list) => setActiveCount(list.filter((b) => ACTIVE_STATUSES.includes(b.status)).length));
  }, [navigate]);

  return (
    <Screen title={`Hi, ${profile?.providerName?.split(" ")[0] ?? "there"}`} showBack={false} withNav navRole="provider">
      <div className="grid grid-cols-2 gap-3">
        <Card className="cursor-pointer" onClick={() => navigate("/provider/requests")}>
          <p className="text-3xl font-bold text-brand">{openCount ?? "…"}</p>
          <p className="text-sm text-gray-500">Open requests</p>
        </Card>
        <Card className="cursor-pointer" onClick={() => navigate("/provider/bookings")}>
          <p className="text-3xl font-bold text-brand">{activeCount ?? "…"}</p>
          <p className="text-sm text-gray-500">Active bookings</p>
        </Card>
      </div>

      <button
        onClick={() => navigate("/provider/requests")}
        className="mt-4 w-full rounded-xl bg-brand p-4 text-left text-white transition-colors hover:bg-brand-dark"
      >
        <p className="text-lg font-semibold">Browse service requests</p>
        <p className="text-sm text-white/80">Find jobs to quote on.</p>
      </button>

      {profile && (
        <Card className="mt-4">
          <p className="text-sm text-gray-500">Your profile</p>
          <p className="font-medium text-gray-900">{profile.providerName}</p>
          <p className="text-sm text-gray-500">
            {profile.services.length} service{profile.services.length === 1 ? "" : "s"} listed ·{" "}
            {profile.availableToday ? "Available today" : "Unavailable today"}
          </p>
        </Card>
      )}
    </Screen>
  );
}
