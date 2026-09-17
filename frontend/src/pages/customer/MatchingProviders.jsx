import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import StarRating from "../../components/common/StarRating.jsx";
import { getMatchingProviders, getServiceRequest } from "../../api/services.js";
import { formatRange } from "../../lib/format.js";
import { getOnboarding } from "../../lib/preferences.js";

export default function MatchingProviders() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
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
        const priority = getOnboarding().priority;
        if (priority === "price") list = [...list].sort((a, b) => a.minPrice - b.minPrice);
        if (priority === "ratings") list = [...list].sort((a, b) => b.rating - a.rating);
        setProviders(list);
      } catch (err) {
        setError("Couldn't load providers — is the backend running?");
        console.error(err);
      }
    })();
  }, [id, state]);

  return (
    <Screen
      title={providers ? `${providers.length} providers found` : "Finding providers..."}
      subtitle="Providers available near you"
    >
      {error && <p className="text-sm text-red-600">{error}</p>}
      {providers?.length === 0 && (
        <p className="text-sm text-gray-500">
          No providers offer this service yet — see PROJECT.md for how to seed more demo data.
        </p>
      )}

      <div className="space-y-3">
        {providers?.map((p) => (
          <Card
            key={p.providerProfileId}
            className="cursor-pointer"
            onClick={() => navigate(`/providers/${p.providerProfileId}`, { state: { serviceRequestId: id } })}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{p.providerName}</p>
                <StarRating rating={p.rating} reviewCount={p.reviewCount} />
              </div>
              {p.availableToday && (
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                  Available
                </span>
              )}
            </div>
            <p className="mt-2 font-semibold text-brand">{formatRange(p.minPrice, p.maxPrice)}</p>
            <p className="text-xs text-gray-500">{p.location}</p>
          </Card>
        ))}
      </div>

      {providers?.length > 1 && (
        <button
          onClick={() => navigate(`/requests/${id}/compare`, { state: { providers: providers.slice(0, 3) } })}
          className="mt-4 w-full rounded-lg border border-brand py-2.5 text-sm font-medium text-brand"
        >
          Compare providers
        </button>
      )}
    </Screen>
  );
}
