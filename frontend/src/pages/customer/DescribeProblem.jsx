import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Screen from "../../components/layout/Screen.jsx";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import Loading from "../../components/common/Loading.jsx";
import ProgressSteps from "../../components/common/ProgressSteps.jsx";

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
    if (!description.trim()) return;

    setLoading(true);
    setError("");

    try {
      const classification = await classifyMessage(description.trim());

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

      const services = await listServices().catch(() => []);
      const matchedService = services.find(
        (service) => service.name?.toLowerCase() === classification.category?.toLowerCase()
      );

      navigate("/requests/review", {
        state: {
          originalDescription: description.trim(),
          classification,
          serviceId: matchedService?.id ?? null,
        },
      });
    } catch (err) {
      console.error(err);
      setError("We couldn't process that request right now. Make sure the AI service and backend are running, then try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      title="Tell us what’s going on"
      subtitle="Write it naturally. UbuntuLink AI will turn it into a clear service request before anything is saved."
      eyebrow="Step 1 of 3"
      size="wide"
    >
      <ProgressSteps current={1} className="mb-6 max-w-3xl" />

      <div className="lg:grid lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.65fr)] lg:items-start lg:gap-5 xl:gap-7">
        <Card className="lg:p-6 xl:p-7">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-ink lg:text-base">Describe the problem</p>
              <p className="mt-0.5 text-xs text-gray-500 lg:text-sm">Include what happened, where it is, and how urgent it feels.</p>
            </div>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand lg:h-10 lg:w-10">✦</span>
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            placeholder="e.g. My kitchen sink is leaking underneath and I need someone to look at it today."
            className="min-h-[190px] w-full resize-y rounded-2xl border border-gray-200 bg-brand-mist/45 p-4 text-sm leading-6 text-gray-900 transition-all placeholder:text-gray-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10 lg:min-h-[260px] lg:p-5 lg:text-[15px] lg:leading-7"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
            <span>Plain language is perfect.</span>
            <span>{description.length}/1000</span>
          </div>
        </Card>

        <div className="mt-3 space-y-3 lg:mt-0">
          <Card className="lg:p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-ink">Add a photo</p>
                <p className="mt-0.5 text-xs leading-5 text-gray-500">Optional — useful for damage, leaks, or visible faults.</p>
              </div>
              <button
                type="button"
                onClick={() => alert("Photo upload is coming soon.")}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-dashed border-brand/30 bg-brand-mist text-xl font-light text-brand transition-all hover:-translate-y-0.5 hover:border-brand hover:bg-brand-soft active:scale-95"
                aria-label="Add a photo"
              >
                +
              </button>
            </div>
          </Card>

          <Card className="hidden lg:block lg:p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand/60">What happens next</p>
            <div className="mt-4 space-y-4">
              {[
                ["1", "AI identifies the service", "We classify your problem and create a clearer summary."],
                ["2", "You review it", "Add extra details before anything is saved."],
                ["3", "We find providers", "You’ll see matching providers for the service."],
              ].map(([number, heading, copy]) => (
                <div key={number} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-extrabold text-brand">{number}</span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{heading}</p>
                    <p className="mt-0.5 text-xs leading-5 text-gray-500">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {error && <div className="mt-4"><ErrorBanner>{error}</ErrorBanner></div>}

      {loading && (
        <div className="mt-4 rounded-2xl border border-brand/15 bg-brand-mist px-4">
          <Loading label="UbuntuLink AI is reading your request and identifying the right service..." />
        </div>
      )}

      <div className="mt-5 lg:flex lg:justify-end">
        <Button onClick={handleSubmit} disabled={loading || !description.trim()} className="lg:max-w-[320px]">
          {loading ? "Understanding your request..." : <>Review my request <span aria-hidden="true">→</span></>}
        </Button>
      </div>
    </Screen>
  );
}
