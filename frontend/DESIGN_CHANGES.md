# UbuntuLink frontend update

- Removed the desktop outer frame, border and page margin; the canvas now fills the viewport.
- Desktop homepage: expanded category browser on the left, request counts and recent requests on the right. Removed the homepage AI search. Categories use a responsive grid.
- Selecting a category replaces the category grid with all providers returned by the category endpoint, sorted by rating. Back to categories restores the grid. Loading, empty, error and retry states are included; stale responses are ignored after leaving a category.
- Connected all brand images to the supplied public/logo.png without altering the artwork.
- Added translucent cards and navigation, backdrop blur, soft highlights and green/cream background gradients.
- Added consistent button press feedback and retained subtle hover sheen and entrance fades.
- Request submission displays a spinner and accurate sending text, disables submission while pending, and displays an animated checkmark only after the create request API succeeds. Errors retain the existing retry flow.
- Clickable cards now support keyboard activation; animations respect reduced-motion preferences. Glass surfaces have an opaque fallback.

## Run locally

From the frontend folder:

```sh
npm ci
npm run dev
```

Copy .env.example to .env and set the backend/ML URLs if needed. Keep your existing environment values. The Spring Boot and Python services are still required for live data and requests.

The ZIP excludes node_modules and dist. Install dependencies locally; do not copy the old Windows node_modules into this folder.

## Validation

Production Vite build passed (139 modules). Chromium checks passed at 320, 390, 768 and 1440px for the home page, category/provider/back navigation, and request form. Inspected screenshots on desktop and phones and corrected cramped small-screen provider cards. Also checked welcome, login, registration, onboarding, requests and profile at 320 and 768px. Checked error/retry, empty providers, stale responses after Back, and reduced-motion settings. No JavaScript runtime errors in these checks.

Browser tests used mocked API data, not a live backend. Real-device iOS/Android and live submission checks are still recommended before deployment.

## Motion references

- https://web.dev/learn/css/transitions — brief transform/opacity transitions.
- https://web.dev/articles/prefers-reduced-motion — respect reduced-motion preferences.

Motion is kept subtle to complement the glass styling without distracting from the forms.

## Mobile and personality refinement

- Responsive two-column category tiles on phones, expanding to three columns on large screens.
- Original logo also appears in the mobile homepage header.
- Coordinated SVG service icons with muted sage, sand and teal accents.
- Short staggered category entrances, gentle page/provider fades, active navigation icon feedback, and a soft press highlight on shared buttons.
- Larger phone tap targets, 16px form inputs, safe-area navigation spacing, and smaller mobile blur radius.
- Provider names, prices and locations wrap naturally at narrow widths; full-width card details prevent cramped columns.
- Category navigation manages keyboard focus. Reduced-motion settings disable decorative movement. Hover-only effects are limited to pointer devices.
- No animation dependency added. Existing API endpoints and request workflow remain in use.

Additional motion references:
- https://web.dev/articles/animations-guide — prefer transform and opacity for inexpensive motion.
- https://web.dev/learn/css/transitions — use brief transitions for interaction feedback.

## Welcome and branding cleanup

- Welcome now has a single header logo/name. Replaced the oversized repeated logo with a green glass panel explaining the three-step journey.
- Softer cream/green canvas, clearer headline, calm service illustrations, responsive calls to action and compact footer.
- Removed the secondary desktop logo from authentication screens.
- Shared Screen hides its inline brand row on desktop when the desktop navigation already displays the brand; mobile keeps one header brand.
- Production build passed. Chromium verified exactly one visible logo on welcome, login, registration, home, requests and profile at 320, 390, 768 and 1440px. Checked welcome links and overflow, inspected desktop/mobile screenshots; no runtime errors. Data-dependent screens used mocked API responses.

## Desktop navigation refinement

Removed the customer New request link from desktop navigation and aligned Home, Requests and Profile to the right. Mobile navigation and provider navigation retain their existing layout. The desktop layout applies from 1024px. Production build passed.

## Hero navigation with scroll blur

- On the customer homepage at 1024px and wider, Home, Requests and Profile appear in the top of the green hero, with the lighter logo/name on the left. Removed the separate homepage desktop navbar frame and its reserved space.
- Navigation tracks the hero position, then docks 12px from the viewport top. A softly fading frosted strip appears only while docked. Navigation remains visible after the hero leaves the viewport and returns naturally when scrolling up.
- Mobile bottom navigation, the welcome screen and navigation on other pages remain unchanged.
- Chromium checks passed at 1024 and 1440px for hero placement, docking, blur visibility, link navigation and scrolling back. Mobile visibility verified at 390px. Desktop screenshots inspected; no runtime errors. API responses mocked for these layout checks. Production build passed.
