import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import StarRating from "../../components/common/StarRating.jsx";
import Button from "../../components/common/Button.jsx";
import Loading from "../../components/common/Loading.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { getProviderProfile } from "../../api/services.js";
import { formatRange } from "../../lib/format.js";

export default function ProviderProfileView() {
  const { providerId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setProfile(null);
    setError("");
    getProviderProfile(providerId)
      .then(setProfile)
      .catch((err) => {
        setError("Couldn't load this provider — is the backend running?");
        console.error(err);
      });
  }, [providerId]);

  if (error) {
    return (
      <Screen title="Provider profile">
        <ErrorBanner>{error}</ErrorBanner>
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen title="Provider profile">
        <Loading />
      </Screen>
    );
  }

  const mainService = profile.services[0];

  return (
    <Screen title={profile.providerName}>
      <StarRating rating={profile.rating} reviewCount={profile.reviewCount} />

      {mainService && (
        <div className="mt-4 rounded-xl bg-brand p-4 text-white">
          <p className="text-lg font-bold">{mainService.serviceName}</p>
          <p className="text-sm text-white/80">
            {profile.location} · {profile.availableToday ? "Available today" : "Unavailable today"}
          </p>
          <p className="mt-1 font-medium">{formatRange(mainService.minPrice, mainService.maxPrice)}</p>
        </div>
      )}

      <div className="mt-4">
        <h2 className="font-semibold text-gray-900">About this provider</h2>
        <p className="mt-1 text-sm text-gray-600">{profile.bio}</p>
      </div>

      <div className="mt-4">
        <h2 className="mb-2 font-semibold text-gray-900">Recent reviews</h2>
        {profile.reviews.length === 0 && <EmptyState>No reviews yet.</EmptyState>}
        {profile.reviews.map((r, i) => (
          <Card key={i} className="mb-2">
            <p className="text-sm italic text-gray-900">"{r.comment}"</p>
            <p className="mt-1 text-xs text-amber-500">{"★".repeat(r.rating)}</p>
          </Card>
        ))}
      </div>

      <Button
        className="mt-6"
        onClick={() =>
          navigate(`/requests/${state?.serviceRequestId}/quote`, {
            state: { provider: { ...profile, providerProfileId: Number(providerId) } },
          })
        }
        disabled={!state?.serviceRequestId}
      >
        Request a quote
      </Button>
      {!state?.serviceRequestId && (
        <p className="mt-2 text-center text-xs text-gray-500">
          Start from "Describe your problem" to request a quote.
        </p>
      )}
    </Screen>
  );
}
