import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import Loading from "../../components/common/Loading.jsx";
import ProviderCard from "../../components/common/ProviderCard.jsx";
import { TextInput } from "../../components/common/Field.jsx";
import { getOnboarding } from "../../lib/preferences.js";
import { classifyMessage, getMatchingProviders, getMyServiceRequests, listServices } from "../../api/services.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

function requestRoute(req) {
  return req.status === "OPEN" ? `/requests/${req.id}/matches` : `/requests/${req.id}/quotes`;
}

function greeting(language) {
  const hour = new Date().getHours();
  const dict = {
    en: ["Good morning", "Good afternoon", "Good evening"],
    zu: ["Sawubona", "Sawubona", "Sawubona"],
    tn: ["Dumela", "Dumela", "Dumela"],
    af: ["Goeiemôre", "Goeiemiddag", "Goeienaand"],
  };
  const labels = dict[language] || dict.en;
  if (hour < 12) return labels[0];
  if (hour < 18) return labels[1];
  return labels[2];
}

const ACTIVE_STATUSES = ["OPEN", "QUOTED", "BOOKED"];

export default function CustomerHome() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { name } = getOnboarding();
  const [recentRequests, setRecentRequests] = useState([]);
  const [services, setServices] = useState([]);

  const [aiQuery, setAiQuery] = useState("");
  const [aiSearching, setAiSearching] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [aiExplanation, setAiExplanation] = useState("");
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    // First time here (no onboarding prefs saved yet) — mirrors ProviderDashboard's redirect
    // to ProviderOnboarding on an empty profile.
    if (!name) {
      navigate("/onboarding", { replace: true });
      return;
    }
    getMyServiceRequests().then(setRecentRequests).catch(() => setRecentRequests([]));
    listServices().then(setServices).catch(() => setServices([]));
  }, [name, navigate]);

  const activeCount = recentRequests.filter((r) => ACTIVE_STATUSES.includes(r.status)).length;
  const completedCount = recentRequests.filter((r) => r.status === "COMPLETED").length;

  // Real AI call (POST /classify) to figure out the service category from free text, then
  // simple keyword heuristics on the same text to sort/filter the real matches — see PROJECT.md.
  const handleAiSearch = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiSearching(true);
    setAiError("");
    setAiResults(null);
    try {
      const classification = await classifyMessage(aiQuery);
      const allServices = services.length ? services : await listServices();
      const matched = allServices.find((s) => s.name.toLowerCase() === classification.category?.toLowerCase());

      if (!matched) {
        setAiError(`Couldn't match that to a service we support yet (AI thought: "${classification.category}").`);
        setAiResults([]);
        return;
      }

      let list = await getMatchingProviders(matched.id);
      const q = aiQuery.toLowerCase();
      let why = `Showing ${matched.name.toLowerCase()} providers`;

      if (/cheap|afford|budget|low.?cost|inexpensive/.test(q)) {
        list = [...list].sort((a, b) => a.minPrice - b.minPrice);
        why += ", cheapest first";
      } else if (/best|top|good|highly.?rated|highest.?rat/.test(q)) {
        list = [...list].sort((a, b) => b.rating - a.rating);
        why += ", highest rated first";
      } else {
        list = [...list].sort((a, b) => b.rating - a.rating);
      }

      if (/today|now|asap|urgent|immediately/.test(q)) {
        const availableOnly = list.filter((p) => p.availableToday);
        if (availableOnly.length > 0) {
          list = availableOnly;
          why += ", available today";
        }
      }

      setAiExplanation(why + ".");
      setAiResults(list);
    } catch (err) {
      setAiError("Couldn't reach the AI service — make sure it's running.");
      console.error(err);
    } finally {
      setAiSearching(false);
    }
  };

  const handleBrowseCategory = async (service) => {
    setAiQuery("");
    setAiSearching(true);
    setAiError("");
    setAiResults(null);
    try {
      const list = await getMatchingProviders(service.id);
      setAiExplanation(`Showing ${service.name.toLowerCase()} providers, highest rated first.`);
      setAiResults([...list].sort((a, b) => b.rating - a.rating));
    } catch (err) {
      setAiError("Couldn't load providers — is the backend running?");
      console.error(err);
    } finally {
      setAiSearching(false);
    }
  };

  return (
    <Screen showBack={false} withNav>
      <p className="text-sm text-gray-500">
        {greeting(language)}, {name || "there"}
      </p>
      <h1 className="mt-1 text-2xl font-bold text-gray-900">{t("customer.helpTitle")}</h1>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card>
          <p className="text-3xl font-bold text-brand">{activeCount}</p>
          <p className="text-sm text-gray-500">{t("customer.activeRequests")}</p>
        </Card>
        <Card>
          <p className="text-3xl font-bold text-brand">{completedCount}</p>
          <p className="text-sm text-gray-500">{t("customer.completedJobs")}</p>
        </Card>
      </div>

      <button
        onClick={() => navigate("/requests/new")}
        className="mt-4 w-full rounded-xl bg-brand p-4 text-left text-white transition-colors hover:bg-brand-dark"
      >
        <p className="text-lg font-semibold">{t("customer.describe")}</p>
        <p className="text-sm text-white/80">{t("customer.describeSubtitle")}</p>
      </button>

      <Card className="mt-4">
        <p className="mb-2 text-sm font-semibold text-gray-900">{t("customer.findProvider")}</p>
        <form onSubmit={handleAiSearch} className="flex gap-2">
          <TextInput
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="e.g. cheap plumber available today"
            className="flex-1"
          />
          <button
            type="submit"
            disabled={aiSearching || !aiQuery.trim()}
            className="rounded-lg bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
          >
            {t("customer.askAi")}
          </button>
        </form>

        {aiSearching && <div className="mt-3"><Loading label="Asking AI..." /></div>}
        {aiError && <div className="mt-3"><ErrorBanner>{aiError}</ErrorBanner></div>}
        {aiExplanation && aiResults?.length > 0 && (
          <p className="mt-3 text-xs italic text-gray-500">{aiExplanation}</p>
        )}
        {aiResults?.length === 0 && !aiError && (
          <p className="mt-3 text-sm text-gray-500">{t("customer.noResults")}</p>
        )}
        {aiResults?.length > 0 && (
          <div className="mt-2 space-y-2">
            {aiResults.map((p) => (
              <ProviderCard key={p.providerProfileId} provider={p} onClick={() => navigate(`/providers/${p.providerProfileId}`)} />
            ))}
          </div>
        )}
      </Card>

      <div className="mt-6">
        <h2 className="mb-2 text-base font-semibold text-gray-900">{t("customer.recent")}</h2>
        {recentRequests.length === 0 && (
          <EmptyState>{t("customer.noRequests")}</EmptyState>
        )}
        {recentRequests.slice(0, 3).map((req) => (
          <Card key={req.id} className="mb-2 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{req.service?.name ?? "Service request"}</p>
              <p className="text-sm capitalize text-gray-500">{req.status?.toLowerCase().replace("_", " ")}</p>
            </div>
            <button
              onClick={() => navigate(requestRoute(req))}
              className="text-sm font-medium text-brand hover:underline"
            >
              View
            </button>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-base font-semibold text-gray-900">{t("customer.browse")}</h2>
        {services.length === 0 ? (
          <EmptyState>{t("customer.loadingServices")}</EmptyState>
        ) : (
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => handleBrowseCategory(s)}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-brand hover:text-brand"
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}
