import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import Loading from "../../components/common/Loading.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { getMyProviderProfile, getMyServiceRequests, getOpenRequests, getSentQuotes } from "../../api/services.js";
import { formatZAR } from "../../lib/format.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function RequestsFeed() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState("");
  const [myProviderProfileId, setMyProviderProfileId] = useState(null);
  const [myQuotes, setMyQuotes] = useState({}); // requestId -> my pending quote

  useEffect(() => {
    getMyProviderProfile().then((p) => setMyProviderProfileId(p.providerProfileId)).catch(() => {});
    getSentQuotes()
      .then((quotes) => setMyQuotes(Object.fromEntries(
        quotes.filter((quote) => quote.status === "PENDING").map((quote) => [quote.requestId, quote])
      )))
      .catch(() => {});
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
      {requests?.length === 0 && <EmptyState>{t("feed.empty")}</EmptyState>}

      <div className="space-y-3">
        {requests
          ?.slice()
          .sort((a, b) => Number(b.preferredProvider?.id === myProviderProfileId) - Number(a.preferredProvider?.id === myProviderProfileId))
          .map((req) => (
          <Card
            key={req.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => navigate(`/provider/requests/${req.id}`)}
          >
            <div className="flex flex-wrap items-start gap-2">
              <p className="mr-auto font-semibold text-gray-900">{req.service?.name ?? "General"}</p>
              {req.preferredProvider?.id === myProviderProfileId && (
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                  {t("feed.askedForYou")}
                </span>
              )}
              {myQuotes[req.id] && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <span aria-hidden="true">✓ </span>{t("feed.youQuoted")} {formatZAR(myQuotes[req.id].amount)}
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
