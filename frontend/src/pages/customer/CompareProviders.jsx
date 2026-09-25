import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import Loading from "../../components/common/Loading.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { getMatchingProviders, getMyProviderProfile, getServiceRequest } from "../../api/services.js";
import { formatRange } from "../../lib/format.js";
import { getOnboarding } from "../../lib/preferences.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function CompareProviders() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [providers, setProviders] = useState(state?.providers || null);

  useEffect(() => {
    (async () => {
      let list = providers;

      if (!list) {
        const request = await getServiceRequest(id).catch(() => null);
        if (!request?.service?.id) {
          setProviders([]);
          return;
        }
        const { latitude, longitude } = getOnboarding();
        list = await getMatchingProviders(request.service.id, latitude ?? null, longitude ?? null)
          .catch(() => []);
      }

      if (user?.isProvider) {
        const ownProfile = await getMyProviderProfile().catch(() => null);
        if (ownProfile?.providerProfileId != null) {
          list = list.filter((provider) => provider.providerProfileId !== ownProfile.providerProfileId);
        }
      }

      setProviders(list.slice(0, 3));
    })();
    // Only re-run when the request or signed-in role changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.isProvider]);

  if (!providers) {
    return (
      <Screen title="Compare your options">
        <Loading />
      </Screen>
    );
  }

  if (providers.length === 0) {
    return (
      <Screen title="Compare your options">
        <EmptyState>No providers to compare yet.</EmptyState>
      </Screen>
    );
  }

  const best = [...providers].sort((a, b) => b.rating - a.rating)[0];

  return (
    <Screen title="Compare your options" subtitle="Choose based on what matters to you.">
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[400px] text-sm">
          <thead>
            <tr className="rounded-lg bg-brand text-white">
              <th className="rounded-l-lg p-2 text-left">Provider</th>
              {providers.map((p) => (
                <th key={p.providerProfileId} className="p-2 text-left last:rounded-r-lg">
                  {p.providerName.split(" ")[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 font-medium text-gray-500">Price</td>
              {providers.map((p) => (
                <td key={p.providerProfileId} className="p-2">{formatRange(p.minPrice, p.maxPrice)}</td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="p-2 font-medium text-gray-500">Rating</td>
              {providers.map((p) => (
                <td key={p.providerProfileId} className="p-2">{p.rating.toFixed(1)} ★</td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="p-2 font-medium text-gray-500">Location</td>
              {providers.map((p) => (
                <td key={p.providerProfileId} className="p-2">{p.location}</td>
              ))}
            </tr>
            <tr>
              <td className="p-2 font-medium text-gray-500">Today</td>
              {providers.map((p) => (
                <td key={p.providerProfileId} className="p-2">{p.availableToday ? "✓" : "—"}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </Card>

      {best && (
        <>
          <Button
            className="mt-4"
            onClick={() => navigate(`/providers/${best.providerProfileId}`, { state: { serviceRequestId: id } })}
          >
            View {best.providerName.split(" ")[0]}'s profile
          </Button>
          <p className="mt-2 text-xs italic text-gray-500">
            Tip: {best.providerName.split(" ")[0]} has the highest rating.
          </p>
        </>
      )}
    </Screen>
  );
}
