import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import Card from "../../components/common/Card.jsx";
import { getMyBookings, getMyProviderProfile, getMyServiceRequests, getOpenRequests } from "../../api/services.js";

const ACTIVE_STATUSES = ["REQUEST_SENT", "ACCEPTED", "ON_THE_WAY"];

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [openCount, setOpenCount] = useState(null);
  const [activeCount, setActiveCount] = useState(null);

  useEffect(() => {
    getMyProviderProfile().then((p) => {
      setProfile(p);
      if (!p.bio) navigate("/provider/onboarding", { replace: true });
    });
    Promise.all([getOpenRequests(), getMyServiceRequests().catch(() => [])])
      .then(([openRequests, ownRequests]) => {
        const ownRequestIds = new Set(ownRequests.map((request) => Number(request.id)));
        setOpenCount(openRequests.filter((request) => !ownRequestIds.has(Number(request.id))).length);
      })
      .catch(() => setOpenCount(0));
    getMyBookings().then((list) => setActiveCount(list.filter((b) => ACTIVE_STATUSES.includes(b.status)).length));
  }, [navigate]);

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

          <button
            onClick={() => navigate("/provider/requests")}
            className="group mt-4 w-full rounded-2xl bg-brand p-5 text-left text-white shadow-[0_14px_34px_rgba(31,92,69,0.20)] transition-all hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-[0_18px_40px_rgba(31,92,69,0.24)] lg:p-7"
          >
            <div className="flex items-center justify-between gap-5">
              <div>
                <p className="text-lg font-semibold lg:text-xl">{t("provider.browseRequests")}</p>
                <p className="mt-1 text-sm text-white/80">{t("provider.findJobs")}</p>
              </div>
              <span className="text-2xl text-white/70 transition-transform group-hover:translate-x-1">→</span>
            </div>
          </button>
        </div>

        {profile && (
          <Card className="mt-4 lg:mt-0 lg:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand/60">{t("provider.profile")}</p>
            <p className="mt-3 text-xl font-bold text-gray-900">{profile.providerName}</p>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              {profile.services.length} service{profile.services.length === 1 ? "" : "s"} listed ·{" "}
              {profile.availableToday ? t("provider.availableToday") : t("provider.unavailableToday")}
            </p>
            <button
              onClick={() => navigate("/provider/profile")}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-soft px-4 py-2.5 text-sm font-bold text-brand transition-all hover:bg-brand/15"
            >
              Manage profile <span>→</span>
            </button>
          </Card>
        )}
      </div>

      {/* Browsing requests and the profile card are already in the grid above; this is the one
          genuinely new action from provider-job-request — a provider needing help themselves. */}
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
