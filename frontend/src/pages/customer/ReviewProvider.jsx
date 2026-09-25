import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Button from "../../components/common/Button.jsx";
import { TextArea } from "../../components/common/Field.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import Loading from "../../components/common/Loading.jsx";
import { getBooking, submitReview } from "../../api/services.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

function bookingHasReview(booking) {
  return Boolean(
    booking?.review ||
    booking?.reviewId ||
    booking?.reviewed ||
    booking?.hasReview
  );
}

export default function ReviewProvider() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    getBooking(bookingId)
      .then((data) => {
        if (active) setBooking(data);
      })
      .catch((err) => {
        console.error(err);
        if (active) setError("Couldn't load this booking.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [bookingId]);

  const handleSubmit = async () => {
    if (booking?.status !== "COMPLETED") {
      setError("You can only review a booking after the provider marks it as completed.");
      return;
    }

    if (bookingHasReview(booking)) {
      setError("A review has already been submitted for this booking.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await submitReview(bookingId, { rating, comment: comment.trim() });
      setDone(true);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 409) {
        setError("A review has already been submitted for this booking.");
      } else if (status === 400 || status === 403) {
        setError(err?.response?.data?.message || "This booking cannot be reviewed yet.");
      } else {
        setError("Couldn't submit the review. Please try again.");
      }
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Screen title={t("customer.reviewTitle")}>
        <Loading />
      </Screen>
    );
  }

  if (!booking) {
    return (
      <Screen title={t("customer.reviewTitle")}>
        <ErrorBanner>{error || "Booking not found."}</ErrorBanner>
      </Screen>
    );
  }

  if (booking.status !== "COMPLETED") {
    return (
      <Screen title={t("customer.reviewTitle")}>
        <ErrorBanner>You can leave a review once this booking has been marked as completed.</ErrorBanner>
        <Button className="mt-6" onClick={() => navigate(`/bookings/${bookingId}`)}>
          Back to booking
        </Button>
      </Screen>
    );
  }

  if (bookingHasReview(booking) && !done) {
    return (
      <Screen title={t("customer.reviewTitle")}>
        <p className="text-gray-600">You've already reviewed this booking.</p>
        <Button className="mt-6" onClick={() => navigate(`/bookings/${bookingId}`)}>
          Back to booking
        </Button>
      </Screen>
    );
  }

  if (done) {
    return (
      <Screen title={t("customer.thankYou")} showBack={false}>
        <p className="text-gray-600">{t("customer.reviewThanks")}</p>
        <Button className="mt-6" onClick={() => navigate(user?.isProvider ? "/provider/dashboard" : "/home")}>
          {t("customer.backHome")}
        </Button>
      </Screen>
    );
  }

  return (
    <Screen title={t("customer.reviewTitle")} subtitle={t("customer.reviewSubtitle")}>
      <div className="flex justify-center gap-2 py-4" aria-label="Choose a rating out of five">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            onClick={() => setRating(star)}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            className={`text-4xl transition-colors ${star <= rating ? "text-amber-500" : "text-gray-300 hover:text-amber-300"}`}
          >
            ★
          </button>
        ))}
      </div>
      <TextArea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t("customer.reviewPlaceholder")}
      />
      {error && <div className="mt-4"><ErrorBanner>{error}</ErrorBanner></div>}
      <Button className="mt-6" onClick={handleSubmit} disabled={submitting}>
        {submitting ? t("customer.sending") : t("customer.submitReview")}
      </Button>
    </Screen>
  );
}
