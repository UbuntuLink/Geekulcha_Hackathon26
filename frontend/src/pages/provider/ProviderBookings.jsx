import { useEffect, useState } from "react";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import Loading from "../../components/common/Loading.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { getMyBookings, mockCharge, updateBookingStatus } from "../../api/services.js";
import { formatZAR } from "../../lib/format.js";

const STEPS = ["REQUEST_SENT", "ACCEPTED", "ON_THE_WAY", "COMPLETED"];
const STEP_LABELS = {
  REQUEST_SENT: "Request sent",
  ACCEPTED: "Accepted",
  ON_THE_WAY: "On the way",
  COMPLETED: "Completed",
};

/** This is where booking status actually advances now — the customer's view is read-only. */
export default function ProviderBookings() {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () =>
    getMyBookings()
      .then(setBookings)
      .catch((err) => {
        setError("Couldn't load your bookings — is the backend running?");
        console.error(err);
      });

  useEffect(() => {
    load();
  }, []);

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
    <Screen title="My bookings" showBack={false} withNav navRole="provider">
      {error && <ErrorBanner>{error}</ErrorBanner>}
      {bookings === null && !error && <Loading />}
      {bookings?.length === 0 && <EmptyState>No bookings yet.</EmptyState>}

      <div className="space-y-3">
        {bookings?.map((b) => {
          const currentIndex = STEPS.indexOf(b.status);
          return (
            <Card key={b.id}>
              <p className="font-semibold text-gray-900">{b.quote.serviceRequest?.description}</p>
              <p className="mt-1 text-sm text-gray-500">
                {b.quote.serviceRequest?.user?.firstName} {b.quote.serviceRequest?.user?.lastName} ·{" "}
                {formatZAR(b.quote.amount)}
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
