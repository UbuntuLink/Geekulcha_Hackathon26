import Card from "./Card.jsx";
import StarRating from "./StarRating.jsx";
import { formatRange } from "../../lib/format.js";

export default function ProviderCard({ provider, onClick, quantumRecommended = false }) {
  const initials = (provider.providerName || "Provider").split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <Card onClick={onClick} className="provider-card group h-full overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-brand via-brand-light to-emerald-300/80 opacity-75 transition-opacity group-hover:opacity-100" />
      <div className="p-4 lg:p-5">
        {quantumRecommended && (
          <p className="mb-3 inline-flex rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand">
            <span aria-hidden="true" className="mr-1">⚛</span> Quantum recommended
          </p>
        )}
        <div className="flex items-start gap-3">
          <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-sm font-extrabold text-brand transition-transform duration-200 group-hover:scale-[1.04]">
            {initials}
            {provider.availableToday && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="break-words font-extrabold text-ink transition-colors group-hover:text-brand">{provider.providerName}</p>
            <StarRating rating={provider.rating} reviewCount={provider.reviewCount} />
          </div>
          <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-mist text-brand/60">→</span>
        </div>
        <div className="provider-details mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-brand/10 pt-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Estimated range</p>
            <p className="mt-0.5 font-extrabold text-brand">{formatRange(provider.minPrice, provider.maxPrice)}</p>
          </div>
          <div className="provider-location text-right">
            {provider.availableToday && <p className="text-[11px] font-bold text-emerald-700">Available today</p>}
            {/* Only shown when both sides have coordinates — never the provider's raw lat/lng. */}
            {provider.distanceKm != null && (
              <p className="mt-0.5 text-[11px] font-bold text-brand">≈ {Math.round(provider.distanceKm)} km away</p>
            )}
            <p className="mt-0.5 max-w-[145px] break-words text-xs text-gray-500">{provider.location || "Location not specified"}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
