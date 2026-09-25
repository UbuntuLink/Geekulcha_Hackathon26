# Geolocation Implementation Plan

**Status:** planned (not yet implemented) — replaces the "no real geo/distance" limitation noted in `ProviderMatchService` and PROJECT.md §9b.

**Goal:** users stop typing "Pretoria, Gauteng" into a text box. They pick their spot on a map (or tap "Use my location"), we store latitude/longitude next to the text label, and every distance question becomes simple math: filter providers by service radius, sort nearest-first, show "12 km away" on cards.

---

## 1. How location works today (the problem)

Every location in the app is one typed text string. Nothing can measure distance, so matching ignores where anybody is:

| Where | Field | File | Problem |
|---|---|---|---|
| Provider base | `String location` | `backend/.../entity/ProviderProfile.java` (L44) | text only — has a TODO for lat/lng |
| Provider radius | `int serviceRadiusKm` | `backend/.../entity/ProviderProfile.java` (L47) | stored but **never used** anywhere |
| Job location | `String location` | `backend/.../entity/ServiceRequest.java` (L48) | text only |
| Customer home | localStorage `"ubuntulink.onboarding"` | `frontend/src/lib/preferences.js` | never even reaches the backend |

Consequences in the code today:

- `ProviderMatchService.findProvidersForService()` filters on `idValidated` only — results are "who offers this service", not "who's nearby" (its own comment says so).
- `MatchingProviders.jsx` / `CompareProviders.jsx` call `getMatchingProviders(serviceId)` with **no location at all** — the customer's location never reaches the matching endpoint.
- `serviceRadiusKm` set by a provider during onboarding does nothing.
- Typos and inconsistent spellings ("Pretoria" vs "pretoria, gauteng") make even text comparisons unreliable.

## 2. What we're building

A `LocationPicker` component (map + search + GPS) wherever a location is entered; `latitude`/`longitude` columns stored next to each existing text `location` (the text stays as the display label); a haversine distance helper; and matching that finally uses radius + distance.

**Decisions:**

| Question | Decision | Why |
|---|---|---|
| Map library | **Leaflet via react-leaflet** | free, no API key, no billing; react-leaflet v4 supports our React 18.3.1 |
| Place search ("type Pretoria") | **Nominatim (OpenStreetMap)** | free, no key; 1 req/s limit is fine for a demo |
| "Use my location" | **Browser Geolocation API** | built in, zero dependencies |
| Storage | **Two nullable `Double` columns** (`latitude`, `longitude`) next to each existing text `location` column | old rows and old clients keep working; `ddl-auto=update` adds the columns automatically |
| Distance math | **Haversine in plain Java** (`GeoUtils.distanceKm`) | no PostGIS dependency needed at our scale |
| Backwards compatibility | Coordinates are **optional everywhere** | when missing, fall back to today's behaviour exactly |

Rejected: Google Maps (API key + billing for a hackathon), Mapbox (key + usage caps), PostGIS (overkill for ~100 rows; a Java haversine over a category's providers is instant).

## 3. Backend changes

### 3.1 New columns

```sql
-- reference only; spring.jpa.hibernate.ddl-auto=update adds these on next boot
ALTER TABLE provider_profile ADD COLUMN latitude DOUBLE PRECISION, ADD COLUMN longitude DOUBLE PRECISION;
ALTER TABLE service_request  ADD COLUMN latitude DOUBLE PRECISION, ADD COLUMN longitude DOUBLE PRECISION;
```

- `ProviderProfile.java` / `ServiceRequest.java`: add `private Double latitude;` / `private Double longitude;` (nullable wrapper, not `double` — null means "no coordinates yet").
- Keep the existing `location` text field as the human-readable label shown on cards ("Pretoria, Gauteng"), sourced from the picker's search result or reverse geocode.
- `User` stays untouched — the customer's coordinates ride on each `ServiceRequest` (the job location), which is what matching needs.

### 3.2 New helper: `util/GeoUtils.java`

```java
public final class GeoUtils {
    private GeoUtils() {}

    /** Haversine great-circle distance in kilometres. */
    public static double distanceKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 6371.0 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
```

### 3.3 DTOs accept coordinates

Add nullable `Double latitude, Double longitude` (validated `-90..90` / `-180..180`) alongside the existing `String location`:

- `dto/request/ServiceRequestCreateRequest.java`
- `dto/request/CreateProviderProfileDto.java`
- `dto/request/UpdateProviderProfileRequest.java`

### 3.4 Matching uses distance (the actual payoff)

`GET /api/services/{serviceId}/providers` gains optional `latitude` & `longitude` **query params** (no breaking change — the endpoint already takes none):

```
GET /api/services/3/providers?latitude=-25.7479&longitude=28.2293
```

In `ProviderMatchService.findProvidersForService(serviceId, latitude, longitude)`:

1. Provider has no coordinates → keep it, `distanceKm = null` (today's behaviour).
2. Customer coords present **and** provider has coords → `distanceKm = GeoUtils.distanceKm(...)`; **drop the provider if `distanceKm > serviceRadiusKm`** (finally enforcing the radius providers set during onboarding).
3. Sort: `distanceKm` ascending (nulls last), then rating descending — nearest first instead of arbitrary order.
4. Customer coords absent → no radius filter, no distance, current ordering. Old clients and old data keep working.

`dto/response/ProviderMatchResponse.java` and `ProviderProfileResponse.java`: add `Double distanceKm` (null when unknown).

## 4. Frontend changes

### 4.1 New component: `components/common/LocationPicker.jsx`

One reusable control that replaces every location text input:

- **Map** (react-leaflet + OSM tiles) with a draggable pin — starts centered on the last known value, else defaults to Johannesburg.
- **Search box** — debounced (1s) Nominatim query `https://nominatim.openstreetmap.org/search?format=json&q=...` with a `User-Agent` header; picking a result moves the pin and takes its display name as the label.
- **"Use my location" button** — `navigator.geolocation.getCurrentPosition(...)`, falls back gracefully when denied.
- Emits `onChange({ latitude, longitude, label })`; label fills the existing `location` text so cards look unchanged.

Install: `npm install leaflet react-leaflet` plus `import "leaflet/dist/leaflet.css"`.

### 4.2 Wire it into the four places location is entered

| Screen | File | Today | After |
|---|---|---|---|
| Customer onboarding | `pages/customer/CustomerOnboarding.jsx` | text input → localStorage | LocationPicker → localStorage (via `setOnboarding`, add lat/lng to the saved object) |
| Become a provider | `pages/customer/BecomeProvider.jsx` | `form.location` text | LocationPicker in the form; payload gains `latitude`/`longitude` |
| Provider onboarding | `pages/provider/ProviderOnboarding.jsx` | `location` text | same as above |
| Job location review | `pages/customer/ReviewRequest.jsx` | prefilled from localStorage/provider profile | keep the value (now with coords) from the earlier screens, editable via LocationPicker |

`lib/preferences.js`: `getOnboarding()`/`setOnboarding()` carry `latitude`/`longitude` through unchanged (it just stores the object).

### 4.3 Matching call passes coordinates

- `api/services.js` → `getMatchingProviders(serviceId, latitude, longitude)` appends the query params when present.
- `MatchingProviders.jsx` reads the coords from the flow (the request just created, or onboarding localStorage) and passes them along — **this closes the gap where the customer's location never reached matching**.
- `CompareProviders.jsx` does the same.

### 4.4 Show the distance

- `ProviderCard.jsx` / MatchingProviders / CompareProviders: when `distanceKm != null`, show `≈ 12 km away` (round to whole km) next to the location label. Provider cards show the text label and distance only — never the provider's raw coordinates.

## 5. Existing data

- Every existing row has NULL coordinates → they simply take the fallback path (visible, unfiltered, unsorted-by-distance). **No migration required** for the demo.
- Optional one-off backfill: a small script geocoding the known seeded text locations ("Pretoria, Gauteng", etc.) through Nominatim at 1 req/s (~2 minutes for ~60 providers) so distance sorting works for seeded data immediately.

## 6. Task list

| # | Task | Files | Size |
|---|---|---|---|
| 1 | Add `latitude`/`longitude` to entities | `ProviderProfile.java`, `ServiceRequest.java` | XS |
| 2 | Add `GeoUtils` haversine helper + unit test | `util/GeoUtils.java`, `backend/src/test/...` | XS |
| 3 | Accept coordinates in DTOs (with range validation) | `ServiceRequestCreateRequest`, `CreateProviderProfileDto`, `UpdateProviderProfileRequest` | S |
| 4 | Copy coords from DTOs into entities on save | `ServiceRequestService`, `ProviderProfileService` | XS |
| 5 | Matching: radius filter, distance sort, `distanceKm` in responses | `ProviderMatchService`, `ProviderMatchController`, `ProviderMatchResponse`, `ProviderProfileResponse` | M |
| 6 | Install leaflet; build `LocationPicker.jsx` | `package.json`, `components/common/LocationPicker.jsx` | M |
| 7 | Replace the four location text inputs | `CustomerOnboarding.jsx`, `BecomeProvider.jsx`, `ProviderOnboarding.jsx`, `ReviewRequest.jsx` | M |
| 8 | Pass coords through matching + compare calls | `api/services.js`, `MatchingProviders.jsx`, `CompareProviders.jsx` | S |
| 9 | Show "≈ X km away" on provider cards | `ProviderCard.jsx` | XS |
| 10 | (optional) Backfill coords for seeded providers | one-off script | S |

Suggested order: 1→2→3→4→5 (backend, verifiable via curl) then 6→7→8→9 (frontend). Tasks 1–5 alone already deliver value through the API.

## 7. Test checklist

- [ ] Provider onboarding with a map pin → `provider_profile` row has `latitude`/`longitude`; profile card still shows the text label
- [ ] Create a service request from a pinned location → `service_request` row has coordinates
- [ ] Matching with customer coords: provider outside `serviceRadiusKm` is filtered out; list sorted nearest-first; each card shows "≈ X km away"
- [ ] Matching without coords (old client / no pin): identical results to today, no errors, no distance shown
- [ ] Provider with NULL coords still appears (fallback path)
- [ ] "Use my location" prompts permission on mobile browser and centres the pin when granted
- [ ] Search box: typing "Soweto" moves the pin and sets the label
- [ ] Invalid coords (`latitude=999`) rejected with 400

## 8. Notes & gotchas

- **Nominatim policy:** max 1 request/second, send a identifying `User-Agent`, and keep the "© OpenStreetMap contributors" attribution (Leaflet shows it by default). Don't put geocoding behind a keystroke without debounce.
- **Leaflet in Vite:** default marker icons break in bundlers — import the icon PNGs explicitly or use a `divIcon`/CDN URL (well-known issue, one-line fix).
- **GPS requires HTTPS** — fine on Vercel; `http://localhost` is also exempt for local dev.
- **Privacy:** customers see a provider's label and distance only; exact provider coordinates stay server-side.
- **Keep the text label mandatory** in the picker (search result or reverse geocode) so every card and screen reads naturally without coordinates ever being shown.
