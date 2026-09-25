import { useEffect, useRef, useState } from "react";

/**
 * Pick a location instead of typing one.
 *
 * Two ways in: "Use my location" (the browser's Geolocation API) or searching a place name
 * (OpenStreetMap's Nominatim). Either way the caller gets coordinates plus a readable label, so
 * cards keep showing "Pretoria, Gauteng" while matching finally has numbers to measure with.
 *
 * Deliberately no map: a draggable pin needs Leaflet, its CSS, and a workaround for the marker
 * icons that bundlers break. Search and GPS cover both real cases — "I'm here" and "it's over
 * there" — with no new dependency.
 *
 * Props:
 *   value    { label, latitude, longitude }
 *   onChange ({ label, latitude, longitude }) — coordinates are null until one is chosen
 */
export default function LocationPicker({ value, onChange, label = "Where are you?", hint }) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState("");

  const chosen = value?.latitude != null && value?.longitude != null;
  // Skips the search that would otherwise fire immediately after picking a result, since
  // choosing one sets the query to that result's name.
  const skipNextSearch = useRef(false);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    const term = query.trim();
    if (term.length < 3) {
      setResults([]);
      return;
    }

    // Nominatim asks for at most one request per second, so wait for a pause in typing rather
    // than firing per keystroke.
    const timer = setTimeout(async () => {
      setSearching(true);
      setNotice("");
      try {
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("format", "json");
        url.searchParams.set("q", term);
        url.searchParams.set("limit", "5");
        // Bias towards South Africa: this is a local services marketplace, and "Springs"
        // should mean the town on the East Rand, not one in Texas.
        url.searchParams.set("countrycodes", "za");

        const response = await fetch(url, { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error(`search failed: ${response.status}`);
        setResults(await response.json());
      } catch (err) {
        console.error(err);
        setResults([]);
        setNotice("Couldn't search for places right now. You can still use your current location.");
      } finally {
        setSearching(false);
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [query]);

  const choose = (place) => {
    skipNextSearch.current = true;
    setQuery(place.display_name);
    setResults([]);
    setNotice("");
    onChange({
      label: place.display_name,
      latitude: Number(place.lat),
      longitude: Number(place.lon),
    });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setNotice("This browser can't share your location. Search for a place name instead.");
      return;
    }

    setLocating(true);
    setNotice("");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        let placeLabel = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

        // Reverse geocode so the label reads like a place rather than numbers. If it fails the
        // coordinates still work — only the wording suffers.
        try {
          const url = new URL("https://nominatim.openstreetmap.org/reverse");
          url.searchParams.set("format", "json");
          url.searchParams.set("lat", String(latitude));
          url.searchParams.set("lon", String(longitude));
          const response = await fetch(url, { headers: { Accept: "application/json" } });
          if (response.ok) {
            const body = await response.json();
            if (body.display_name) placeLabel = body.display_name;
          }
        } catch (err) {
          console.error(err);
        }

        skipNextSearch.current = true;
        setQuery(placeLabel);
        setResults([]);
        setLocating(false);
        onChange({ label: placeLabel, latitude, longitude });
      },
      (err) => {
        console.error(err);
        setLocating(false);
        setNotice(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied. Search for a place name instead."
            : "Couldn't get your location. Search for a place name instead."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const clear = () => {
    skipNextSearch.current = true;
    setQuery("");
    setResults([]);
    setNotice("");
    onChange({ label: "", latitude: null, longitude: null });
  };

  return (
    <div>
      <label htmlFor="location-search" className="text-sm font-bold text-ink">{label}</label>
      {hint && <p className="mt-1 text-xs leading-5 text-gray-500">{hint}</p>}

      <div className="mt-3 flex gap-2">
        <input
          id="location-search"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // Typing again invalidates the pinned coordinates: the label no longer describes
            // them, and a stale pin is worse than none.
            if (chosen) onChange({ label: e.target.value, latitude: null, longitude: null });
          }}
          placeholder="Search a suburb or town, e.g. Soweto"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
        />
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="shrink-0 rounded-xl border border-brand/25 bg-brand-soft px-3 py-2.5 text-xs font-bold text-brand transition-colors hover:bg-brand/15 disabled:opacity-60"
        >
          {locating ? "Locating…" : "Use my location"}
        </button>
      </div>

      {searching && <p className="mt-2 text-xs text-gray-400">Searching…</p>}
      {notice && <p className="mt-2 text-xs text-amber-700">{notice}</p>}

      {results.length > 0 && (
        <ul className="mt-2 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {results.map((place) => (
            <li key={`${place.place_id}`}>
              <button
                type="button"
                onClick={() => choose(place)}
                className="block w-full px-3 py-2.5 text-left text-xs leading-5 text-gray-700 hover:bg-brand-mist"
              >
                {place.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {chosen && (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-brand-mist px-3 py-2">
          <p className="min-w-0 text-xs font-semibold text-brand">
            Pinned · {value.latitude.toFixed(4)}, {value.longitude.toFixed(4)}
          </p>
          <button type="button" onClick={clear} className="shrink-0 text-xs font-bold text-gray-500 hover:text-brand">
            Clear
          </button>
        </div>
      )}

      {!chosen && query.trim().length > 0 && (
        <p className="mt-2 text-xs text-gray-400">
          Pick a result above, or use your location, so providers can be sorted by distance.
        </p>
      )}
    </div>
  );
}
