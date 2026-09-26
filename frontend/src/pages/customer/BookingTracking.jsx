import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import Loading from "../../components/common/Loading.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import { TextArea } from "../../components/common/Field.jsx";
import JobSupportActions from "../../components/common/JobSupportActions.jsx";
import { getBooking, getBookingTimeline, mockCharge, updateBookingStatus } from "../../api/services.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatZAR } from "../../lib/format.js";
import {
  STEP_ACTIONS,
  STEP_LABELS,
  WORK_STEPS,
  customerCanCancel,
  isFinished,
  nextStep,
} from "../../lib/bookingSteps.js";

// How often the tracker checks for the other side's updates while it's open.
const REFRESH_MS = 15000;

function formatWhen(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/**
 * The work tracker, shared by both sides of a booking. The provider moves the job forward
 * (accepted → on the way → in progress → completed), optionally with a note for the customer;
 * either side can cancel within the rules BookingService enforces. The timeline shows when each
 * step happened and who made it, and the page refreshes itself so each side sees the other's
 * updates.
 */
export default function BookingTracking() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = useCallback(async () => {
    try {
      const [loaded, events] = await Promise.all([
        getBooking(bookingId),
        getBookingTimeline(bookingId).catch(() => []),
      ]);
      setBooking(loaded);
      setTimeline(events);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.status === 403
          ? "This booking belongs to someone else."
          : "Couldn't load this booking — is the backend running?"
      );
    }
  }, [bookingId]);

  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  if (!booking) {
    return (
      <Screen title="Work tracker">
        {error ? <ErrorBanner>{error}</ErrorBanner> : <Loading />}
      </Screen>
    );
  }

  const quote = booking.quote;
  const request = quote?.serviceRequest;
  const providerUser = quote?.providerProfile?.user;
  const customer = request?.user;
  const isProvider = user?.id != null && providerUser?.id === user.id;
  const status = booking.status;
  const cancelled = status === "CANCELLED";
  const currentIndex = WORK_STEPS.indexOf(status);
  const next = nextStep(status);
  const canCancel = !isFinished(status) && (isProvider || customerCanCancel(status));
  const hasReview = Boolean(booking.review);

  // Latest time and note recorded for each step, from the timeline.
  const stepEvents = {};
  for (const event of timeline) stepEvents[event.status] = event;
  const cancelEvent = stepEvents.CANCELLED;

  const changeStatus = async (target) => {
    setBusy(true);
    setError("");
    try {
      await updateBookingStatus(booking.id, target, note);
      if (target === "COMPLETED") {
        // Payment is mocked in this build; completing the job is what triggers the charge.
        await mockCharge(booking.id, quote.amount).catch((err) => console.error(err));
      }
      setNote("");
      setConfirmCancel(false);
      await load();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Couldn't update the job. Please try again.");
      load();
    } finally {
      setBusy(false);
    }
  };

  const otherParty = isProvider
    ? `${customer?.firstName ?? "Customer"} ${customer?.lastName ?? ""}`.trim()
    : `${providerUser?.firstName ?? ""} ${providerUser?.lastName ?? ""}`.trim() || "Your provider";
  const scheduled = [booking.scheduledDate, booking.scheduledTime?.slice(0, 5)].filter(Boolean).join(" at ");

  return (
    <Screen
      title="Work tracker"
      subtitle={`${request?.service?.name ?? "Job"} · ${isProvider ? "for" : "with"} ${otherParty}`}
      size="wide"
    >
      <div className="lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:items-start lg:gap-6">
        <div>
          {/* Job summary */}
          <Card className="lg:p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-sm leading-6 text-gray-700">{request?.description}</p>
              <p className="shrink-0 text-xl font-extrabold text-brand">{formatZAR(quote?.amount)}</p>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {request?.location}
              {scheduled ? ` · Scheduled ${scheduled}` : ""}
            </p>
          </Card>

          {/* Timeline */}
          <Card className="mt-4 lg:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-ink">Progress</h2>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                  cancelled
                    ? "bg-red-50 text-red-700"
                    : status === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-brand-soft text-brand"
                }`}
              >
                {STEP_LABELS[status] ?? status}
              </span>
            </div>

            <ol className="mt-4">
              {WORK_STEPS.map((step, i) => {
                const done = !cancelled ? i <= currentIndex : Boolean(stepEvents[step]);
                const current = !cancelled && i === currentIndex && status !== "COMPLETED";
                const event = stepEvents[step];
                const last = i === WORK_STEPS.length - 1;
                return (
                  <li key={step} className="relative flex gap-3 pb-5 last:pb-0">
                    {!last && (
                      <span
                        aria-hidden="true"
                        className={`absolute left-3 top-6 h-[calc(100%-1.25rem)] w-0.5 ${done && i < currentIndex ? "bg-brand" : "bg-gray-200"}`}
                      />
                    )}
                    <span
                      className={`relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                        done ? "bg-brand text-white" : "border-2 border-gray-200 bg-white text-gray-300"
                      } ${current ? "ring-4 ring-brand/20" : ""}`}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                        <p className={done ? "font-semibold text-gray-900" : "text-gray-400"}>{STEP_LABELS[step]}</p>
                        {event?.at && <p className="text-xs text-gray-400">{formatWhen(event.at)}</p>}
                      </div>
                      {event?.note && (
                        <p className="mt-1 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                          {event.changedBy === "PROVIDER" ? "Provider" : "Customer"}: “{event.note}”
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>

            {cancelled && (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                <p className="font-bold">
                  Cancelled{cancelEvent?.changedBy ? ` by the ${cancelEvent.changedBy.toLowerCase()}` : ""}
                  {cancelEvent?.at ? ` · ${formatWhen(cancelEvent.at)}` : ""}
                </p>
                {cancelEvent?.note && <p className="mt-1">“{cancelEvent.note}”</p>}
              </div>
            )}
          </Card>
        </div>

        {/* Actions */}
        <div className="mt-4 space-y-3 lg:mt-0">
          {error && <ErrorBanner>{error}</ErrorBanner>}

          {isProvider && next && (
            <Card className="lg:p-6">
              <h2 className="font-bold text-ink">Update the customer</h2>
              <p className="mt-0.5 text-xs text-gray-500">They see each step and your note on their tracker.</p>
              <div className="mt-3">
                <TextArea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={280}
                  placeholder="Optional note, e.g. “Arriving in 20 minutes”"
                  className="min-h-[80px]"
                />
              </div>
              <button
                type="button"
                onClick={() => changeStatus(next)}
                disabled={busy}
                className="mt-3 w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
              >
                {busy ? "Updating…" : STEP_ACTIONS[next]}
              </button>
              {/* Skipping ahead, e.g. a job next door needs no "on the way". */}
              {WORK_STEPS.slice(WORK_STEPS.indexOf(next) + 1).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {WORK_STEPS.slice(WORK_STEPS.indexOf(next) + 1).map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => changeStatus(step)}
                      disabled={busy}
                      className="rounded-lg border border-brand/25 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/5 disabled:opacity-50"
                    >
                      Skip to: {STEP_LABELS[step]}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )}

          {!isProvider && !isFinished(status) && (
            <Card className="lg:p-6">
              <p className="text-sm text-gray-600">
                {status === "REQUEST_SENT"
                  ? "Waiting for the provider to accept the job."
                  : status === "ACCEPTED"
                    ? "The provider has accepted. You'll see it here when they set off."
                    : status === "ON_THE_WAY"
                      ? "The provider is on the way."
                      : "The provider is working on the job."}
              </p>
              <p className="mt-1 text-xs text-gray-400">This page updates automatically.</p>
            </Card>
          )}

          {canCancel && (
            <Card className="lg:p-6">
              {confirmCancel ? (
                <>
                  <p className="text-sm font-semibold text-gray-900">Cancel this job?</p>
                  <p className="mt-0.5 text-xs text-gray-500">This can't be undone. A reason helps the other side.</p>
                  <div className="mt-2">
                    <TextArea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={280}
                      placeholder="Reason (optional)"
                      className="min-h-[70px]"
                    />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => changeStatus("CANCELLED")}
                      disabled={busy}
                      className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {busy ? "Cancelling…" : "Yes, cancel job"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmCancel(false)}
                      disabled={busy}
                      className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
                    >
                      Keep job
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmCancel(true)}
                  className="w-full text-center text-sm font-semibold text-red-600 hover:underline"
                >
                  Cancel job
                </button>
              )}
            </Card>
          )}

          <Card className="lg:p-6">
            <JobSupportActions
              otherPartyName={isProvider ? customer?.firstName || "the customer" : providerUser?.firstName || "the provider"}
              {...(isProvider ? { customerUserId: customer?.id } : { providerProfileId: quote?.providerProfile?.id })}
            />
          </Card>

          {!isProvider && status === "COMPLETED" && !hasReview && (
            <button
              onClick={() => navigate(`/bookings/${bookingId}/review`)}
              className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
            >
              Rate {providerUser?.firstName ?? "your provider"}
            </button>
          )}

          {status === "COMPLETED" && hasReview && (
            <div className="rounded-xl bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700">
              {isProvider ? "Customer rated this job " : "You rated this job "}
              <span className="text-amber-500" aria-label={`${booking.review.rating} out of 5 stars`}>
                {"★".repeat(booking.review.rating)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Screen>
  );
}
