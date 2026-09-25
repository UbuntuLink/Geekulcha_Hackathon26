import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import Loading from "../../components/common/Loading.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { acceptQuote, getQuotesForRequest, rejectQuote } from "../../api/services.js";
import { formatZAR } from "../../lib/format.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

/** Real "View Quotes / Accept/Reject Quote" (PROJECT.md §4) — replaces the old auto-accept shortcut. */
export default function RequestQuotes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [quotes, setQuotes] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () =>
    getQuotesForRequest(id)
      .then(setQuotes)
      .catch((err) => {
        setError("Couldn't load quotes — is the backend running?");
        console.error(err);
      });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAccept = async (quoteId) => {
    setBusyId(quoteId);
    try {
      const booking = await acceptQuote(quoteId, { scheduledDate: null, scheduledTime: null });
      navigate(`/bookings/${booking.id}/confirmation`);
    } catch (err) {
      setError("Couldn't accept that quote — is the backend running?");
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (quoteId) => {
    setBusyId(quoteId);
    try {
      await rejectQuote(quoteId);
      await load();
    } catch (err) {
      setError("Couldn't decline that quote — is the backend running?");
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Screen title={t("customer.quotesReceived")} subtitle={t("customer.quotesReceivedSubtitle")}>
      {error && <ErrorBanner>{error}</ErrorBanner>}
      {quotes === null && !error && <Loading label={t("customer.checkingQuotes")} />}
      {quotes?.length === 0 && <EmptyState>{t("customer.noQuotes")}</EmptyState>}

      <div className="space-y-3">
        {quotes?.map((q) => (
          <Card key={q.id}>
            <div className="flex items-start justify-between">
              <p className="font-semibold text-gray-900">
                {q.providerProfile.user.firstName} {q.providerProfile.user.lastName}
              </p>
              {q.status !== "PENDING" && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-600">
                  {q.status.toLowerCase()}
                </span>
              )}
            </div>
            <p className="mt-1 font-semibold text-brand">{formatZAR(q.amount)}</p>
            {q.message && <p className="mt-1 text-sm text-gray-600">"{q.message}"</p>}
            {q.status === "PENDING" && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleAccept(q.id)}
                  disabled={busyId === q.id}
                  className="flex-1 rounded-lg bg-brand py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
                >
                  {t("customer.accept")}
                </button>
                <button
                  onClick={() => handleReject(q.id)}
                  disabled={busyId === q.id}
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  {t("customer.decline")}
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </Screen>
  );
}
