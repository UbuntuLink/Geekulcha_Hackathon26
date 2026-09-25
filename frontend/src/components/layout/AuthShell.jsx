import BrandMark from "../common/BrandMark.jsx";

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-cream px-5 py-8 sm:px-6 lg:flex lg:min-h-screen lg:items-center lg:px-10 lg:py-12">
      <div className="surface-grid pointer-events-none absolute inset-0 opacity-[0.22]" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/10 blur-3xl lg:h-96 lg:w-96" />
      <div className="pointer-events-none absolute -left-20 bottom-10 h-52 w-52 rounded-full bg-white/80 blur-3xl lg:h-80 lg:w-80" />

      <div className="relative mx-auto w-full max-w-6xl animate-fade-up lg:grid lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-16 xl:gap-24">
        <div className="lg:pr-4">
          <BrandMark />
          <div className="mt-9 lg:mt-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand/65">A little help starts here</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl lg:max-w-md lg:text-5xl lg:leading-[1.02]">{title}</h1>
            {subtitle && <p className="mt-3 max-w-lg text-sm leading-6 text-gray-500 sm:text-base lg:mt-5 lg:leading-7">{subtitle}</p>}
          </div>

          <div className="mt-8 hidden items-center gap-4 lg:flex">
            <div className="space-y-2">
              {["Local providers", "AI-assisted matching", "Simple booking"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-soft text-[10px] text-brand">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-surface mt-7 rounded-3xl p-5 sm:p-6 lg:mt-0 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
