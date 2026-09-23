import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Screen from "../../components/layout/Screen.jsx";
import Button from "../../components/common/Button.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import Loading from "../../components/common/Loading.jsx";

import {
  classifyMessage,
  listServices,
  createUnsupportedServiceRequest,
} from "../../api/services.js";


export default function DescribeProblem() {
  const navigate = useNavigate();

  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const handleSubmit = async () => {
    if (!description.trim()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Ask the Python/ML service to classify the user's request.
      const classification = await classifyMessage(
        description.trim()
      );

      if (classification.category?.toLowerCase() === "other") {
        await createUnsupportedServiceRequest({
          description: description.trim(),
          advice: classification.advice,
        });

        navigate("/requests/not-supported", {
          state: {
            originalDescription: description.trim(),
            advice: classification.advice,
          },
        });

        return;
      }

      // Get the available services from the Spring backend.
      const services = await listServices().catch(() => []);

      // Find the service that matches the AI category.
      const matchedService = services.find(
        (service) =>
          service.name?.toLowerCase() ===
          classification.category?.toLowerCase()
      );

      // Do NOT create the service request yet.
      // First send the user to the review screen.
      navigate("/requests/review", {
        state: {
          originalDescription: description.trim(),
          classification,
          serviceId: matchedService?.id ?? null,
        },
      });

    } catch (err) {
      console.error(err);

      setError(
        "Couldn't reach the ML service or backend — make sure both are running locally (see INSTRUCTIONS.md)."
      );

    } finally {
      setLoading(false);
    }
  };


  return (
    <Screen
      title="Describe your problem"
      subtitle="Tell us what's happening in your own words."
    >
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="My kitchen sink is leaking and I need someone to fix it today."
        className="min-h-[140px] w-full rounded-xl border border-gray-200 bg-white p-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />

      <p className="mb-2 mt-4 text-sm font-medium text-gray-700">
        Add a photo (optional)
      </p>

      <button
        type="button"
        onClick={() => alert("Photo upload is coming soon.")}
        className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-2xl text-gray-400 transition-colors hover:border-brand hover:text-brand"
      >
        +
      </button>

      {error && (
        <div className="mt-4">
          <ErrorBanner>
            {error}
          </ErrorBanner>
        </div>
      )}

      {loading && (
        <div className="mt-4 rounded-lg border border-brand/30 bg-brand/5 px-3 py-2">
          <Loading label="🤖 Asking AI to read your problem and identify the right service..." />
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={loading || !description.trim()}
        className="mt-6"
      >
        {loading
          ? "Asking AI..."
          : "Find the right service"}
      </Button>
    </Screen>
  );
}