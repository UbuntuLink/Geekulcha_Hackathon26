import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import ServiceIcon from "../../components/common/ServiceIcon.jsx";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import Loading from "../../components/common/Loading.jsx";
import ProviderCard from "../../components/common/ProviderCard.jsx";
import { getOnboarding } from "../../lib/preferences.js";
import { getMatchingProviders, getMyServiceRequests, listServices } from "../../api/services.js";

function requestRoute(req) {
  return req.status === "OPEN" ? `/requests/${req.id}/matches` : `/requests/${req.id}/quotes`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const ACTIVE_STATUSES = ["OPEN", "QUOTED", "BOOKED"];
export default function CustomerHome() {
  const navigate = useNavigate();
  const { name, location } = getOnboarding();
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

  const activeCount = recentRequests.filter((r) => ACTIVE_STATUSES.includes(r.status)).length;
  const completedCount = recentRequests.filter((r) => r.status === "COMPLETED").length;

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
    getMatchingProviders(selectedCategory.id)
      .then((items) => {
        if (active) setProviders([...items].sort((a, b) => (b.rating || 0) - (a.rating || 0)));
      })
      .catch(() => { if (active) setProvidersError("Couldn't load providers. Please try again."); })
      .finally(() => { if (active) setProvidersLoading(false); });
    // Ignore stale responses if the user goes back or selects another category.
    return () => { active = false; };
  }, [selectedCategory, retry]);

  const handleBrowseCategory = (service) => {
    setProviders([]);
    setProvidersError("");
    setProvidersLoading(true);
    lastCategory.current = service.id;
    setSelectedCategory(service);
  };

  return (
    <Screen showBack={false} withNav size="wide" desktopNav="hero">
      <section className="home-hero hero-glass relative overflow-hidden rounded-3xl bg-brand p-5 text-white shadow-lift sm:p-6 lg:p-8 xl:p-10">
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/10 blur-2xl lg:h-64 lg:w-64" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 hidden h-28 w-28 rounded-full bg-white/5 blur-2xl lg:block" />
        <div className="pointer-events-none absolute right-10 top-7 hidden h-32 w-32 rounded-full border border-white/10 lg:block">
          <span className="absolute -left-2 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-emerald-300/80 shadow-[0_0_20px_rgba(110,231,183,0.6)]" />
          <span className="absolute -right-1 top-4 h-2.5 w-2.5 rounded-full bg-white/55" />
          <span className="absolute bottom-2 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white/35" />
        </div>

        <div id="hero-navigation-anchor" aria-hidden="true" className="hero-navigation-anchor hidden lg:block" />
        <div className="relative lg:flex lg:items-end lg:justify-between lg:gap-10">
          <div>
            <p className="hero-eyebrow mb-3 inline-flex items-center gap-2 text-xs font-semibold text-white/85"><span className="h-1.5 w-1.5 rounded-full bg-emerald-200" /> A little help. A lot of community.</p>
            <p className="text-sm font-medium text-white/70">{greeting()}, {name || "there"}</p>
            <h1 className="mt-1 max-w-[620px] text-[1.75rem] font-extrabold leading-tight tracking-[-0.03em] sm:text-3xl lg:text-[2.65rem] lg:leading-[1.05]">
              What can we help you sort out today?
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/65">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1"><svg aria-hidden="true" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>{location || "Your area"}</span>
              <span className="rounded-full bg-white/10 px-2.5 py-1">AI-assisted matching</span>
            </div>
          </div>

          <button
            onClick={() => navigate("/requests/new")}
            className="group mt-5 flex w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3.5 text-left text-brand shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 lg:mt-0 lg:max-w-[390px] lg:px-5 lg:py-4"
          >
            <span>
              <span className="block text-sm font-extrabold lg:text-base">Describe your problem</span>
              <span className="mt-0.5 block text-xs font-medium text-brand/60">We’ll identify the right service for you.</span>
            </span>
            <span className="shrink-0 text-xl transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>
      </section>

      <div className="home-grid mt-6">
        <Card className="home-categories min-w-0 sm:p-6 lg:p-7">
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
                <h2 className="text-xl font-extrabold text-ink">Browse by category</h2>
                <p className="mt-1 text-sm leading-6 text-gray-500">Choose a service to explore all its providers.</p>
              </div>
              {servicesLoading ? <Loading label="Loading categories…" /> : servicesError ? (
                <div>
                  <ErrorBanner>{servicesError}</ErrorBanner>
                  <button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-3 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white">Try again</button>
                </div>
              ) : services.length === 0 ? <EmptyState>No categories are available yet.</EmptyState> : (
                <div className="category-grid">
                  {services.map((service, index) => (
                    <button
                      key={service.id}
                      ref={(node) => { if (node) categoryButtons.current.set(service.id, node); else categoryButtons.current.delete(service.id); }}
                      style={{ "--tile-delay": `${Math.min(index, 7) * 35}ms` }}
                      type="button"
                      onClick={() => handleBrowseCategory(service)}
                      className="category-tile group"
                    >
                      <span className="category-icon"><ServiceIcon name={service.name} /></span>
                      <span className="min-w-0">
                        <span className="block break-words text-sm font-bold text-ink group-hover:text-brand">{service.name}</span>
                        <span className="mt-1 block text-xs font-medium text-gray-500">View providers <span aria-hidden="true">→</span></span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        <aside className="home-sidebar space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Card className="relative overflow-hidden lg:p-5">
              <span className="absolute right-3 top-3 h-7 w-7 rounded-full bg-brand-soft" />
              <p className="text-3xl font-extrabold tracking-tight text-brand lg:text-4xl">{activeCount}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Active requests</p>
            </Card>
            <Card className="relative overflow-hidden lg:p-5">
              <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-brand-soft text-xs text-brand">✓</span>
              <p className="text-3xl font-extrabold tracking-tight text-brand lg:text-4xl">{completedCount}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Completed jobs</p>
            </Card>
          </div>


          <section className="home-recent min-w-0">
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-ink lg:text-lg">Recent requests</h2>
              {recentRequests.length > 3 && <button onClick={() => navigate("/requests/mine")} className="text-xs font-bold text-brand">View all</button>}
            </div>
            {recentRequests.length === 0 && <EmptyState>No requests yet — describe a problem to get started.</EmptyState>}
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
