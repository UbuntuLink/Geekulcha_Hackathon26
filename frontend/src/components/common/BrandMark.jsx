export default function BrandMark({ compact = false, inverse = false, className = "" }) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`grid ${compact ? "h-9 w-9" : "h-11 w-11"} place-items-center overflow-hidden rounded-2xl border ${
          inverse ? "border-white/20 bg-[#F5F1E4]" : "border-brand/10 bg-[#F5F1E4]"
        } shadow-sm`}
        aria-hidden="true"
      >
        <img src="/logo.png" alt="" className="h-full w-full object-contain p-1" />
      </span>
      <span className={`${compact ? "text-base" : "text-lg"} font-extrabold tracking-tight ${inverse ? "text-white" : "text-ink"}`}>
        Ubuntu<span className={inverse ? "text-white/72" : "text-brand"}>Link</span>
      </span>
    </div>
  );
}
