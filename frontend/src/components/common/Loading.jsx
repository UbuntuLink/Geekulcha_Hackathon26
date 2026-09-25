export default function Loading({ label = "Loading..." }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 py-5 text-sm font-medium text-gray-600">
      <span aria-hidden="true" className="relative h-5 w-5 shrink-0">
        <span className="absolute inset-0 rounded-full border-2 border-brand/15" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand" />
      </span>
      {label}
    </div>
  );
}
