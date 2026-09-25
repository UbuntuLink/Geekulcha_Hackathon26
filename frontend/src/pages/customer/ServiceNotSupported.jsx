import { useLocation, useNavigate } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";

export default function ServiceNotSupported() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { originalDescription, advice } = state || {};

  return (
    <Screen
      title="We don’t offer that service yet"
      subtitle="We’ve saved the request anonymously as demand data so UbuntuLink can learn what customers need next."
      eyebrow="Service unavailable"
    >
      <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-brand-soft text-2xl text-brand">↗</div>

      <Card>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Your request</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-ink">{originalDescription || "Unsupported service request"}</p>
      </Card>

      {advice && (
        <div className="mt-4 rounded-2xl border border-brand/15 bg-brand-mist p-4">
          <div className="flex gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-brand shadow-sm">i</span>
            <div>
              <p className="text-sm font-bold text-brand">A helpful next step</p>
              <p className="mt-1 text-sm leading-6 text-gray-700">{advice}</p>
            </div>
          </div>
        </div>
      )}

      <Button onClick={() => navigate("/home")} className="mt-6">Back to home</Button>
      <Button variant="ghost" onClick={() => navigate("/requests/new")} className="mt-2">Describe a different problem</Button>
    </Screen>
  );
}
