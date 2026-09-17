import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import Loading from "../../components/common/Loading.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import { getBooking, mockCharge, updateBookingStatus } from "../../api/services.js";

const STEPS = ["REQUEST_SENT", "ACCEPTED", "ON_THE_WAY", "COMPLETED"];
const STEP_LABELS = {
  REQUEST_SENT: "Request sent",
  ACCEPTED: "Accepted",
  ON_THE_WAY: "On the way",
  COMPLETED: "Completed",
};

export default function BookingTracking() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = () =>
    getBooking(bookingId)
      .then(setBooking)
      .catch((err) => {
        setError("Couldn't load this booking — is the backend running?");
        console.error(err);
      });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  if (!booking) {
    return (
      <Screen title="Booking tracking">
        {error ? <ErrorBanner>{error}</ErrorBanner> : <Loading />}
      </Screen>
    );
  }

  const currentIndex = STEPS.indexOf(booking.status);

  const advance = async () => {
    setBusy(true);
    setError("");
    try {
      const next = STEPS[Math.min(currentIndex + 1, STEPS.length - 1)];
      await updateBookingStatus(bookingId, next);
      if (next === "COMPLETED") {
        await mockCharge(bookingId, booking.quote.amount);
      }
      await load();
    } catch (err) {
      setError("Couldn't update the booking — is the backend running?");
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Booking tracking" subtitle="ETA: today">
      <Card>
        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs text-white ${
                  i <= currentIndex ? "bg-brand" : "bg-gray-300"
                }`}
              >
                {i <= currentIndex ? "✓" : ""}
              </div>
              <p className={i <= currentIndex ? "font-medium text-gray-900" : "text-gray-400"}>
                {STEP_LABELS[step]}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {error && <div className="mt-4"><ErrorBanner>{error}</ErrorBanner></div>}

      {booking.status !== "COMPLETED" && (
        <button
          onClick={advance}
          disabled={busy}
          className="mt-4 w-full rounded-lg border border-brand py-2.5 text-sm font-medium text-brand transition-colors hover:bg-brand/5 disabled:opacity-50"
        >
          {busy ? "Updating..." : `Simulate: mark "${STEP_LABELS[STEPS[currentIndex + 1]]}"`}
        </button>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => alert("Messaging isn't built yet — see PROJECT.md §9d.")}
          className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Message provider
        </button>
        <button
          onClick={() => alert("Dispute reporting isn't built yet — see PROJECT.md §9d.")}
          className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Report an issue
        </button>
      </div>

      {booking.status === "COMPLETED" && (
        <button
          onClick={() => navigate(`/bookings/${bookingId}/review`)}
          className="mt-4 w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Leave a review
        </button>
      )}
    </Screen>
  );
}
