import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import Loading from "../../components/common/Loading.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import { Field, TextArea, TextInput } from "../../components/common/Field.jsx";
import { createQuote, getServiceRequest } from "../../api/services.js";

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    getServiceRequest(id)
      .then(setRequest)
      .catch((err) => {
        setError("Couldn't load this request — is the backend running?");
        console.error(err);
      });
  }, [id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await createQuote({ serviceRequestId: Number(id), amount: Number(amount), message });
      setDone(true);
    } catch (err) {
      setError("Couldn't submit the quote — make sure you've added a service offering on your profile first.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Screen title="Quote sent">
        <p className="text-gray-600">The customer can now see and accept your quote.</p>
        <Button className="mt-6" onClick={() => navigate("/provider/requests")}>
          Back to requests
        </Button>
      </Screen>
    );
  }

  if (!request) {
    return (
      <Screen title="Request detail">
        {error ? <ErrorBanner>{error}</ErrorBanner> : <Loading />}
      </Screen>
    );
  }

  return (
    <Screen title={request.service?.name ?? "Request detail"}>
      <Card>
        <p className="text-sm font-medium text-gray-500">Customer's description</p>
        <p className="mt-1 text-gray-900">{request.description}</p>
        <p className="mt-2 text-sm text-gray-500">{request.location}</p>
      </Card>

      <div className="mt-4 space-y-4">
        <Field label="Your quote (ZAR)">
          <TextInput type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="450" />
        </Field>
        <Field label="Message to customer">
          <TextArea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="I can come by today..." />
        </Field>
      </div>

      {error && <div className="mt-4"><ErrorBanner>{error}</ErrorBanner></div>}

      <Button onClick={handleSubmit} disabled={submitting || !amount} className="mt-6">
        {submitting ? "Sending..." : "Send quote"}
      </Button>
    </Screen>
  );
}
