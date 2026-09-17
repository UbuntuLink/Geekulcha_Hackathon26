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
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 20, 100));
    }, 250);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const timeout = setTimeout(() => {
        navigate(`/requests/${id}/matches`, { state: { serviceId } });
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [progress, id, serviceId, navigate]);

  return (
    <Screen title="Understanding your request" subtitle="UbuntuLink AI is identifying the service you need.">
      <Card>
        <p className="text-sm font-medium text-gray-500">Your problem</p>
        <p className="mt-1 italic text-gray-900">"{classification.job_description}"</p>
      </Card>

      <div className="mt-4 rounded-xl bg-brand p-4 text-white">
        <p className="text-sm">✓ Service identified</p>
        <p className="text-lg font-bold">{capitalize(classification.category)}</p>
      </div>

      <p className="mt-6 text-sm font-medium text-gray-700">Finding providers near you...</p>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div className="h-full bg-brand transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Matching on service, distance, price, ratings and availability.
      </p>

      <button
        onClick={() => navigate(`/requests/${id}/matches`, { state: { serviceId } })}
        className="mt-6 text-sm font-medium text-brand"
      >
        Skip →
      </button>
    </Screen>
  );
}
