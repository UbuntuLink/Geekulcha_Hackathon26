import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import Loading from "../../components/common/Loading.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import { getBooking } from "../../api/services.js";
import { formatZAR } from "../../lib/format.js";

export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getBooking(bookingId)
      .then(setBooking)
      .catch((err) => {
        setError("Couldn't load this booking — is the backend running?");
        console.error(err);
      });
  }, [bookingId]);

  if (error) {
    return (
      <Screen title="Booking confirmed" showBack={false}>
        <ErrorBanner>{error}</ErrorBanner>
      </Screen>
    );
  }

  if (!booking) {
    return (
      <Screen title="Booking confirmed" showBack={false}>
        <Loading />
      </Screen>
    );
  }

  const providerName = `${booking.quote.providerProfile.user.firstName} ${booking.quote.providerProfile.user.lastName ?? ""}`.trim();

  return (
    <Screen title="Booking confirmed" showBack={false}>
      <div className="flex flex-col items-center py-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-3xl text-white">
          ✓
        </div>
        <p className="mt-4 text-lg font-semibold text-gray-900">You're booked with {providerName}</p>
      </div>

      <Card>
        <p className="text-sm font-medium text-gray-500">Job summary</p>
        <p className="mt-1 text-gray-900">{booking.quote.serviceRequest?.description}</p>
        <p className="mt-2 font-semibold text-brand">{formatZAR(booking.quote.amount)}</p>
      </Card>

      <Button className="mt-6" onClick={() => navigate(`/bookings/${booking.id}`)}>
        View booking
      </Button>
    </Screen>
  );
}
