const DEFAULT_STEPS = ["Describe", "Review", "Match"];

export default function ProgressSteps({ current = 1, steps = DEFAULT_STEPS, className = "" }) {
  return (
    <div className={`w-full ${className}`} aria-label={`Step ${current} of ${steps.length}`}>
      <div className="flex items-center gap-2 sm:gap-3">
        {steps.map((label, index) => {
          const step = index + 1;
          const complete = step < current;
          const active = step === current;

          return (
            <div key={label} className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] font-extrabold transition-all duration-300 sm:h-8 sm:w-8 ${
                    complete
                      ? "border-brand bg-brand text-white"
                      : active
                        ? "border-brand bg-white text-brand shadow-[0_0_0_5px_rgba(31,92,69,0.08)]"
                        : "border-brand/15 bg-white/70 text-gray-400"
                  }`}
                >
                  {complete ? "✓" : step}
                </span>
                <span className={`hidden truncate text-xs font-bold sm:block ${active || complete ? "text-brand" : "text-gray-400"}`}>
                  {label}
                </span>
              </div>

              {step < steps.length && (
                <span className={`h-px min-w-4 flex-1 transition-colors duration-300 ${complete ? "bg-brand" : "bg-brand/15"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
