import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import ProviderCard from "../../components/common/ProviderCard.jsx";
import Loading from "../../components/common/Loading.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { getMatchingProviders, getMyProviderProfile, getServiceRequest } from "../../api/services.js";
import { getOnboarding } from "../../lib/preferences.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function MatchingProviders() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [providers, setProviders] = useState(null);
  const [error, setError] = useState("");

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
        let list = await getMatchingProviders(serviceId);

        if (user?.isProvider) {
          const ownProfile = await getMyProviderProfile().catch(() => null);
          if (ownProfile?.providerProfileId != null) {
            list = list.filter((provider) => provider.providerProfileId !== ownProfile.providerProfileId);
          }
        }

        const priority = getOnboarding().priority;
        if (priority === "price") list = [...list].sort((a, b) => a.minPrice - b.minPrice);
        if (priority === "ratings") list = [...list].sort((a, b) => b.rating - a.rating);
        setProviders(list);
      } catch (err) {
        setError("Couldn't load providers — is the backend running?");
        console.error(err);
      }
    })();
  }, [id, state, user?.isProvider]);

  return (
    <Screen
      title={providers ? `${providers.length} ${t("customer.providersFound")}` : t("customer.providersLoading")}
      subtitle={t("customer.providerAvailability")}
    >
      <ErrorBanner>{error}</ErrorBanner>
      {providers === null && !error && <Loading label={t("customer.findingProviders")} />}
      {providers?.length === 0 && <EmptyState>{t("customer.noServiceProviders")}</EmptyState>}

      <div className="space-y-3">
        {providers?.map((p) => (
          <ProviderCard
            key={p.providerProfileId}
            provider={p}
            onClick={() => navigate(`/providers/${p.providerProfileId}`, { state: { serviceRequestId: id } })}
          />
        ))}
      </div>

      {providers?.length > 1 && (
        <button
          onClick={() => navigate(`/requests/${id}/compare`, { state: { providers: providers.slice(0, 3) } })}
          className="mt-4 w-full rounded-lg border border-brand py-2.5 text-sm font-medium text-brand transition-colors hover:bg-brand/5"
        >
          {t("customer.compareProviders")}
        </button>
      )}
    </Screen>
  );
}
