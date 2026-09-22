export default function EmptyState({ children }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand/20 bg-white/50 px-4 py-6 text-center text-sm leading-relaxed text-gray-500">
      <div className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand">•</div>
      {children}
    </div>
  );
}
