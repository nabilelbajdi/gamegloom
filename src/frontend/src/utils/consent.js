// Cookie / localStorage consent management.
// Auth token + this consent record are strictly necessary; everything below this
// is functional storage that only persists when the user has accepted.

const CONSENT_KEY = "cookieConsent"; // value: "accepted" | "declined" | null

// All localStorage keys that count as functional storage (require consent).
// Keep this list in sync with anywhere we read/write localStorage for non-essential data.
const FUNCTIONAL_KEYS = [
  "rememberMe",
  "rememberedUsername",
  "recentlyViewedGames",
  "libraryViewMode",
  "listDetailViewMode",
  "allGamesViewMode",
  "searchViewMode",
  "categoryViewMode",
];

export const CONSENT_CHANGED_EVENT = "gamegloom:consent-changed";

export const getConsent = () => localStorage.getItem(CONSENT_KEY);

export const hasConsent = () => getConsent() === "accepted";

export const hasDecided = () => {
  const v = getConsent();
  return v === "accepted" || v === "declined";
};

export const setConsent = (value) => {
  // value: "accepted" or "declined"
  if (value !== "accepted" && value !== "declined") return;
  localStorage.setItem(CONSENT_KEY, value);
  if (value === "declined") {
    clearAllFunctionalStorage();
  }
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: value }));
};

export const resetConsent = () => {
  localStorage.removeItem(CONSENT_KEY);
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: null }));
};

export const clearAllFunctionalStorage = () => {
  FUNCTIONAL_KEYS.forEach((key) => localStorage.removeItem(key));
};

// Safe wrappers: read returns null if no consent; write is a no-op if no consent.
export const readFunctional = (key) => (hasConsent() ? localStorage.getItem(key) : null);

export const writeFunctional = (key, value) => {
  if (hasConsent()) localStorage.setItem(key, value);
};

export const removeFunctional = (key) => {
  // Always safe to remove regardless of consent
  localStorage.removeItem(key);
};
