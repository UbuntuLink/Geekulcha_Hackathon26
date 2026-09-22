import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";

const FALLBACK_CLASSIFICATION = {
  category: "plumbing",
  job_description: "Kitchen sink is leaking and needs a same-day repair.",
};

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default function AIServiceIdentification() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const classification = state?.classification || FALLBACK_CLASSIFICATION;
  const serviceId = state?.serviceId ?? null;
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    const interval = setInterval(() => setProgress((p) => Math.min(p + 11, 100)), 180);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const timeout = setTimeout(() => navigate(`/requests/${id}/matches`, { state: { serviceId } }), 350);
      return () => clearTimeout(timeout);
    }
  }, [progress, id, serviceId, navigate]);

  return (
    <Screen title="Finding the right people" subtitle="Your request is ready. We’re matching it with providers who offer this service." eyebrow="Step 3 of 3">
      {state?.justSubmitted && <div className="request-success glass-surface mb-5 flex items-center gap-3 rounded-2xl p-4" role="status"><svg className="success-check h-10 w-10 shrink-0 text-brand" viewBox="0 0 40 40" fill="none" aria-hidden="true"><circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2"/><path d="m11 20 6 6 12-13" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg><div><p className="font-bold text-brand">Request sent</p><p className="text-sm text-gray-500">Your request has been saved successfully.</p></div></div>}
      <div className="mb-5 flex gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-brand" />
        <div className="h-1.5 flex-1 rounded-full bg-brand" />
        <div className="h-1.5 flex-1 rounded-full bg-brand" />
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-brand p-5 text-white shadow-lift">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/12 text-2xl animate-pulse-soft">✦</div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/55">Service identified</p>
            <p className="mt-1 text-xl font-extrabold">{capitalize(classification.category)}</p>
          </div>
        </div>
      </div>

      <Card className="mt-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Request summary</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-ink">{classification.job_description}</p>
      </Card>

      <div className="mt-6">
        <div className="flex items-center justify-between text-sm">
          <p className="font-bold text-ink">Matching providers</p>
          <p className="font-bold text-brand">{progress}%</p>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-brand/10">
          <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-gray-500">
          <span className="rounded-xl bg-white/70 px-2 py-2">Service fit</span>
          <span className="rounded-xl bg-white/70 px-2 py-2">Ratings</span>
          <span className="rounded-xl bg-white/70 px-2 py-2">Availability</span>
        </div>
      </div>

      <button onClick={() => navigate(`/requests/${id}/matches`, { state: { serviceId } })} className="mt-6 w-full text-center text-sm font-bold text-brand hover:underline">
        Skip matching animation →
      </button>
    </Screen>
  );
}
