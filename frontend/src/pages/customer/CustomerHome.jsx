import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import ServiceIcon from "../../components/common/ServiceIcon.jsx";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import Loading from "../../components/common/Loading.jsx";
import ProviderCard from "../../components/common/ProviderCard.jsx";
import { TextInput } from "../../components/common/Field.jsx";
import { getOnboarding } from "../../lib/preferences.js";
import { classifyMessage, getMatchingProviders, getMyServiceRequests, listServices } from "../../api/services.js";
import { detectIntent, matchService } from "../../lib/matching.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

function requestRoute(req) {
  return req.status === "OPEN" ? `/requests/${req.id}/matches` : `/requests/${req.id}/quotes`;
}

function greeting(t) {
  const hour = new Date().getHours();
  if (hour < 12) return t("customer.greetingMorning");
  if (hour < 18) return t("customer.greetingAfternoon");
  return t("customer.greetingEvening");
}

const SERVICE_IMAGES = {
  plumbing: "/images/services/plumbing.jpg",
  electrical: "/images/services/electrical.jpg",
  cleaning: "/images/services/cleaning.jpg",
  painting: "/images/services/painting.jpg",
  building: "/images/services/building.jpg",
  hairdressing: "/images/services/beauty.jpg",
  braiding: "/images/services/beauty.jpg",
  beauty: "/images/services/beauty.jpg",
};

function getServiceImage(name = "") {
  const key = String(name).trim().toLowerCase();
  if (!key) return null;
  const normalized = key.replace(/[^a-z]/g, "");
  const match = Object.keys(SERVICE_IMAGES).find((candidate) => normalized.includes(candidate));
  return match ? SERVICE_IMAGES[match] : null;
}

export default function CustomerHome() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { name, location } = getOnboarding();
  const [aiQuery, setAiQuery] = useState("");
  const [aiSearching, setAiSearching] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [aiExplanation, setAiExplanation] = useState("");
  const [aiError, setAiError] = useState("");
  const [recentRequests, setRecentRequests] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState("");
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");
  const [retry, setRetry] = useState(0);
  const categoryButtons = useRef(new Map());
  const providerHeading = useRef(null);
  const lastCategory = useRef(null);
  useEffect(() => {
    if (selectedCategory) providerHeading.current?.focus({ preventScroll: true });
    else if (lastCategory.current !== null) categoryButtons.current.get(lastCategory.current)?.focus({ preventScroll: true });
  }, [selectedCategory]);

  useEffect(() => {
    if (!name) {
      navigate("/onboarding", { replace: true });
      return;
    }
    getMyServiceRequests().then(setRecentRequests).catch(() => setRecentRequests([]));

  }, [name, navigate]);


  useEffect(() => {
    let active = true;
    setServicesLoading(true);
    setServicesError("");
    listServices()
      .then((items) => { if (active) setServices(items); })
      .catch(() => { if (active) setServicesError("Couldn't load categories. Please try again."); })
      .finally(() => { if (active) setServicesLoading(false); });
    return () => { active = false; };
  }, [retry]);

  useEffect(() => {
    if (!selectedCategory) return;
    let active = true;
    setProvidersLoading(true);
    setProvidersError("");
    getMatchingProviders(selectedCategory.id, getOnboarding().latitude ?? null, getOnboarding().longitude ?? null)
      .then((items) => {
        if (active) setProviders([...items].sort((a, b) => (b.rating || 0) - (a.rating || 0)));
      })
      .catch(() => { if (active) setProvidersError("Couldn't load providers. Please try again."); })
      .finally(() => { if (active) setProvidersLoading(false); });
    // Ignore stale responses if the user goes back or selects another category.
    return () => { active = false; };
  }, [selectedCategory, retry]);

  // Free-text search. The AI (POST /classify) reads the query and names a category; matchService
  // then maps that — and the person's own words — onto a real catalog row, tolerating typos,
  // synonyms and the AI naming a category differently from the database.
  //
  // The AI is an aid, not a gate: if the ML service is asleep or slow (Render free tier), the
  // query alone is matched locally rather than failing the search.
  const handleAiSearch = async (e) => {
    e.preventDefault();
    const query = aiQuery.trim();
    if (!query) return;

    setAiSearching(true);
    setAiError("");
    setAiResults(null);

    try {
      const allServices = services.length ? services : await listServices();

      let classification = null;
      let aiUnavailable = false;
      try {
        classification = await classifyMessage(query, allServices.map((item) => item.name));
      } catch (err) {
        aiUnavailable = true;
        console.error(err);
      }

      const match = matchService(allServices, classification?.category, query);

      if (!match) {
        const examples = allServices.slice(0, 4).map((item) => item.name.toLowerCase()).join(", ");
        setAiError(`Couldn't work out which service you need. Try naming the trade — ${examples} — or pick a category below.`);
        setAiResults([]);
        return;
      }

      const { latitude, longitude } = getOnboarding();
      const list = await getMatchingProviders(match.service.id, latitude ?? null, longitude ?? null);
      const { sort, urgent } = detectIntent(query, classification?.sort_preference);

      let ranked = [...list];
      let why = `Showing ${match.service.name.toLowerCase()} providers`;

      if (sort === "cheapest") {
        ranked.sort((a, b) => a.minPrice - b.minPrice);
        why += ", cheapest first";
      } else {
        ranked.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        if (sort === "best_rated") why += ", highest rated first";
      }

      if (urgent || classification?.sort_preference === "soonest") {
        const availableOnly = ranked.filter((provider) => provider.availableToday);
        if (availableOnly.length > 0) {
          ranked = availableOnly;
          why += ", available today";
        }
      }

      if (aiUnavailable) why += " (matched without AI — the service is waking up)";

      setAiExplanation(why + ".");
      setAiResults(ranked);
    } catch (err) {
      setAiError("Couldn't load providers — is the backend running?");
      console.error(err);
    } finally {
      setAiSearching(false);
    }
  };

  const handleBrowseCategory = (service) => {
    setProviders([]);
    setProvidersError("");
    setProvidersLoading(true);
    lastCategory.current = service.id;
    setSelectedCategory(service);
  };

  return (
    <Screen showBack={false} withNav size="wide" desktopNav="hero">
      <section className="home-hero hero-glass relative overflow-hidden rounded-[30px] p-5 text-white shadow-lift sm:p-6 lg:p-8 xl:p-10">
        <div className="hero-ambient" aria-hidden="true" />
        <div id="hero-navigation-anchor" aria-hidden="true" className="hero-navigation-anchor hidden lg:block" />
        <div className="relative lg:flex lg:items-end lg:justify-between lg:gap-10">
          <div className="max-w-[640px]">
            <div className="home-hero-badges">
              <span className="home-pill">Trusted local network</span>
              <span className="home-pill home-pill-soft">{location || "Your area"}</span>
            </div>
            <p className="text-sm font-semibold text-white/75">{greeting(t)}, {name || "there"}</p>
            <h1 className="mt-2 max-w-[620px] text-[1.9rem] font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-3xl lg:text-[2.75rem]">
              {t("customer.helpTitle")}
            </h1>
            <div className="home-stat-row">
              <div className="home-stat-item">
                <span>{recentRequests.length}</span>
                <small>Active requests</small>
              </div>
              <div className="home-stat-item">
                <span>24/7</span>
                <small>Fast matching</small>
              </div>
              <div className="home-stat-item">
                <span>Local</span>
                <small>Near you</small>
              </div>
            </div>
          </div>

          <div className="home-hero-panel">
            <p className="home-hero-panel-label">Need help today?</p>
            <button
              onClick={() => navigate("/requests/new")}
              className="group mt-3 flex w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3.5 text-left text-brand shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 lg:px-5"
            >
              <span>
                <span className="block text-sm font-extrabold lg:text-base">{t("customer.describe")}</span>
                <span className="mt-0.5 block text-xs font-medium text-brand/60">{t("customer.describeSubtitle")}</span>
              </span>
              <span className="shrink-0 text-xl transition-transform group-hover:translate-x-1">→</span>
            </button>
            <div className="home-hero-meta">
              <span>Vetted providers</span>
              <span>Clear quotes</span>
            </div>
          </div>
        </div>
      </section>

      <div className="home-grid mt-6">
        {/* Searching and browsing are the same job — finding someone — so they live in one card
            rather than two stacked ones competing for the same decision. */}
        <Card className="home-categories min-w-0 sm:p-6 lg:p-7">
        <div className="home-search-header">
          <div>
            <p className="mb-1 text-sm font-extrabold text-ink">{t("customer.findProvider")}</p>
            <p className="text-xs text-gray-500">Describe who you need in your own words — spelling doesn't matter.</p>
          </div>
          <span className="home-mini-chip">AI powered</span>
        </div>
        <form onSubmit={handleAiSearch} className="home-search-form">
          <TextInput
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="e.g. best rated plumber near me"
            className="flex-1"
          />
          <button
            type="submit"
            disabled={aiSearching || !aiQuery.trim()}
            className="shrink-0 rounded-xl bg-brand px-4 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-dark disabled:translate-y-0 disabled:opacity-50"
          >
            {t("customer.askAi")}
          </button>
        </form>

        {aiSearching && <div className="mt-3"><Loading label={t("customer.aiLoadingShort")} /></div>}
        {aiError && <div className="mt-3"><ErrorBanner>{aiError}</ErrorBanner></div>}
        {aiExplanation && aiResults?.length > 0 && (
          <p className="mt-3 text-xs italic text-gray-500">{aiExplanation}</p>
        )}
        {aiResults?.length === 0 && !aiError && (
          <p className="mt-3 text-sm text-gray-500">{t("customer.noResults")}</p>
        )}
        {aiResults?.length > 0 && (
          <div className="provider-results mt-3 grid gap-3 sm:grid-cols-2">
            {aiResults.map((provider) => (
              <ProviderCard
                key={provider.providerProfileId}
                provider={provider}
                onClick={() => navigate(`/providers/${provider.providerProfileId}`)}
              />
            ))}
          </div>
        )}

        <div className="mt-6 border-t border-brand/10 pt-5">
          {selectedCategory ? (
            <div key={selectedCategory.id} className="category-view">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="mb-5 inline-flex items-center gap-2 rounded-xl border border-brand/15 bg-white/70 px-3 py-2 text-sm font-bold text-brand hover:bg-white"
              >
                <span aria-hidden="true">←</span> Back to categories
              </button>
              <div className="mb-5" aria-live="polite">
                <h2 ref={providerHeading} tabIndex={-1} className="text-xl font-extrabold capitalize text-ink">{selectedCategory.name} providers</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {providersLoading ? "Loading providers…" : providersError ? "Please retry or choose another category." : `${providers.length} provider${providers.length === 1 ? "" : "s"} · Highest rated first`}
                </p>
              </div>
              {providersLoading ? <Loading label="Finding providers in this category…" /> : providersError ? (
                <div>
                  <ErrorBanner>{providersError}</ErrorBanner>
                  <button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-3 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white">Try again</button>
                </div>
              ) : providers.length === 0 ? (
                <EmptyState>No providers are listed in this category yet. Try another category.</EmptyState>
              ) : (
                <div className="provider-results grid gap-3 sm:grid-cols-2">
                  {providers.map((provider) => (
                    <ProviderCard key={provider.providerProfileId} provider={provider} onClick={() => navigate(`/providers/${provider.providerProfileId}`)} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div key="categories" className="category-view">
              <div className="mb-5">
                <h2 className="text-xl font-extrabold text-ink">{t("customer.browse")}</h2>
                <p className="mt-1 text-sm leading-6 text-gray-500">Choose a service to explore all its providers.</p>
              </div>
              {servicesLoading ? <Loading label={t("customer.loadingServices")} /> : servicesError ? (
                <div>
                  <ErrorBanner>{servicesError}</ErrorBanner>
                  <button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-3 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white">Try again</button>
                </div>
              ) : services.length === 0 ? <EmptyState>No categories are available yet.</EmptyState> : (
                <div className="category-grid">
                  {services
                    .filter((service) => getServiceImage(service.name))
                    .slice(0, 6)
                    .map((service, index) => {
                      const image = getServiceImage(service.name);
                      return (
                        <button
                          key={service.id}
                          ref={(node) => { if (node) categoryButtons.current.set(service.id, node); else categoryButtons.current.delete(service.id); }}
                          style={{ "--tile-delay": `${Math.min(index, 7) * 35}ms` }}
                          type="button"
                          onClick={() => handleBrowseCategory(service)}
                          className="category-tile group"
                        >
                          {image ? (
                            <span className="category-image">
                              <img src={image} alt={service.name} />
                            </span>
                          ) : (
                            <span className="category-icon"><ServiceIcon name={service.name} /></span>
                          )}
                          <span className="category-copy min-w-0">
                            <span className="block break-words text-sm font-bold text-ink group-hover:text-brand">{service.name}</span>
                            <span className="mt-1 block text-xs font-medium text-gray-500">View providers <span aria-hidden="true">→</span></span>
                          </span>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
        </Card>

        <aside className="home-sidebar space-y-5">
          {/* The two big counters are gone. "1 active, 0 completed" is a vanity number on a
              hackathon account, and the list underneath already says the same thing with the
              detail that actually matters — which request, and what state it's in. */}
          <section className="home-recent min-w-0">
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-ink lg:text-lg">{t("customer.recent")}</h2>
              {recentRequests.length > 3 && <button onClick={() => navigate("/requests/mine")} className="text-xs font-bold text-brand">View all</button>}
            </div>
            {recentRequests.length === 0 && <EmptyState>{t("customer.noRequests")}</EmptyState>}
            <div className="grid gap-3">
              {recentRequests.slice(0, 3).map((req) => (
                <Card key={req.id} onClick={() => navigate(requestRoute(req))} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{req.service?.name ?? "Service request"}</p>
                    <p className="mt-0.5 text-xs capitalize text-gray-500">{req.status?.toLowerCase().replace("_", " ")}</p>
                  </div>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">→</span>
                </Card>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </Screen>
  );
}
