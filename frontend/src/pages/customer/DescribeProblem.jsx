import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Button from "../../components/common/Button.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import Loading from "../../components/common/Loading.jsx";
import { classifyMessage, createServiceRequest, listServices } from "../../api/services.js";
import { getOnboarding } from "../../lib/preferences.js";

export default function DescribeProblem() {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError("");
    try {
      const classification = await classifyMessage(description);
      const services = await listServices().catch(() => []);
      const matchedService = services.find(
        (s) => s.name.toLowerCase() === classification.category?.toLowerCase()
      );

      const created = await createServiceRequest({
        description,
        location: getOnboarding().location || null,
        preferredDate: null,
        aiClassificationRaw: JSON.stringify(classification),
        serviceId: matchedService?.id ?? null,
      });

      navigate(`/requests/${created.id}/classification`, {
        state: { classification, serviceId: matchedService?.id ?? null },
      });
    } catch (err) {
      setError(
        "Couldn't reach the ML service or backend — make sure both are running locally (see INSTRUCTIONS.md)."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="Describe your problem" subtitle="Tell us what's happening in your own words.">
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="My kitchen sink is leaking and I need someone to fix it today."
        className="min-h-[140px] w-full rounded-xl border border-gray-200 bg-white p-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />

      <p className="mb-2 mt-4 text-sm font-medium text-gray-700">Add a photo (optional)</p>
      <button
        type="button"
        onClick={() => alert("Photo upload is coming soon.")}
        className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-2xl text-gray-400 transition-colors hover:border-brand hover:text-brand"
      >
        +
      </button>

      {error && <div className="mt-4"><ErrorBanner>{error}</ErrorBanner></div>}

      {loading && (
        <div className="mt-4 rounded-lg border border-brand/30 bg-brand/5 px-3 py-2">
          <Loading label="🤖 Asking AI to read your problem and identify the right service..." />
        </div>
      )}

      <Button onClick={handleSubmit} disabled={loading || !description.trim()} className="mt-6">
        {loading ? "Asking AI..." : "Find the right service"}
      </Button>
    </Screen>
  );
}
