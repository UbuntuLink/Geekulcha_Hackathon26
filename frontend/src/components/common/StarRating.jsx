export default function StarRating({ rating, reviewCount }) {
  return (
    <p className="text-sm text-gray-600">
      <span className="text-amber-500">★</span> {rating?.toFixed(1)}
      {typeof reviewCount === "number" && <> · {reviewCount} reviews</>}
    </p>
  );
}
