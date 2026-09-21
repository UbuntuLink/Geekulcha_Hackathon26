import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Button from "../../components/common/Button.jsx";
import { TextArea } from "../../components/common/Field.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import { submitReview } from "../../api/services.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function ReviewProvider() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await submitReview(bookingId, { rating, comment });
      setDone(true);
    } catch (err) {
      setError("Couldn't submit the review — is the backend running?");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Screen title={t("customer.thankYou")} showBack={false}>
        <p className="text-gray-600">{t("customer.reviewThanks")}</p>
        <Button className="mt-6" onClick={() => navigate("/home")}>
          {t("customer.backHome")}
        </Button>
      </Screen>
    );
  }

  return (
    <Screen title={t("customer.reviewTitle")} subtitle={t("customer.reviewSubtitle")}>
      <div className="flex justify-center gap-2 py-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
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
