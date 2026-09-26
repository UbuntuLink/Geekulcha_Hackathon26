import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Loading from "../../components/common/Loading.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getMyQuotes, getMyServiceRequests, deleteServiceRequest } from "../../api/services.js";

function requestRoute(req) {
  const bookingId = req.bookingId ?? req.booking?.id ?? null;
  if (bookingId) return `/bookings/${bookingId}`;
  return req.status === "OPEN" ? `/requests/${req.id}/matches` : `/requests/${req.id}/quotes`;
}

export default function MyRequests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const deleteInFlight = useRef(false);
  // Pending quotes per request id, so each request says when an offer is waiting.
  const [pendingQuotes, setPendingQuotes] = useState({});

  const handleDelete = async (id) => {
    if (deleteInFlight.current) return;
    deleteInFlight.current = true;
    setDeletingId(id);
    setError("");
    try {
      await deleteServiceRequest(id);
      setRequests((current) => current.filter((request) => request.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't delete this request. Please try again.");
    } finally {
      deleteInFlight.current = false;
      setDeletingId(null);
    }
  };

  useEffect(() => {
    let active = true;
    getMyServiceRequests()
      .then((result) => { if (active) setRequests(result); })
      .catch(() => { if (active) setError("Couldn't load your requests. Please refresh to try again."); });
    getMyQuotes()
      .then((quotes) => {
        if (!active) return;
        const counts = {};
        quotes.filter((quote) => quote.status === "PENDING").forEach((quote) => {
          counts[quote.requestId] = (counts[quote.requestId] ?? 0) + 1;
        });
        setPendingQuotes(counts);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const totalPending = Object.values(pendingQuotes).reduce((sum, count) => sum + count, 0);

  return (
    <Screen title="Your requests" showBack={false} withNav navRole={user?.isProvider ? "provider" : "customer"}>
      {requests === null && !error && <Loading label="Loading your requests…" />}
      {error && <ErrorBanner>{error}</ErrorBanner>}
      {requests?.length === 0 && <EmptyState>No requests yet.</EmptyState>}
      {totalPending > 0 && (
        <button
          type="button"
          onClick={() => navigate("/quotes")}
          className="mb-4 flex w-full items-center justify-between gap-3 rounded-2xl bg-brand px-4 py-3.5 text-left text-white shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <span>
            <span className="block text-sm font-extrabold">
              {totalPending} quote{totalPending === 1 ? "" : "s"} waiting for your answer
            </span>
            <span className="block text-xs text-white/75">Compare offers and accept the one you want.</span>
          </span>
          <span className="shrink-0 text-lg">→</span>
        </button>
      )}
      {requests?.map((req) => (
        <Card
          key={req.id}
          className="mb-2 transition-shadow hover:shadow-md"
        >
          <button type="button" className="w-full rounded-lg text-left focus-visible:outline-brand" onClick={() => navigate(requestRoute(req))}>
            <p className="font-medium text-gray-900">{req.description}</p>
            <p className="text-sm capitalize text-gray-500">
              {req.status?.toLowerCase().replace("_", " ")}
              {pendingQuotes[req.id] > 0 && (
                <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold normal-case text-amber-700">
                  {pendingQuotes[req.id]} new quote{pendingQuotes[req.id] === 1 ? "" : "s"}
                </span>
              )}
            </p>
          </button>
          {["OPEN", "QUOTED"].includes(req.status) && !req.bookingId && !req.booking?.id && (
            <div className="mt-3 border-t border-brand/10 pt-3">
              {confirmDeleteId === req.id ? (
                <div>
                  <p className="text-sm text-gray-600">Delete this request and its quotes? This cannot be undone.</p>
                  <div className="mt-2 flex gap-3">
                    <button type="button" disabled={deletingId !== null} onClick={() => handleDelete(req.id)} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50">
                      {deletingId === req.id ? "Deleting…" : "Yes, delete"}
                    </button>
                    <button type="button" disabled={deletingId !== null} onClick={() => setConfirmDeleteId(null)} className="rounded-lg px-3 py-2 text-xs font-bold text-gray-600 hover:bg-brand-mist disabled:opacity-50">Keep request</button>
                  </div>
                </div>
              ) : (
                <button type="button" disabled={deletingId !== null} onClick={() => setConfirmDeleteId(req.id)} className="rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">Delete request</button>
              )}
            </div>
          )}
        </Card>
      ))}
    </Screen>
  );
}
