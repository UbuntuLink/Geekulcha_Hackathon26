# Accessibility — where to adjust what

A map for making UbuntuLink work for people with disabilities: colour blindness, low vision, blindness, motor
and hearing impairments, and low literacy. For each need it says what the app already does, what's missing,
and **the exact file to change**. Nothing here has been changed yet.

---

## 1. Where the look of the app is controlled

Change these and the whole app follows.

| What | File | Notes |
|---|---|---|
| Brand colours for the app screens (`brand`, `ink`, `cream`, …) | `frontend/tailwind.config.js` → `theme.extend.colors` | Used as Tailwind classes such as `bg-brand` and `text-ink`. |
| Colours for the landing page and some shared styles | `frontend/src/styles/index.css` → `:root` (`--ul-green`, `--ul-red`, `--ul-gold`, `--ul-blue`, …) | CSS variables. |
| Keyboard focus outline | `frontend/src/styles/index.css`, around line 129 (`button:focus-visible, a:focus-visible, …`) | |
| Status labels for jobs | `frontend/src/lib/bookingSteps.js` | One place for "On the way", "Completed" etc. |
| All text on screen, in five languages | `frontend/src/context/LanguageContext.jsx` | |

**Where to add a theme later:** a high-contrast or colour-blind-safe theme can be added by redefining the
colours in both places above under a class such as `.theme-high-contrast` on `<html>`, and adding a toggle
to `frontend/src/components/layout/AccountControls.jsx` (it already holds language and read-aloud, and
appears in the desktop nav bar and on the Profile screen on phones).

---

## 2. Colour blindness

**Problem:** several statuses are told apart mainly by colour — red vs green vs amber:

| Where | What relies on colour | File |
|---|---|---|
| Work tracker badge | Cancelled (red) / Completed (green) / in progress (brand green) | `pages/customer/BookingTracking.jsx` |
| Provider bookings list | Same badges | `pages/provider/ProviderBookings.jsx` |
| Quotes | Pending (amber) / Accepted (green) / Declined (grey) | `pages/customer/Quotes.jsx` (`STATUS_STYLES`) |
| Stars on profiles and reviews | Gold filled vs grey empty | `pages/customer/ProviderProfileView.jsx` (`Stars`) |
| Errors vs success messages | Red vs green boxes | `components/common/ErrorBanner.jsx`, success boxes on each page |
| "Available today" | Green text, plus a green dot on the provider's avatar | `ProviderProfileView.jsx`, `components/common/ProviderCard.jsx` |
| Landing page trust icons | Red / green / blue / gold | `pages/customer/Welcome.jsx`, `index.css` |

**Already OK:** every one of these also shows the status **as text** ("Cancelled", "Pending", "4.8 · 12
reviews"), so no information is lost for most colour-blind users. Red–green colour blindness mainly affects
how *quickly* the difference is noticed.

**To improve:**
1. Add a symbol next to each status: ✓ completed, ✕ cancelled, ⏳ pending — in `lib/bookingSteps.js` and
   `Quotes.jsx` `STATUS_STYLES`.
2. Swap red/green pairs for a colour-blind-safe pair (blue `#0072B2` / orange `#E69F00`) in the theme
   above, if a colour-blind theme is added.
3. Stars: already shows the number; keep it.

---

## 3. Low vision

| Need | Current state | Where to change |
|---|---|---|
| Text size | Follows the browser's font size (Tailwind uses `rem`). But **14 places use fixed tiny text** (`text-[10px]`, `text-[11px]`) for badges and nav labels. | Search the code for `text-[10px]` / `text-[11px]`; raise to `text-xs` (12px) minimum. |
| Contrast | Grey helper text (`text-gray-400`) on white is below the WCAG AA contrast ratio (4.5:1). | Replace `text-gray-400` with `text-gray-500`/`600` for any text that carries meaning (timestamps, hints). |
| Zoom | Layouts work down to phone width, so 200% zoom is usable. | — |
| High-contrast mode | Not available. | See §1, "where to add a theme". |

---

## 4. Blind and screen-reader users

**Already in place:**
- **Read aloud**: a button reads the whole current page (browser speech). `components/layout/AccountControls.jsx`.
- **Voice input** on "Describe your problem" — speak instead of type, any language. `pages/customer/DescribeProblem.jsx`.
- Stars, unread badges and progress have `aria-label`s; status messages use `role="status"`; errors use
  `role="alert"`.
- Images have `alt` text; decorative ones are hidden from screen readers.

**To improve:**
| Gap | Where |
|---|---|
| New chat messages aren't announced unless the reader is in the thread (it's `aria-live`); the unread badge change isn't announced. | `components/layout/BottomNav.jsx` (`UnreadBadge`) — add an `aria-live="polite"` count. |
| Tracker updates arriving from the provider aren't announced. | `pages/customer/BookingTracking.jsx` — announce status changes in an `aria-live` region. |
| Some clickable cards are `<div>`s with click handlers. | `components/common/Card.jsx` already adds `role="button"` + keyboard support when `onClick` is set — use it instead of raw divs. |

---

## 5. Motor impairments (keyboard / switch users, shaky hands)

**Already in place:** focus outlines on all buttons, links and inputs; cards with `onClick` work with Enter and
Space; most buttons are full-width on phones.

**To improve:**
| Gap | Where |
|---|---|
| Some small tap targets (the ✕ on photo previews is 24px; chips and "Skip to" buttons are small). Aim for 44×44px. | `pages/customer/ReviewProvider.jsx`, `pages/customer/BookingTracking.jsx`, sort chips in `pages/customer/MatchingProviders.jsx` |
| Auto-refreshing pages (tracker 15 s, quotes 15 s, chat 4 s) don't move focus, which is good — keep it that way. | — |

---

## 6. Deaf and hard-of-hearing users

- The app has no audio-only content. The landing page video is muted and decorative.
- Chat and the work-tracker notes give a text channel instead of phone calls — useful to point out in the demo.

---

## 7. Motion sensitivity

- The landing page hero video already stops for users with "reduce motion" turned on (`Welcome.jsx`).
- **Not yet:** the fade-in animations on cards, the pulsing record button and hover lifts ignore that setting.
  Add one rule to `frontend/src/styles/index.css`:
  `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }`

---

## 8. Low literacy and language

**Already in place:** five languages (English, isiZulu, Sesotho, Setswana, Afrikaans) in
`context/LanguageContext.jsx`; describe problems in your own words (spelling doesn't matter); speak instead of
type; read aloud.

**To improve:** some newer screens (Quotes, Messages, work tracker) still have English-only text written
directly in the page instead of going through `t("...")`. Move those strings into `LanguageContext.jsx`.

---

## Quick wins, in order

1. Reduced-motion rule in `index.css` (one line, §7).
2. Minimum text size: replace `text-[10px]` / `text-[11px]` (§3).
3. Darker helper text: `text-gray-400` → `text-gray-500` where it carries meaning (§3).
4. Symbols next to status colours (§2).
5. A high-contrast / colour-blind theme toggle in `AccountControls.jsx` (§1).
