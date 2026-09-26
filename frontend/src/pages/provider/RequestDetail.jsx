import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import Loading from "../../components/common/Loading.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import { Field, TextArea, TextInput } from "../../components/common/Field.jsx";
import { createQuote, getMyServiceRequests, getServiceRequest } from "../../api/services.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [request, setRequest] = useState(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [isOwnRequest, setIsOwnRequest] = useState(false);

  useEffect(() => {
    Promise.all([getServiceRequest(id), getMyServiceRequests().catch(() => [])])
      .then(([loadedRequest, ownRequests]) => {
        setRequest(loadedRequest);
        setIsOwnRequest(ownRequests.some((ownRequest) => Number(ownRequest.id) === Number(id)));
      })
      .catch((err) => {
        setError("Couldn't load this request — is the backend running?");
        console.error(err);
      });
  }, [id]);

  const handleSubmit = async () => {
    if (isOwnRequest) {
      setError("You can't submit a quote on your own service request.");
      return;
    }

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a quote amount greater than R0.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await createQuote({ serviceRequestId: Number(id), amount: value, message: message.trim() });
      setDone(true);
    } catch (err) {
      // The server says why (already quoted, request booked or withdrawn, own request...), so
      // show that instead of one catch-all guess.
      const status = err?.response?.status;
      setError(
        err?.response?.data?.message ||
          (status === 404
            ? "This request no longer exists, or your provider profile is missing."
            : "Couldn't send the quote. Check your connection and try again.")
      );
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Screen title="Quote sent">
        <p className="text-gray-600">
          The customer can now see and accept your quote. It's listed under "Quotes awaiting the customer" on
          your Bookings page, and becomes a booking when they accept.
        </p>
        <Button className="mt-6" onClick={() => navigate("/provider/bookings")}>
          Go to my bookings
        </Button>
        <Button variant="outline" className="mt-3" onClick={() => navigate("/provider/requests")}>
          Back to requests
        </Button>
      </Screen>
    );
  }

  if (!request) {
    return (
      <Screen title={t("nav.requests")}>
        {error ? <ErrorBanner>{error}</ErrorBanner> : <Loading />}
      </Screen>
    );
  }

  return (
    <Screen title={request.service?.name ?? t("nav.requests")}>
      <Card>
        <p className="text-sm font-medium text-gray-500">Customer's description</p>
        <p className="mt-1 text-gray-900">{request.description}</p>
        <p className="mt-2 text-sm text-gray-500">{request.location}</p>
      </Card>

      {isOwnRequest && (
        <div className="mt-4">
          <ErrorBanner>This is your own service request, so you cannot quote on it as a provider.</ErrorBanner>
        </div>
      )}

      <div className="mt-4 space-y-4">
        <Field label="Your quote (ZAR)">
          <TextInput type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="450" />
        </Field>
        <Field label="Message to customer">
          <TextArea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="I can come by today..." />
        </Field>
      </div>

      {error && <div className="mt-4"><ErrorBanner>{error}</ErrorBanner></div>}

      <Button onClick={handleSubmit} disabled={submitting || !amount || isOwnRequest} className="mt-6">
        {submitting ? t("customer.sending") : "Send quote"}
      </Button>
    </Screen>
  );
}
