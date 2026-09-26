// Display settings for accessibility: colour mode, larger text and reduced motion.
// Saved per device and applied as classes on <html>, which styles/theme.css and index.css read.
// See ACCESSIBILITY.md.

const STORAGE_KEY = "ul_a11y";

export const COLOUR_MODES = [
  { value: "standard", label: "Standard colours" },
  { value: "colorblind", label: "Colour-blind friendly" },
  { value: "contrast", label: "High contrast" },
];

const DEFAULTS = { colourMode: "standard", largeText: false, reduceMotion: false };

export function getA11ySettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return { ...DEFAULTS, ...saved };
  } catch {
    return { ...DEFAULTS };
  }
}

export function applyA11ySettings(settings = getA11ySettings()) {
  const root = document.documentElement;
  root.classList.toggle("theme-colorblind", settings.colourMode === "colorblind");
  root.classList.toggle("theme-contrast", settings.colourMode === "contrast");
  root.classList.toggle("text-large", Boolean(settings.largeText));
  root.classList.toggle("reduce-motion", Boolean(settings.reduceMotion));
}

export function saveA11ySettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Private browsing or blocked storage: the setting still applies for this visit.
  }
  applyA11ySettings(settings);
}
