export default function Button({ children, variant = "primary", className = "", ...props }) {
  const base =
    "tap-bloom interactive-sheen group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-200 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

  const variants = {
    primary: "bg-brand text-white shadow-[0_10px_24px_rgba(31,92,69,0.20)] hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-[0_14px_28px_rgba(31,92,69,0.24)]",
    outline: "border border-brand/25 bg-white/85 text-brand shadow-sm hover:-translate-y-0.5 hover:border-brand/50 hover:bg-brand-mist",
    soft: "bg-brand-soft text-brand hover:bg-brand/15",
    ghost: "bg-transparent text-brand hover:bg-brand/10",
    danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
  };

  return (
    <button className={`${base} ${variants[variant] ?? variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}
