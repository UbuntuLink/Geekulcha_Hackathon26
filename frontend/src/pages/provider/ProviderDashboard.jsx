import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import Card from "../../components/common/Card.jsx";
import { getMyBookings, getMyProviderProfile, getMyServiceRequests, getOpenRequests } from "../../api/services.js";
import { API_BASE_URL } from "../../api/client.js";

const ACTIVE_STATUSES = ["REQUEST_SENT", "ACCEPTED", "ON_THE_WAY"];

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [openCount, setOpenCount] = useState(null);
  const [activeCount, setActiveCount] = useState(null);
  const [reminders, setReminders] = useState(null);

  useEffect(() => {
    getMyProviderProfile().then((p) => {
      setProfile(p);
      if (!p.bio) navigate("/provider/onboarding", { replace: true });
    });
    Promise.all([getOpenRequests(), getMyServiceRequests().catch(() => []), getMyBookings()])
      .then(([openRequests, ownRequests, bookings]) => {
        const ownRequestIds = new Set(ownRequests.map((request) => Number(request.id)));
        const availableRequests = openRequests.filter((request) => !ownRequestIds.has(Number(request.id)));
        setOpenCount(availableRequests.length);
        setActiveCount(bookings.filter((booking) => ACTIVE_STATUSES.includes(booking.status)).length);
        const datedReminders = [
          ...bookings.filter((booking) => ACTIVE_STATUSES.includes(booking.status)).map((booking) => ({
            id: `booking-${booking.id}`,
            title: booking.quote?.serviceRequest?.description || "Scheduled booking",
            type: "Booking",
            date: booking.scheduledDate,
          })),
          ...availableRequests.map((request) => ({
            id: `request-${request.id}`,
            title: request.description || "Open service request",
            type: "Open request",
            date: request.preferredDate,
          })),
        ].sort((left, right) => {
          if (!left.date) return 1;
          if (!right.date) return -1;
          return new Date(left.date) - new Date(right.date);
        });
        setReminders(datedReminders.slice(0, 5));
      })
      .catch(() => setOpenCount(0));
  }, [navigate]);

  const reminderLabel = (date) => {
    if (!date) return "No date set";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reminderDate = new Date(`${date}T00:00:00`);
    const days = Math.round((reminderDate - today) / 86400000);
    if (days < 0) return "Overdue";
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return reminderDate.toLocaleDateString([], { day: "numeric", month: "short" });
  };

  return (
    <Screen title={`Hi, ${profile?.providerName?.split(" ")[0] ?? t("common.personFallback")}`} subtitle="Here’s what needs your attention today." showBack={false} withNav navRole="provider" size="wide">
      <div className="lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-start lg:gap-6">
        <div>
          <div className="grid grid-cols-2 gap-3">
            <Card className="cursor-pointer lg:p-6" onClick={() => navigate("/provider/requests")}>
              <p className="text-3xl font-bold text-brand lg:text-5xl">{openCount ?? "…"}</p>
              <p className="mt-1 text-sm text-gray-500">{t("provider.openRequests")}</p>
            </Card>
            <Card className="cursor-pointer lg:p-6" onClick={() => navigate("/provider/bookings")}>
              <p className="text-3xl font-bold text-brand lg:text-5xl">{activeCount ?? "…"}</p>
              <p className="mt-1 text-sm text-gray-500">{t("provider.activeBookings")}</p>
            </Card>
          </div>

        </div>

        {profile && (
          <Card className="mt-4 lg:mt-0 lg:p-6">
            <div className="flex items-center gap-3">
              {profile.profileImageUrl ? <img src={`${API_BASE_URL}${profile.profileImageUrl}`} alt="Your provider profile" className="h-14 w-14 rounded-full object-cover" /> : <div className="h-14 w-14 rounded-full bg-brand-mist" />}
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand/60">{t("provider.profile")}</p>
                <p className="mt-1 truncate text-xl font-bold text-gray-900">{profile.providerName}</p>
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              {profile.services.length} service{profile.services.length === 1 ? "" : "s"} listed ·{" "}
              {profile.availableToday ? t("provider.availableToday") : t("provider.unavailableToday")}
            </p>
            <button onClick={() => navigate("/provider/profile")} className="mt-3 text-sm font-semibold text-brand hover:underline">Edit profile picture</button>
          </Card>
        )}
      </div>

      <Card className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Reminders</h2>
          <span className="text-xs text-gray-500">Urgent first</span>
        </div>
        {reminders === null ? <p className="mt-3 text-sm text-gray-500">Loading reminders...</p> : reminders.length === 0 ? <p className="mt-3 text-sm text-gray-500">Nothing needs your attention yet.</p> : (
          <div className="mt-3 space-y-2">
            {reminders.map((reminder) => {
              const label = reminderLabel(reminder.date);
              const urgent = label === "Overdue" || label === "Today" || label === "Tomorrow";
              return <div key={reminder.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5">
                <div className="min-w-0"><p className="truncate text-sm font-medium text-gray-800">{reminder.title}</p><p className="text-xs text-gray-500">{reminder.type}</p></div>
                <span className={`shrink-0 text-xs font-semibold ${urgent ? "text-red-600" : "text-gray-500"}`}>{label}</span>
              </div>;
            })}
          </div>
        )}
      </Card>

      {/* The only action here that the bottom nav doesn't already offer. Browsing requests and
          opening the profile were both duplicated three ways — a tile, a banner, and a nav item —
          so the banner and the "Manage profile" button are gone; the tiles stay because they
          carry the counts. */}
      <button
        onClick={() => navigate("/requests/new")}
        className="mt-5 w-full rounded-2xl border border-brand/25 bg-white p-4 text-left text-brand shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand/5 lg:p-5"
      >
        <p className="text-lg font-semibold">{t("provider.requestService")}</p>
        <p className="mt-0.5 text-sm text-gray-500">{t("provider.requestServiceSubtitle")}</p>
      </button>
    </Screen>
  );
}
