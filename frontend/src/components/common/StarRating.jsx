export default function StarRating({ rating, reviewCount }) {
  return (
    <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs font-medium text-gray-500">
      <span className="text-amber-500">★</span>
      <span className="text-gray-700">{rating?.toFixed?.(1) ?? "—"}</span>
      {typeof reviewCount === "number" && <span>· {reviewCount} reviews</span>}
    </p>
  );
}
