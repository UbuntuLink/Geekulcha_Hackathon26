export default function ErrorBanner({ children }) {
  if (!children) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/90 px-3.5 py-3 text-sm leading-relaxed text-red-700 shadow-sm" role="alert">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-red-100 text-xs font-bold">!</span>
      <span>{children}</span>
    </div>
  );
}
