// Tolerant matching between what a person types and the service catalog in the database.
//
// The search used to be `services.find(s => s.name.toLowerCase() === aiCategory.toLowerCase())`,
// which needed the AI's word and the database's word to be byte-identical. They mostly weren't:
// the classifier answers "mechanic" while the catalog says "Automotive Repair", it answers
// "beauty" while the catalog has four separate beauty services, and anything it called "other"
// could never match at all. Seven of the fifteen categories were unreachable, and a single typo
// ("plumer") lost the other eight.
//
// Nothing here calls the AI. This is the layer that makes the AI's answer — and the raw words
// the person typed — land on a real row in the catalog.

/** Lowercase, strip accents and punctuation, collapse whitespace. "Nail Services!" -> "nail services" */
export function normalize(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(text) {
  const n = normalize(text);
  return n ? n.split(" ") : [];
}

/** Levenshtein edit distance, two-row variant. */
function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** 0..1 similarity. "plumer" vs "plumber" -> 0.86, which is what makes spelling not matter much. */
export function similarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  // Short words need a stricter bar: "car" and "cat" are one edit apart but unrelated.
  const longest = Math.max(a.length, b.length);
  return 1 - editDistance(a, b) / longest;
}

const FUZZY_WORD = 0.8; // a word counts as a typo of another above this
const MIN_SCORE = 0.5; // below this we would rather admit we didn't understand

// How people actually name these jobs, mapped to the words that appear in catalog rows.
// `hints` are matched against the real service names, so this survives the catalog being
// renamed or extended — nothing here hardcodes an id.
const ALIAS_GROUPS = [
  {
    hints: ["plumbing"],
    words: ["plumber", "plumbing", "plumb", "pipe", "pipes", "leak", "leaking", "burst", "drain",
      "drains", "blocked", "geyser", "tap", "taps", "toilet", "sink", "shower", "water"],
  },
  {
    hints: ["electrical"],
    words: ["electrician", "electrical", "electric", "sparky", "wiring", "wire", "wires", "power",
      "plug", "plugs", "socket", "sockets", "lights", "globe", "db board", "tripping", "shock",
      "inverter", "loadshedding"],
  },
  {
    hints: ["automotive repair", "mechanic", "automotive"],
    words: ["mechanic", "mechanics", "car", "cars", "vehicle", "bakkie", "automotive", "engine",
      "brakes", "clutch", "gearbox", "exhaust", "tyre", "tyres", "battery", "panelbeater",
      "service my car", "wont start"],
  },
  {
    hints: ["cleaning"],
    words: ["cleaner", "cleaners", "cleaning", "clean", "domestic", "housekeeping", "maid",
      "deep clean", "spring clean", "laundry", "washing", "dishes", "tidy"],
  },
  {
    hints: ["gardening"],
    words: ["gardener", "gardening", "garden", "lawn", "grass", "weeds", "hedge", "trees", "tree",
      "landscaping", "yard", "paving stones", "flowerbed"],
  },
  {
    // No "wall" here: "paint my walls" is already caught by "paint", while a bare "wall" is far
    // more likely to be building work.
    hints: ["painting"],
    words: ["painter", "painting", "paint", "repaint", "varnish", "undercoat", "ceiling"],
  },
  {
    hints: ["handyman"],
    words: ["handyman", "handy man", "odd jobs", "odd job", "repairs", "repair", "fix", "fixing",
      "maintenance", "door", "hinge", "lock", "shelf", "shelves", "mount", "assemble", "curtain"],
  },
  {
    hints: ["building construction", "building", "construction"],
    words: ["builder", "builders", "building", "construction", "bricklayer", "bricks", "cement",
      "concrete", "slab", "renovation", "renovate", "extension", "roof", "roofing", "tiling",
      "tiler", "tiles", "plaster", "paving", "boundary wall"],
  },
  {
    hints: ["tutoring"],
    words: ["tutor", "tutors", "tutoring", "teacher", "lessons", "lesson", "homework", "maths",
      "math", "science", "english", "accounting", "matric", "exam", "exams", "study", "extra classes"],
  },
  {
    hints: ["braiding"],
    words: ["braids", "braid", "braiding", "braider", "cornrows", "knotless", "box braids",
      "dreadlocks", "locs", "weave", "extensions", "plaits"],
  },
  {
    hints: ["hairdressing"],
    words: ["hairdresser", "hairdressing", "hairstylist", "haircut", "barber", "salon", "hair",
      "relaxer", "treatment", "blowout", "trim"],
  },
  {
    hints: ["nail services", "nails"],
    words: ["nails", "nail", "manicure", "pedicure", "acrylics", "acrylic", "gel nails", "tips"],
  },
  {
    hints: ["makeup services", "makeup"],
    words: ["makeup", "make up", "mua", "bridal makeup", "lashes", "eyebrows", "glam"],
  },
  {
    hints: ["tailoring"],
    words: ["tailor", "tailoring", "seamstress", "sewing", "sew", "alterations", "alter", "hem",
      "zip", "dressmaker", "fitting"],
  },
  {
    hints: ["photography"],
    words: ["photographer", "photography", "photos", "photo", "photoshoot", "shoot", "pictures",
      "camera", "matric dance", "wedding photos"],
  },
  // Umbrella terms that cover several catalog rows at once. Scored lower than a specific match
  // on purpose: when the classifier says "beauty" but the person typed "braids", the person's
  // own word has to win. Hints are best-first, so a bare "beauty" is at least deterministic.
  {
    umbrella: true,
    hints: ["hairdressing", "braiding", "nail services", "makeup services"],
    words: ["beauty", "beautician", "spa", "facial", "waxing", "grooming", "pamper"],
  },
];

/** Does `word` appear in `text` as a whole word, or as a close misspelling of one? */
function textHasWord(textTokens, word) {
  const wanted = normalize(word);
  if (!wanted) return false;

  if (wanted.includes(" ")) {
    return normalize(textTokens.join(" ")).includes(wanted);
  }
  return textTokens.some((t) => t === wanted || (t.length > 3 && similarity(t, wanted) >= FUZZY_WORD));
}

/** How well one service row answers one phrase the person (or the AI) used. 0..1 */
function scoreService(service, phrase) {
  const phraseNorm = normalize(phrase);
  if (!phraseNorm) return 0;

  const nameNorm = normalize(service.name);
  if (!nameNorm) return 0;

  const phraseTokens = phraseNorm.split(" ");
  const nameTokens = nameNorm.split(" ");

  if (phraseNorm === nameNorm) return 1;

  // The phrase contains the catalog name, or vice versa: "find a plumbing guy" -> "Plumbing".
  if (phraseNorm.includes(nameNorm) || nameNorm.includes(phraseNorm)) return 0.92;

  // Any catalog word present in the phrase, allowing for a typo: "nail" -> "Nail Services".
  if (nameTokens.some((n) => n.length > 3 && textHasWord(phraseTokens, n))) return 0.85;

  // The way people actually say it: "sparky" / "my car won't start" / "braids".
  let aliasBest = 0;
  for (const group of ALIAS_GROUPS) {
    const hits = group.words.filter((w) => textHasWord(phraseTokens, w));
    if (hits.length === 0) continue;

    // More trigger words, and longer ones, mean a more deliberate match: "builder ... boundary
    // wall" should beat the single generic word that some other category also recognises.
    const specificity =
      Math.min(0.02, 0.01 * (hits.length - 1)) + (hits.some((w) => w.length >= 6) ? 0.01 : 0);
    const base = group.umbrella ? 0.7 : 0.8;

    group.hints.forEach((hint, hintIndex) => {
      const hintNorm = normalize(hint);
      if (nameNorm === hintNorm || nameNorm.includes(hintNorm) || hintNorm.includes(nameNorm)) {
        aliasBest = Math.max(aliasBest, base + specificity - 0.01 * hintIndex);
      }
    });
  }
  if (aliasBest > 0) return aliasBest;

  // Last resort: whole-word fuzzy, for a misspelt catalog name we have no alias for.
  let best = 0;
  for (const p of phraseTokens) {
    if (p.length <= 3) continue;
    for (const n of nameTokens) {
      if (n.length <= 3) continue;
      best = Math.max(best, similarity(p, n));
    }
  }
  return best >= FUZZY_WORD ? best * 0.75 : 0;
}

/**
 * Pick the catalog row that best answers the phrases given, most trustworthy first
 * (normally the AI's category, then the raw text the person typed).
 *
 * Returns { service, score, matchedOn } or null when nothing is close enough — saying
 * "I don't know" beats sending someone to a random provider.
 */
export function matchService(services, ...phrases) {
  if (!Array.isArray(services) || services.length === 0) return null;

  let best = null;

  phrases.filter(Boolean).forEach((phrase, index) => {
    // Earlier phrases are more trustworthy, but only slightly — enough to break a tie without
    // letting a weak AI guess beat a strong keyword hit from the person's own words.
    const weight = 1 - index * 0.05;

    for (const service of services) {
      const score = scoreService(service, phrase) * weight;
      if (score > (best?.score ?? 0)) {
        best = { service, score, matchedOn: phrase };
      }
    }
  });

  return best && best.score >= MIN_SCORE ? best : null;
}

const SORT_WORDS = {
  cheapest: ["cheap", "cheapest", "cheaper", "affordable", "affordability", "budget", "inexpensive",
    "low cost", "lowest", "reasonable", "discount", "save"],
  best_rated: ["best", "top", "greatest", "highest", "rated", "rating", "ratings", "reviews",
    "good", "great", "quality", "reliable", "recommended", "trusted", "professional", "experienced",
    "five star", "5 star"],
};

const URGENCY_WORDS = ["today", "now", "asap", "urgent", "urgently", "emergency", "immediately",
  "tonight", "right now", "straight away", "quickly", "soonest", "same day"];

/**
 * What the person is asking for beyond the category: cheapest, best rated, needed today.
 * Typo-tolerant, so "chepest plumer availble todayy" still works.
 *
 * `aiPreference` is the classifier's own read of the request and wins when it has one, because
 * it understands phrasing no keyword list will ever cover ("I don't have much money").
 */
export function detectIntent(query, aiPreference = null) {
  const queryTokens = tokens(query);
  const hits = (words) => words.filter((w) => textHasWord(queryTokens, w)).length;

  const cheapHits = hits(SORT_WORDS.cheapest);
  const ratedHits = hits(SORT_WORDS.best_rated);

  let sort = null;
  if (aiPreference === "cheapest" || aiPreference === "best_rated") {
    sort = aiPreference;
  } else if (cheapHits > ratedHits) {
    sort = "cheapest";
  } else if (ratedHits > 0) {
    sort = "best_rated";
  }

  return { sort, urgent: hits(URGENCY_WORDS) > 0 };
}
