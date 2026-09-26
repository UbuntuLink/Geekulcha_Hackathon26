import { useEffect, useId, useRef, useState } from "react";
import { COLOUR_MODES, getA11ySettings, saveA11ySettings } from "../../lib/a11y.js";

/**
 * Accessibility display settings: colour mode (standard, colour-blind friendly, high contrast),
 * larger text and reduced motion. Changes apply instantly and are remembered on this device.
 *
 * `compact` renders a small "Aa Display" button that opens a panel (for the nav bar);
 * otherwise the controls are shown inline (Profile screen, sign-in pages).
 */
// Done / problem / waiting in each mode, matching styles/theme.css (the 700 shades).
const SWATCHES = {
  standard: ["#047857", "#b91c1c", "#b45309"],
  protanopia: ["#1d4ed8", "#ea580c", "#a16207"],
  deuteranopia: ["#1d4ed8", "#c2410c", "#a16207"],
  tritanopia: ["#0f766e", "#b91c1c", "#be185d"],
  contrast: ["#064e3b", "#7f1d1d", "#78350f"],
};

export default function DisplaySettings({ compact = false, className = "" }) {
  const [settings, setSettings] = useState(getA11ySettings);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrapperRef = useRef(null);

  const update = (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveA11ySettings(next);
  };

  // Close the panel with Escape or a click outside it.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    const onClick = (event) => wrapperRef.current && !wrapperRef.current.contains(event.target) && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const renderMode = (mode) => (
    <label
      key={mode.value}
      className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-lg px-2 text-sm text-gray-800 hover:bg-brand-mist"
    >
      <input
        type="radio"
        name={`${panelId}-colour`}
        value={mode.value}
        checked={settings.colourMode === mode.value}
        onChange={() => update({ colourMode: mode.value })}
        className="h-4 w-4 shrink-0 accent-brand"
      />
      <span className="min-w-0 flex-1">
        <span className="block leading-tight">{mode.label}</span>
        {mode.hint && <span className="block text-xs leading-tight text-gray-500">{mode.hint}</span>}
      </span>
      {/* Preview of how "done", "problem" and "waiting" look in this mode. */}
      <span className="flex shrink-0 gap-1" aria-hidden="true">
        {SWATCHES[mode.value].map((colour) => (
          <span key={colour} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: colour }} />
        ))}
      </span>
    </label>
  );

  const controls = (
    <div className="space-y-3">
      <fieldset>
        <legend className="mb-1.5 text-sm font-bold text-ink">Colours</legend>
        <div className="space-y-1">
          {renderMode(COLOUR_MODES[0])}
          <p className="px-2 pt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Colour blindness</p>
          {COLOUR_MODES.filter((mode) => mode.group === "colourBlind").map(renderMode)}
          <div className="border-t border-gray-200 pt-1">{renderMode(COLOUR_MODES[COLOUR_MODES.length - 1])}</div>
        </div>
      </fieldset>
      <div className="space-y-1 border-t border-gray-200 pt-2">
        <label className="flex min-h-[40px] cursor-pointer items-center gap-2.5 rounded-lg px-2 text-sm text-gray-800 hover:bg-brand-mist">
          <input
            type="checkbox"
            checked={settings.largeText}
            onChange={(e) => update({ largeText: e.target.checked })}
            className="h-4 w-4 accent-brand"
          />
          Larger text
        </label>
        <label className="flex min-h-[40px] cursor-pointer items-center gap-2.5 rounded-lg px-2 text-sm text-gray-800 hover:bg-brand-mist">
          <input
            type="checkbox"
            checked={settings.reduceMotion}
            onChange={(e) => update({ reduceMotion: e.target.checked })}
            className="h-4 w-4 accent-brand"
          />
          Reduce motion
        </label>
      </div>
    </div>
  );

  if (!compact) {
    return (
      <section aria-label="Display settings" className={`rounded-2xl border border-gray-200 bg-white p-4 ${className}`}>
        <h2 className="mb-2 text-base font-bold text-ink">Display</h2>
        {controls}
      </section>
    );
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="rounded-xl border border-brand/15 bg-white/70 px-2.5 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand/10"
      >
        <span aria-hidden="true">Aa</span> Display
      </button>
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Display settings"
          className="absolute right-0 top-full z-[60] mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-3 shadow-lift"
        >
          {controls}
        </div>
      )}
    </div>
  );
}
