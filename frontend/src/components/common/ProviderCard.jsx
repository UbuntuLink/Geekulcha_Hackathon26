import Card from "./Card.jsx";
import StarRating from "./StarRating.jsx";
import { formatRange } from "../../lib/format.js";

/** A ProviderMatchResponse row (see MatchingProviders.jsx / CustomerHome.jsx's AI search). */
export default function ProviderCard({ provider, onClick }) {
  return (
    <Card onClick={onClick} className={onClick ? "cursor-pointer transition-shadow hover:shadow-md" : ""}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-gray-900">{provider.providerName}</p>
          <StarRating rating={provider.rating} reviewCount={provider.reviewCount} />
        </div>
        {provider.availableToday && (
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
            Available
          </span>
        )}
      </div>
      <p className="mt-2 font-semibold text-brand">{formatRange(provider.minPrice, provider.maxPrice)}</p>
      <p className="text-xs text-gray-500">{provider.location}</p>
    </Card>
  );
}
