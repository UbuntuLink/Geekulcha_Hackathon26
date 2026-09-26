import { useEffect, useId, useRef, useState } from "react";
import { COLOUR_MODES, getA11ySettings, saveA11ySettings } from "../../lib/a11y.js";

/**
 * Accessibility display settings: colour mode (standard, colour-blind friendly, high contrast),
 * larger text and reduced motion. Changes apply instantly and are remembered on this device.
 *
 * `compact` renders a small "Aa Display" button that opens a panel (for the nav bar);
 * otherwise the controls are shown inline (Profile screen, sign-in pages).
 */
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

  const controls = (
    <div className="space-y-3">
      <fieldset>
        <legend className="mb-1.5 text-sm font-bold text-ink">Colours</legend>
        <div className="space-y-1">
          {COLOUR_MODES.map((mode) => (
            <label key={mode.value} className="flex min-h-[40px] cursor-pointer items-center gap-2.5 rounded-lg px-2 text-sm text-gray-800 hover:bg-brand-mist">
              <input
                type="radio"
                name={`${panelId}-colour`}
                value={mode.value}
                checked={settings.colourMode === mode.value}
                onChange={() => update({ colourMode: mode.value })}
                className="h-4 w-4 accent-brand"
              />
              {mode.label}
            </label>
          ))}
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
          className="absolute right-0 top-full z-[60] mt-2 w-64 rounded-2xl border border-gray-200 bg-white p-3 shadow-lift"
        >
          {controls}
        </div>
      )}
    </div>
  );
}
