import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import Loading from "../../components/common/Loading.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import JobSupportActions from "../../components/common/JobSupportActions.jsx";
import { getMyProviderProfile, getProviderProfile, reviewPhotoUrl } from "../../api/services.js";
import { formatRange } from "../../lib/format.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

// Reviews shown before "Show all", so a long history doesn't bury the Request quote button.
const INITIAL_REVIEWS = 4;

function Stars({ value, className = "" }) {
  const filled = Math.round(value ?? 0);
  return (
    <span className={`tracking-[0.08em] ${className}`} aria-label={`${(value ?? 0).toFixed(1)} out of 5 stars`}>
      <span className="text-amber-500">{"★".repeat(filled)}</span>
      <span className="text-gray-300">{"★".repeat(5 - filled)}</span>
    </span>
  );
}

function formatReviewDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function initialsOf(name) {
  return (name || "?").split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function ProviderProfileView() {
  const { providerId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [ownProviderProfileId, setOwnProviderProfileId] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [openPhotoId, setOpenPhotoId] = useState(null);

  // Close the enlarged photo with Escape.
  useEffect(() => {
    if (openPhotoId == null) return undefined;
    const onKey = (event) => event.key === "Escape" && setOpenPhotoId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPhotoId]);

  useEffect(() => {
    setProfile(null);
    setError("");
    setShowAllReviews(false);
    getProviderProfile(providerId)
      .then(setProfile)
      .catch((err) => {
        setError("Couldn't load this provider — is the backend running?");
        console.error(err);
      });

    if (user?.isProvider) {
      getMyProviderProfile()
        .then((ownProfile) => setOwnProviderProfileId(ownProfile.providerProfileId))
        .catch(() => setOwnProviderProfileId(null));
    } else {
      setOwnProviderProfileId(null);
    }
  }, [providerId, user?.isProvider]);

  // How many reviews gave each star count, 5 down to 1, for the breakdown bars.
  const breakdown = useMemo(() => {
    const reviews = profile?.reviews ?? [];
    return [5, 4, 3, 2, 1].map((stars) => {
      const count = reviews.filter((review) => review.rating === stars).length;
      return { stars, count, share: reviews.length ? count / reviews.length : 0 };
    });
  }, [profile]);

  if (error) {
    return (
      <Screen title={t("common.provider")}>
        <ErrorBanner>{error}</ErrorBanner>
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen title={t("common.provider")}>
        <Loading />
      </Screen>
    );
  }

  const isOwnProviderProfile = Number(providerId) === Number(ownProviderProfileId);
  const reviews = profile.reviews ?? [];
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, INITIAL_REVIEWS);
  const hasRating = profile.reviewCount > 0;

  const requestQuote = () =>
    navigate(`/requests/${state?.serviceRequestId}/quote`, {
      state: { provider: { ...profile, providerProfileId: Number(providerId) } },
    });

  return (
    <Screen title={profile.providerName} size="wide">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
        {/* Who they are */}
        <div className="space-y-4">
          <Card className="lg:p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-soft text-lg font-extrabold text-brand">
                {initialsOf(profile.providerName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-extrabold text-ink">{profile.providerName}</p>
                  {profile.isValidated && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                      ✓ ID verified
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {profile.location || "Location not set"} ·{" "}
                  <span className={profile.availableToday ? "font-semibold text-emerald-700" : ""}>
                    {profile.availableToday ? t("common.availableToday") : t("common.unavailableToday")}
                  </span>
                </p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  {hasRating ? (
                    <>
                      <span className="font-extrabold text-ink">{profile.rating.toFixed(1)}</span>
                      <Stars value={profile.rating} />
                      <span className="text-gray-500">
                        ({profile.reviewCount} review{profile.reviewCount === 1 ? "" : "s"})
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-500">New provider · no reviews yet</span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="lg:p-6">
            <h2 className="font-bold text-ink">{t("common.aboutProvider")}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
              {profile.bio?.trim() || "This provider hasn't written a bio yet."}
            </p>
          </Card>

          <Card className="lg:p-6">
            <h2 className="font-bold text-ink">Services offered</h2>
            {profile.services.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No services listed yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-gray-100">
                {profile.services.map((service) => (
                  <li key={service.serviceId} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="font-semibold text-gray-800">{service.serviceName}</span>
                    <span className="shrink-0 font-bold text-brand">{formatRange(service.minPrice, service.maxPrice)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* What customers say */}
        <div className="mt-4 space-y-4 lg:mt-0">
          <Card className="lg:p-6">
            <h2 className="font-bold text-ink">Ratings & reviews</h2>

            {reviews.length === 0 ? (
              <div className="mt-3">
                <EmptyState>{t("common.noReviews")}</EmptyState>
              </div>
            ) : (
              <>
                <div className="mt-4 flex items-center gap-5">
                  <div className="text-center">
                    <p className="text-4xl font-extrabold text-ink">{profile.rating.toFixed(1)}</p>
                    <Stars value={profile.rating} className="text-sm" />
                    <p className="mt-1 text-xs text-gray-500">
                      {profile.reviewCount} review{profile.reviewCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex-1 space-y-1.5" aria-label="Rating breakdown">
                    {breakdown.map(({ stars, count, share }) => (
                      <div key={stars} className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="w-6 shrink-0 text-right">{stars}★</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-amber-400" style={{ width: `${share * 100}%` }} />
                        </div>
                        <span className="w-5 shrink-0 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <ul className="mt-5 space-y-3">
                  {visibleReviews.map((review, index) => (
                    <li key={`${review.createdAt}-${index}`} className="rounded-xl border border-gray-100 bg-white/70 p-3.5">
                      <div className="flex items-start gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                          {initialsOf(review.reviewerName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                            <p className="text-sm font-bold text-gray-800">{review.reviewerName || "Customer"}</p>
                            <p className="text-xs text-gray-400">{formatReviewDate(review.createdAt)}</p>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                            <Stars value={review.rating} />
                            {review.serviceName && <span className="text-gray-500">· {review.serviceName}</span>}
                          </div>
                          {review.comment?.trim() ? (
                            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700">{review.comment}</p>
                          ) : (
                            !review.photoIds?.length && <p className="mt-2 text-xs italic text-gray-400">Rated without a comment.</p>
                          )}
                          {review.photoIds?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {review.photoIds.map((photoId, photoIndex) => (
                                <button
                                  key={photoId}
                                  type="button"
                                  onClick={() => setOpenPhotoId(photoId)}
                                  className="h-16 w-16 overflow-hidden rounded-lg border border-gray-200 transition-transform hover:scale-[1.04]"
                                  aria-label={`Open photo ${photoIndex + 1} from ${review.reviewerName || "this customer"}`}
                                >
                                  <img
                                    src={reviewPhotoUrl(photoId)}
                                    alt=""
                                    loading="lazy"
                                    className="h-full w-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {reviews.length > INITIAL_REVIEWS && (
                  <button
                    type="button"
                    onClick={() => setShowAllReviews((shown) => !shown)}
                    className="mt-3 w-full rounded-xl border border-brand/20 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand/5"
                  >
                    {showAllReviews ? "Show fewer reviews" : `Show all ${reviews.length} reviews`}
                  </button>
                )}
              </>
            )}
          </Card>

          <div>
            <Button onClick={requestQuote} disabled={!state?.serviceRequestId || isOwnProviderProfile}>
              {t("common.requestQuote")}
            </Button>
            {!state?.serviceRequestId && <p className="mt-2 text-center text-xs text-gray-500">{t("common.startFromProblem")}</p>}
            {isOwnProviderProfile && state?.serviceRequestId && (
              <p className="mt-2 text-center text-xs text-gray-500">You cannot request a quote from yourself.</p>
            )}
            {!isOwnProviderProfile && (
              <div className="mt-4">
                <JobSupportActions otherPartyName={profile.providerName.split(" ")[0]} providerProfileId={Number(providerId)} />
              </div>
            )}
          </div>
        </div>
      </div>

      {openPhotoId != null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Review photo"
          onClick={() => setOpenPhotoId(null)}
          className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-4"
        >
          <img
            src={reviewPhotoUrl(openPhotoId)}
            alt="Review photo, enlarged"
            className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
          />
          <button
            type="button"
            onClick={() => setOpenPhotoId(null)}
            aria-label="Close photo"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-lg font-bold text-white hover:bg-white/25"
          >
            ✕
          </button>
        </div>
      )}
    </Screen>
  );
}
