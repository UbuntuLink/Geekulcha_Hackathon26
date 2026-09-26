import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import Loading from "../../components/common/Loading.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import {
  getMyBookings,
  getQuoteRequestsForMe,
  getSentQuotes,
  mockCharge,
  updateBookingStatus,
} from "../../api/services.js";
import { formatZAR } from "../../lib/format.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

const STEPS = ["REQUEST_SENT", "ACCEPTED", "ON_THE_WAY", "COMPLETED"];
const STEP_LABELS = {
  REQUEST_SENT: "Request sent",
  ACCEPTED: "Accepted",
  ON_THE_WAY: "On the way",
  COMPLETED: "Completed",
};

/** This is where booking status actually advances now — the customer's view is read-only. */
export default function ProviderBookings() {
  const { t } = useLanguage();
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const navigate = useNavigate();
  // Work that hasn't become a booking yet: requests customers sent to this provider, and quotes
  // the provider sent that the customer hasn't answered. A booking only exists once a customer
  // accepts a quote, so without these the page stayed empty through the whole quoting stage.
  const [asked, setAsked] = useState(null);
  const [awaiting, setAwaiting] = useState(null);

  const load = () =>
    getMyBookings()
      .then(setBookings)
      .catch((err) => {
        setError("Couldn't load your bookings — is the backend running?");
        console.error(err);
      });

  const loadPipeline = () => {
    getQuoteRequestsForMe()
      .then((list) => setAsked(list.filter((request) => !request.alreadyQuoted)))
      .catch(() => setAsked([]));
    getSentQuotes()
      .then((list) => setAwaiting(list.filter((quote) => quote.status === "PENDING")))
      .catch(() => setAwaiting([]));
  };

  // Refresh while the page is open, so an accepted quote moves into Bookings on its own.
  useEffect(() => {
    load();
    loadPipeline();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        load();
        loadPipeline();
      }
    }, 20000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = async (booking) => {
    const currentIndex = STEPS.indexOf(booking.status);
    const next = STEPS[Math.min(currentIndex + 1, STEPS.length - 1)];
    setBusyId(booking.id);
    try {
      await updateBookingStatus(booking.id, next);
      if (next === "COMPLETED") {
        await mockCharge(booking.id, booking.quote.amount);
      }
      await load();
    } catch (err) {
      setError("Couldn't update that booking — is the backend running?");
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Screen title={t("provider.myBookings")} showBack={false} withNav navRole="provider">
      {error && <ErrorBanner>{error}</ErrorBanner>}
      {bookings === null && !error && <Loading />}

      {asked?.length > 0 && (
        <section className="mb-6" aria-labelledby="asked-heading">
          <h2 id="asked-heading" className="text-sm font-extrabold text-ink">Quote requests for you ({asked.length})</h2>
          <p className="mb-2 mt-0.5 text-xs text-gray-500">Customers asked you specifically. Send a quote to answer.</p>
          <div className="space-y-2">
            {asked.map((request) => (
              <Card key={request.requestId} onClick={() => navigate(`/provider/requests/${request.requestId}`)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{request.serviceName ?? "Service request"}</p>
                    <p className="mt-0.5 text-sm text-gray-600">{request.description}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {request.customerFirstName}
                      {request.location ? ` · ${request.location}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white">Send quote →</span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {awaiting?.length > 0 && (
        <section className="mb-6" aria-labelledby="awaiting-heading">
          <h2 id="awaiting-heading" className="text-sm font-extrabold text-ink">Quotes awaiting the customer ({awaiting.length})</h2>
          <p className="mb-2 mt-0.5 text-xs text-gray-500">They become bookings below when the customer accepts.</p>
          <div className="space-y-2">
            {awaiting.map((quote) => (
              <Card key={quote.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{quote.serviceName ?? "Service request"}</p>
                    <p className="mt-0.5 text-sm text-gray-600">{quote.requestDescription}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-extrabold text-brand">{formatZAR(quote.amount)}</p>
                    <p className="text-xs text-amber-700">Waiting</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {(asked?.length > 0 || awaiting?.length > 0) && (
        <h2 className="mb-2 text-sm font-extrabold text-ink">Bookings</h2>
      )}
      {bookings?.length === 0 && (
        <EmptyState>No bookings yet. When a customer accepts one of your quotes, it appears here.</EmptyState>
      )}

      <div className="space-y-3">
        {bookings?.map((b) => {
          const currentIndex = STEPS.indexOf(b.status);
          return (
            <Card key={b.id}>
              <p className="font-semibold text-gray-900">{b.quote.serviceRequest?.description}</p>
              <p className="mt-1 text-sm text-gray-500">
                {b.quote.serviceRequest?.user?.firstName} {b.quote.serviceRequest?.user?.lastName} · {formatZAR(b.quote.amount)}
              </p>
              <p className="mt-2 text-sm font-medium text-brand">{STEP_LABELS[b.status]}</p>
              {b.status !== "COMPLETED" && (
                <button
                  onClick={() => advance(b)}
                  disabled={busyId === b.id}
                  className="mt-3 w-full rounded-lg border border-brand py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/5 disabled:opacity-50"
                >
                  {busyId === b.id ? "Updating..." : `Mark "${STEP_LABELS[STEPS[currentIndex + 1]]}"`}
                </button>
              )}
            </Card>
          );
        })}
      </div>
    </Screen>
  );
}
