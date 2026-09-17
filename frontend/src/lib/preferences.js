// Onboarding answers (name/location/priority) are UI-only for now — there's no profile-update
// backend endpoint yet, so this just drives the greeting + client-side sort on Matching
// Providers. See PROJECT.md §7.
const KEY = "ubuntulink.onboarding";

export function getOnboarding() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function setOnboarding(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...getOnboarding(), ...data }));
  } catch {
    // ignore (private browsing etc.)
  }
}
