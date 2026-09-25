import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import ProviderCard from "../../components/common/ProviderCard.jsx";
import Loading from "../../components/common/Loading.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Button from "../../components/common/Button.jsx";
import ProgressSteps from "../../components/common/ProgressSteps.jsx";
import { getMatchingProviders, getMyProviderProfile, getServiceRequest } from "../../api/services.js";
import { getOnboarding } from "../../lib/preferences.js";
import { useAuth } from "../../context/AuthContext.jsx";

const SORT_OPTIONS = [
  { key: "recommended", label: "Recommended" },
  { key: "price", label: "Lowest price" },
  { key: "ratings", label: "Top rated" },
  { key: "today", label: "Available today" },
];

export default function MatchingProviders() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [providers, setProviders] = useState(null);
  const [error, setError] = useState("");
  const preferredPriority = getOnboarding().priority;
  const [sortMode, setSortMode] = useState(preferredPriority === "ratings" ? "ratings" : "recommended");

  useEffect(() => {
    (async () => {
      try {
        let serviceId = state?.serviceId;
        if (!serviceId) {
          const request = await getServiceRequest(id);
          serviceId = request.service?.id;
        }
        if (!serviceId) {
          setProviders([]);
          return;
        }
        // The customer's coordinates come from onboarding. Sending them is what turns this from
        // "who offers this service" into "who offers it near me" — before geolocation the
        // customer's location never reached this endpoint at all.
        const { latitude, longitude } = getOnboarding();
        let list = await getMatchingProviders(serviceId, latitude ?? null, longitude ?? null);

        // Now that any user can be a provider, someone browsing as a customer could be offered
        // their own profile to quote on. Drop it.
        if (user?.isProvider) {
          const ownProfile = await getMyProviderProfile().catch(() => null);
          if (ownProfile?.providerProfileId != null) {
            list = list.filter((provider) => provider.providerProfileId !== ownProfile.providerProfileId);
          }
        }
        // No pre-sort by onboarding priority here: sortedProviders below already applies it,
        // together with the sort chips, so sorting twice would only be overwritten.
        setProviders(list);
      } catch (err) {
        setError("Couldn't load providers — is the backend running?");
        console.error(err);
      }
    })();
  }, [id, state, user?.isProvider]);

  const sortedProviders = useMemo(() => {
    if (!providers) return providers;
    const list = [...providers];

    if (sortMode === "price") return list.sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));
    if (sortMode === "ratings") return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sortMode === "today") {
      return list.sort((a, b) => Number(Boolean(b.availableToday)) - Number(Boolean(a.availableToday)) || (b.rating ?? 0) - (a.rating ?? 0));
    }

    if (preferredPriority === "price") {
      return list.sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));
    }
    return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }, [providers, sortMode, preferredPriority]);

  return (
    <Screen
      title={providers ? `${providers.length} ${t("customer.providersFound")}` : t("customer.providersLoading")}
      subtitle={providers?.length ? t("customer.providerAvailability") : t("customer.providersLoading")}
      eyebrow="Step 3 of 3"
      size="wide"
    >
      <ProgressSteps current={3} className="mb-6 max-w-3xl" />

      {error && <ErrorBanner>{error}</ErrorBanner>}
      {providers === null && !error && (
        <div className="rounded-2xl border border-brand/15 bg-brand-mist px-4">
          <Loading label={t("customer.findingProviders")} />
        </div>
      )}
      {providers?.length === 0 && <EmptyState>{t("customer.noServiceProviders")}</EmptyState>}

      {providers?.length > 0 && (
        <div className="mb-5 rounded-3xl border border-white/80 bg-white/68 p-3 shadow-sm backdrop-blur sm:p-4 lg:flex lg:items-center lg:justify-between lg:gap-4">
          <div>
            <p className="text-sm font-extrabold text-ink">Tune your matches</p>
            <p className="mt-0.5 text-xs text-gray-500">Sorting happens instantly — no extra API call.</p>
          </div>

          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1 lg:mt-0 lg:justify-end">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setSortMode(option.key)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition-all ${
                  sortMode === option.key
                    ? "bg-brand text-white shadow-[0_7px_18px_rgba(31,92,69,0.16)]"
                    : "border border-brand/10 bg-white text-gray-500 hover:-translate-y-0.5 hover:border-brand/25 hover:text-brand"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sortedProviders?.map((p, index) => (
          <div key={p.providerProfileId} className="animate-fade-up" style={{ animationDelay: `${Math.min(index * 55, 220)}ms` }}>
            <ProviderCard
              provider={p}
              onClick={() => navigate(`/providers/${p.providerProfileId}`, { state: { serviceRequestId: id } })}
            />
          </div>
        ))}
      </div>

      {providers?.length > 1 && (
        <div className="mt-6 rounded-3xl bg-brand-mist/65 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4 lg:p-5">
          <div>
            <p className="text-sm font-bold text-ink">Still deciding?</p>
            <p className="mt-1 text-xs leading-5 text-gray-500">Put your top providers side by side before choosing.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(`/requests/${id}/compare`, { state: { providers: sortedProviders.slice(0, 3) } })}
            className="mt-3 sm:mt-0 sm:max-w-[280px]"
          >
            {t("customer.compareProviders")}
          </Button>
        </div>
      )}
    </Screen>
  );
}
