// Display settings for accessibility: colour mode, larger text and reduced motion.
// Saved per device and applied as classes on <html>, which styles/theme.css and index.css read.
// See ACCESSIBILITY.md.

const STORAGE_KEY = "ul_a11y";

// The colour-blind modes each suit one type of colour blindness (see styles/theme.css).
export const COLOUR_MODES = [
  { value: "standard", label: "Standard colours" },
  { value: "protanopia", label: "Red-blind", hint: "Protanopia", group: "colourBlind" },
  { value: "deuteranopia", label: "Green-blind", hint: "Deuteranopia · most common", group: "colourBlind" },
  { value: "tritanopia", label: "Blue–yellow blind", hint: "Tritanopia", group: "colourBlind" },
  { value: "contrast", label: "High contrast", hint: "Low vision" },
];

const THEME_CLASSES = ["protanopia", "deuteranopia", "tritanopia", "contrast"];

const DEFAULTS = { colourMode: "standard", largeText: false, reduceMotion: false };

export function getA11ySettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    // The single "colorblind" mode that came before the three types was the green-blind palette.
    if (saved.colourMode === "colorblind") saved.colourMode = "deuteranopia";
    return { ...DEFAULTS, ...saved };
  } catch {
    return { ...DEFAULTS };
  }
}

export function applyA11ySettings(settings = getA11ySettings()) {
  const root = document.documentElement;
  for (const mode of THEME_CLASSES) {
    root.classList.toggle(`theme-${mode}`, settings.colourMode === mode);
  }
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
