import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import Loading from "../../components/common/Loading.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { getMyProviderProfile, getMyServiceRequests, getOpenRequests } from "../../api/services.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function RequestsFeed() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState("");
  const [myProviderProfileId, setMyProviderProfileId] = useState(null);

  useEffect(() => {
    getMyProviderProfile().then((p) => setMyProviderProfileId(p.providerProfileId));
    Promise.all([getOpenRequests(), getMyServiceRequests().catch(() => [])])
      .then(([openRequests, ownRequests]) => {
        const ownRequestIds = new Set(ownRequests.map((request) => Number(request.id)));
        setRequests(openRequests.filter((request) => !ownRequestIds.has(Number(request.id))));
      })
      .catch((err) => {
        setError("Couldn't load requests — is the backend running?");
        console.error(err);
      });
  }, []);

  return (
    <Screen title={t("nav.requests")} subtitle={t("customer.providerAvailability")} showBack={false} withNav navRole="provider">
      {error && <ErrorBanner>{error}</ErrorBanner>}
      {requests === null && !error && <Loading />}
      {requests?.length === 0 && <EmptyState>No open requests right now — check back soon.</EmptyState>}

      <div className="space-y-3">
        {requests?.map((req) => (
          <Card
            key={req.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => navigate(`/provider/requests/${req.id}`)}
          >
            <div className="flex items-start justify-between">
              <p className="font-semibold text-gray-900">{req.service?.name ?? "General"}</p>
              {req.preferredProvider?.id === myProviderProfileId && (
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                  Asked for you
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600">{req.description}</p>
            <p className="mt-2 text-xs text-gray-500">{req.location}</p>
          </Card>
        ))}
      </div>
    </Screen>
  );
}
