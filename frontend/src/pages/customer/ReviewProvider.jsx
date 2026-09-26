import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Button from "../../components/common/Button.jsx";
import { TextArea } from "../../components/common/Field.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import Loading from "../../components/common/Loading.jsx";
import { getBooking, submitReview } from "../../api/services.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { resizeImage } from "../../lib/imageResize.js";

const MAX_PHOTOS = 3;

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
  const [photos, setPhotos] = useState([]); // resized JPEG data URLs
  const [addingPhotos, setAddingPhotos] = useState(false);
  const photoInputRef = useRef(null);

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

  const handlePhotoSelect = async (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ""; // so choosing the same file again still fires onChange
    if (!files.length) return;

    const room = MAX_PHOTOS - photos.length;
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (images.length < files.length) setError("Only image files can be attached.");
    else if (images.length > room) setError(`You can attach up to ${MAX_PHOTOS} photos.`);
    else setError("");

    setAddingPhotos(true);
    try {
      const resized = await Promise.all(images.slice(0, room).map((file) => resizeImage(file)));
      setPhotos((current) => [...current, ...resized].slice(0, MAX_PHOTOS));
    } catch {
      setError("One of those photos couldn't be read. Please try a different image.");
    } finally {
      setAddingPhotos(false);
    }
  };

  const removePhoto = (index) => setPhotos((current) => current.filter((_, i) => i !== index));

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
      await submitReview(bookingId, { rating, comment: comment.trim(), photos });
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
        maxLength={2000}
        placeholder={t("customer.reviewPlaceholder")}
      />
      <p className="mt-1.5 flex justify-between gap-3 text-xs text-gray-400">
        <span>Your first name, rating, comment and photos will appear on the provider's profile.</span>
        <span className="shrink-0">{comment.length}/2000</span>
      </p>

      <div className="mt-5">
        <p className="text-sm font-semibold text-gray-800">
          Photos of the work <span className="font-normal text-gray-400">(optional, up to {MAX_PHOTOS})</span>
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {photos.map((src, index) => (
            <div key={index} className="relative h-20 w-20 overflow-hidden rounded-xl border border-gray-200">
              <img src={src} alt={`Attached photo ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                aria-label={`Remove photo ${index + 1}`}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-xs font-bold text-white hover:bg-black/80"
              >
                ✕
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={addingPhotos}
              className="grid h-20 w-20 place-items-center rounded-xl border-2 border-dashed border-brand/25 text-center text-xs font-semibold text-brand transition-colors hover:bg-brand/5 disabled:cursor-wait disabled:opacity-60"
            >
              {addingPhotos ? "Adding…" : <span><span className="block text-xl leading-none">+</span>Add photo</span>}
            </button>
          )}
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handlePhotoSelect}
        />
      </div>

      {error && <div className="mt-4"><ErrorBanner>{error}</ErrorBanner></div>}
      <Button className="mt-6" onClick={handleSubmit} disabled={submitting || addingPhotos}>
        {submitting ? t("customer.sending") : t("customer.submitReview")}
      </Button>
    </Screen>
  );
}
