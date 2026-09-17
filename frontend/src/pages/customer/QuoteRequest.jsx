import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import { Field, TextArea, TextInput } from "../../components/common/Field.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import { createQuote, acceptQuote, estimatePrice, getServiceRequest } from "../../api/services.js";
import { formatRange } from "../../lib/format.js";

export default function QuoteRequest() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const provider = state?.provider;
  const mainService = provider?.services?.[0];

  const [preferredTime, setPreferredTime] = useState("Today · As soon as possible");
  const [message, setMessage] = useState(
    `Please check the ${mainService?.serviceName?.toLowerCase() ?? "job"} and let me know the total cost before starting.`
  );
  const [expectedRange, setExpectedRange] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!mainService) return;
    getServiceRequest(id)
      .then((req) => estimatePrice(mainService.serviceName.toLowerCase(), req.description))
      .then((price) => setExpectedRange(price))
      .catch(() => setExpectedRange(null));
  }, [id, mainService]);

  if (!provider) {
    return (
      <Screen title="Request a quote">
        <p className="text-sm text-gray-500">
          Missing provider details — go back to "Compare Providers" and pick a provider first.
        </p>
      </Screen>
    );
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const amount = mainService ? (mainService.minPrice + mainService.maxPrice) / 2 : 0;
      const quote = await createQuote({
        serviceRequestId: Number(id),
        providerProfileId: provider.providerProfileId,
        amount,
        message,
      });
      // MVP shortcut: auto-accept immediately (no separate provider-response step yet, §9a)
      const booking = await acceptQuote(quote.id, { scheduledDate: null, scheduledTime: null });
      navigate(`/bookings/${booking.id}/confirmation`);
    } catch (err) {
      setError("Couldn't send the quote request — is the backend running?");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen title="Request a quote" subtitle="Confirm the job details before sending.">
      <Card>
        <p className="text-sm font-medium text-gray-500">Service</p>
        <p className="font-semibold text-gray-900">{mainService?.serviceName ?? "Service"}</p>
      </Card>

      <div className="mt-4 space-y-4">
        <Field label="Preferred time">
          <TextInput value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} />
        </Field>
        <Field label="Message to provider">
          <TextArea value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
      </div>

      {expectedRange?.estimated_min_zar != null && (
        <p className="mt-4 font-medium text-brand">
          Expected price range: {formatRange(expectedRange.estimated_min_zar, expectedRange.estimated_max_zar)}
        </p>
      )}

      {error && <div className="mt-4"><ErrorBanner>{error}</ErrorBanner></div>}

      <Button onClick={handleSubmit} disabled={submitting} className="mt-6">
        {submitting ? "Sending..." : "Send quote request"}
      </Button>
      <p className="mt-2 text-center text-xs text-gray-500">You only pay after agreeing to the quote.</p>
    </Screen>
  );
}
