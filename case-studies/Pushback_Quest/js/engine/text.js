// Text tokens: {name}, {name|fallback}, {role} and a few context tokens.
// The output is plain text. The UI must insert it with textContent only.

export const NAME_MAX_LENGTH = 24;
export const KNOWN_TOKENS = ["name", "role", "mon", "wed", "who"];

const TOKEN = /\{(\w+)(?:\|([^{}]*))?\}/g;

// Keeps letters, spaces, hyphens and apostrophes; trims and limits length.
export function sanitizeName(raw) {
  if (typeof raw !== "string") return "";
  const cleaned = raw
    .normalize("NFC")
    .replace(/[^\p{L}\p{M} '’-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, NAME_MAX_LENGTH)
    .trim();
  return /\p{L}/u.test(cleaned) ? cleaned : "";
}

export function resolveText(text, vars = {}) {
  let blanked = false;
  const out = text.replace(TOKEN, (whole, key, fallback) => {
    if (!KNOWN_TOKENS.includes(key)) return whole;
    const value = vars[key];
    if (value) return value;
    if (fallback !== undefined) return fallback;
    blanked = true;
    return "";
  });
  return blanked ? out.replace(/ {2,}/g, " ").replace(/ ([,.!?])/g, "$1").trim() : out;
}

// Lists token names used in a string (for the content linter).
export function tokensIn(text) {
  return [...text.matchAll(TOKEN)].map((m) => m[1]);
}
