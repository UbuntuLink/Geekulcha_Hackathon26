import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Screen from "../../components/layout/Screen.jsx";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import Loading from "../../components/common/Loading.jsx";
import ProgressSteps from "../../components/common/ProgressSteps.jsx";

import { refineDescription, createServiceRequest, getMyProviderProfile } from "../../api/services.js";
import { getOnboarding } from "../../lib/preferences.js";
import { useAuth } from "../../context/AuthContext.jsx";

const urgencyStyle = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-orange-50 text-orange-700",
  emergency: "bg-red-50 text-red-700",
};

export default function ReviewRequest() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { originalDescription, classification, serviceId } = location.state || {};

  const originalAiDescription = classification?.job_description || originalDescription || "";
  const [jobDescription, setJobDescription] = useState(originalAiDescription);
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [lastRefinedDetails, setLastRefinedDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(false);

  const handleUpdateDescription = async () => {
    const details = additionalDetails.trim();
    if (!details) {
      setError("Please enter some additional information about the problem.");
      return;
    }

    setLoading(true);
    setError("");
    setUpdated(false);

    try {
      const result = await refineDescription(originalAiDescription, details);
      setJobDescription(result.job_description);

      if (!result.is_relevant) {
        setError("That doesn't seem related to the original problem. Please add details that help explain this request.");
        return;
      }

      setLastRefinedDetails(details);
      setUpdated(true);
    } catch (err) {
      console.error(err);
      setError("Couldn't update the request description. Please try again.");
    } finally {
      setLoading(false);
      setSending(false);
    }
  };

  const handleFindProviders = async () => {
    if (loading) return;
    setError("");
    const currentDetails = additionalDetails.trim();

    if (currentDetails && currentDetails !== lastRefinedDetails) {
      setError("You changed the additional details. Update the request summary before continuing.");
      return;
    }

    setLoading(true);
    setSending(true);
    try {
      const finalClassification = {
        ...classification,
        additional_details: currentDetails || null,
        job_description: jobDescription,
      };

      let requestLocation = getOnboarding().location || null;
      if (!requestLocation && user?.isProvider) {
        const providerProfile = await getMyProviderProfile().catch(() => null);
        requestLocation = providerProfile?.location || null;
      }

      const created = await createServiceRequest({
        description: jobDescription,
        // Falls back to the provider profile's location for a provider who never went through
        // customer onboarding — see requestLocation above.
        location: requestLocation,
        preferredDate: null,
        aiClassificationRaw: JSON.stringify(finalClassification),
        serviceId: serviceId ?? null,
      });

      navigate(`/requests/${created.id}/classification`, {
        state: { classification: finalClassification, serviceId: serviceId ?? null, justSubmitted: true },
      });
    } catch (err) {
      console.error(err);
      setError("Couldn't create the service request. Please try again.");
    } finally {
      setLoading(false);
      setSending(false);
    }
  };

  if (!classification) {
    return (
      <Screen title="Review your request" subtitle="Check your request before continuing." size="compact">
        <ErrorBanner>We couldn't find the request information. Please go back and describe your problem again.</ErrorBanner>
        <Button onClick={() => navigate(-1)} className="mt-6">Go back</Button>
      </Screen>
    );
  }

  return (
    <Screen
      title="Review your request"
      subtitle="UbuntuLink has cleaned up your description. Add anything useful before we find providers."
      eyebrow="Step 2 of 3"
      size="wide"
    >
      <ProgressSteps current={2} className="mb-6 max-w-3xl" />

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold capitalize text-brand">{classification.category}</span>
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${urgencyStyle[classification.urgency] || urgencyStyle.medium}`}>
          {classification.urgency} urgency
        </span>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.78fr)] lg:items-start lg:gap-6 xl:gap-8">
        <div className="space-y-3">
          <Card className="lg:p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">✦</span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand/60">Provider-ready summary</p>
                <p className="mt-2 text-[15px] font-semibold leading-6 text-ink lg:text-base lg:leading-7">{jobDescription}</p>
              </div>
            </div>
            {updated && <p className="mt-3 rounded-xl bg-brand-mist px-3 py-2 text-xs font-semibold text-brand">✓ Updated with your additional details</p>}
          </Card>

          <details className="rounded-2xl border border-white/80 bg-white/60 px-4 py-3 text-sm text-gray-600 shadow-sm lg:px-5 lg:py-4">
            <summary className="cursor-pointer font-semibold text-gray-700">See what you originally wrote</summary>
            <p className="mt-2 leading-6 text-gray-500">{originalDescription}</p>
          </details>
        </div>

        <Card className="mt-4 lg:sticky lg:top-8 lg:mt-0 lg:p-6">
          <label htmlFor="additional-details" className="text-sm font-bold text-ink lg:text-base">Anything else providers should know?</label>
          <p className="mt-1 text-xs leading-5 text-gray-500 lg:text-sm lg:leading-6">Optional. Add symptoms, timing, severity, or anything that makes the job clearer.</p>
          <textarea
            id="additional-details"
            value={additionalDetails}
            onChange={(e) => {
              const value = e.target.value;
              setAdditionalDetails(value);
              setError("");
              setUpdated(false);
              if (!value.trim()) {
                setJobDescription(originalAiDescription);
                setLastRefinedDetails("");
              }
            }}
            placeholder="e.g. The water is leaking underneath the sink and started this morning."
            className="mt-3 min-h-[130px] w-full resize-y rounded-2xl border border-gray-200 bg-brand-mist/40 p-3.5 text-sm leading-6 transition-all placeholder:text-gray-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10 lg:min-h-[170px]"
          />
          <Button variant="soft" onClick={handleUpdateDescription} disabled={loading || !additionalDetails.trim()} className="mt-3">
            {loading && !sending ? "Updating summary..." : "Update AI summary"}
          </Button>
        </Card>
      </div>

      {error && <div className="mt-4"><ErrorBanner>{error}</ErrorBanner></div>}
      {loading && <div className="mt-3 rounded-2xl border border-brand/15 bg-brand-mist px-4"><Loading label={sending ? "Sending your request…" : "Checking and refining your details..."} /></div>}

      <div className="mt-5 lg:flex lg:items-center lg:justify-end lg:gap-4">
        <p className="mb-2 text-center text-xs text-gray-400 lg:mb-0">Your request is only saved when you continue.</p>
        <Button onClick={handleFindProviders} disabled={loading} className="lg:max-w-[320px]">
          {sending ? <><span className="send-spinner" aria-hidden="true" /> Sending request…</> : <>Find matching providers <span aria-hidden="true">→</span></>}
        </Button>
      </div>
    </Screen>
  );
}
