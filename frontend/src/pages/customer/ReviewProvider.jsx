import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Button from "../../components/common/Button.jsx";
import { TextArea } from "../../components/common/Field.jsx";
import { submitReview } from "../../api/services.js";

export default function ReviewProvider() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitReview(bookingId, { rating, comment });
      setDone(true);
    } catch (err) {
      alert("Couldn't submit the review — is the backend running?");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Screen title="Thank you!" showBack={false}>
        <p className="text-gray-600">Your review helps other customers find great providers.</p>
        <Button className="mt-6" onClick={() => navigate("/home")}>
          Back to home
        </Button>
      </Screen>
    );
  }

  return (
    <Screen title="Review provider" subtitle="How was your experience?">
      <div className="flex justify-center gap-2 py-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className={`text-4xl ${star <= rating ? "text-amber-500" : "text-gray-300"}`}
          >
            ★
          </button>
        ))}
      </div>
      <TextArea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Fast, professional and affordable."
      />
      <Button className="mt-6" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Submitting..." : "Submit review"}
      </Button>
    </Screen>
  );
}
