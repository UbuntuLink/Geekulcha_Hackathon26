import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { Link, useNavigate, useParams } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import Loading from "../../components/common/Loading.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { acceptQuote, getMyQuotes, rejectQuote } from "../../api/services.js";
import { formatZAR } from "../../lib/format.js";
import { useAuth } from "../../context/AuthContext.jsx";
import JobSupportActions from "../../components/common/JobSupportActions.jsx";

// How often the page checks for new quotes while it's open and visible.
const REFRESH_MS = 15000;

// Shown beside the status colour, so it's readable without telling colours apart.
const STATUS_ICONS = { PENDING: "⏳", ACCEPTED: "✓", REJECTED: "✕", WITHDRAWN: "↩" };

const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-gray-100 text-gray-500",
  WITHDRAWN: "bg-gray-100 text-gray-500",
};

function timeAgo(value) {
  const seconds = Math.max(0, (Date.now() - new Date(value).getTime()) / 1000);
  if (!Number.isFinite(seconds)) return "";
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return new Date(value).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

/**
 * Every quote on the customer's requests, in one place. It refreshes itself, so a quote a
 * provider sends while the customer is looking appears without a reload, marked "New".
 * /requests/:id/quotes opens the same page filtered to that one request.
 */
export default function Quotes() {
  const { id: requestFilter } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [quotes, setQuotes] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [newIds, setNewIds] = useState(() => new Set());
  const seenIds = useRef(null); // ids from the first load; anything after that is "new"

  const load = useCallback(async () => {
    try {
      const list = await getMyQuotes();
      if (seenIds.current === null) {
        seenIds.current = new Set(list.map((quote) => quote.id));
      } else {
        const fresh = list.filter((quote) => !seenIds.current.has(quote.id)).map((quote) => quote.id);
        if (fresh.length) {
          fresh.forEach((quoteId) => seenIds.current.add(quoteId));
          setNewIds((current) => new Set([...current, ...fresh]));
        }
      }
      setQuotes(list);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Couldn't load your quotes. We'll keep trying.");
    }
  }, []);

  // Load now, then poll while the tab is visible, and refresh as soon as it's looked at again.
  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_MS);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  // Grouped by request: pending quotes first, then newest.
  const groups = useMemo(() => {
    if (!quotes) return null;
    const visible = requestFilter ? quotes.filter((quote) => String(quote.requestId) === String(requestFilter)) : quotes;
    const byRequest = new Map();
    for (const quote of visible) {
      if (!byRequest.has(quote.requestId)) byRequest.set(quote.requestId, []);
      byRequest.get(quote.requestId).push(quote);
    }
    const order = (quote) => (quote.status === "PENDING" ? 0 : 1);
    return [...byRequest.values()].map((list) =>
      list.sort((a, b) => order(a) - order(b) || new Date(b.createdAt) - new Date(a.createdAt))
    );
  }, [quotes, requestFilter]);

  const pendingCount = quotes?.filter((quote) => quote.status === "PENDING").length ?? 0;

  const handleAccept = async (quote) => {
    setBusyId(quote.id);
    setError("");
    try {
      const booking = await acceptQuote(quote.id, { scheduledDate: null, scheduledTime: null });
      navigate(`/bookings/${booking.id}/confirmation`);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Couldn't accept that quote. Please try again.");
      load();
    } finally {
      setBusyId(null);
    }
  };

  const handleDecline = async (quote) => {
    setBusyId(quote.id);
    setError("");
    try {
      await rejectQuote(quote.id);
      await load();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Couldn't decline that quote. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Screen
      title={t("quotes.title")}
      subtitle={
        quotes === null
          ? t("quotes.checking")
          : pendingCount
            ? `${pendingCount} quote${pendingCount === 1 ? "" : "s"} waiting for your answer`
            : "Offers from providers on your requests"
      }
      showBack={Boolean(requestFilter)}
      withNav={!requestFilter}
      navRole={user?.isProvider ? "provider" : "customer"}
      size="wide"
    >
      {error && <div className="mb-4"><ErrorBanner>{error}</ErrorBanner></div>}
      {quotes === null && !error && <Loading label={t("quotes.checking")} />}

      {requestFilter && quotes !== null && (
        <p className="mb-4 text-sm">
          <Link to="/quotes" className="font-semibold text-brand hover:underline">← All quotes</Link>
        </p>
      )}

      {groups?.length === 0 && (
        <EmptyState>
          No quotes yet. When a provider quotes on {requestFilter ? "this request" : "one of your requests"}, it appears here
          automatically — no need to refresh.
        </EmptyState>
      )}

      <div className="space-y-5">
        {groups?.map((list) => {
          const request = list[0];
          const open = request.requestStatus === "OPEN" || request.requestStatus === "QUOTED";
          return (
            <section key={request.requestId} aria-labelledby={`request-${request.requestId}`}>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3">
                <h2 id={`request-${request.requestId}`} className="text-sm font-extrabold text-ink">
                  {request.serviceName || "Service request"}
                  <span className="ml-2 font-medium text-gray-500">
                    {request.requestDescription?.length > 70
                      ? `${request.requestDescription.slice(0, 70)}…`
                      : request.requestDescription}
                  </span>
                </h2>
                {!open && <span className="text-xs font-semibold text-gray-500">Request {request.requestStatus.toLowerCase()}</span>}
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {list.map((quote) => (
                  <Card key={quote.id} className={newIds.has(quote.id) ? "ring-2 ring-brand/40" : ""}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => navigate(`/providers/${quote.providerProfileId}`)}
                          className="text-left font-bold text-gray-900 hover:text-brand hover:underline"
                        >
                          {quote.providerName}
                        </button>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {quote.providerReviewCount > 0 ? (
                            <>
                              <span className="text-amber-500">★</span> {quote.providerRating.toFixed(1)} ·{" "}
                              {quote.providerReviewCount} review{quote.providerReviewCount === 1 ? "" : "s"}
                            </>
                          ) : (
                            "No reviews yet"
                          )}
                          {" · "}
                          {timeAgo(quote.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {newIds.has(quote.id) && (
                          <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold uppercase text-white">New</span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${STATUS_STYLES[quote.status] ?? ""}`}>
                          <span aria-hidden="true">{STATUS_ICONS[quote.status]} </span>
                          {quote.status.toLowerCase()}
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 text-2xl font-extrabold text-brand">{formatZAR(quote.amount)}</p>
                    {quote.message && <p className="mt-1 whitespace-pre-line text-sm leading-6 text-gray-600">{quote.message}</p>}

                    <div className="mt-3">
                      <JobSupportActions
                        otherPartyName={quote.providerName.split(" ")[0]}
                        providerProfileId={quote.providerProfileId}
                        compact
                      />
                    </div>

                    {quote.status === "PENDING" && open && (
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleAccept(quote)}
                          disabled={busyId !== null}
                          className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
                        >
                          {busyId === quote.id ? "Working…" : t("quotes.accept")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecline(quote)}
                          disabled={busyId !== null}
                          className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                        >
                          {t("quotes.decline")}
                        </button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {quotes !== null && (
        <p className="mt-6 text-center text-xs text-gray-500">{t("quotes.autoUpdate")}</p>
      )}
    </Screen>
  );
}
