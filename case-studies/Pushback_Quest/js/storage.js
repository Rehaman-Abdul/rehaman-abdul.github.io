// Safe localStorage wrapper. Every read and write is guarded, with an in-memory
// fallback so the game keeps working when storage is unavailable.

export const STORAGE_KEY = "pushbackQuest.v1";

export function defaultData() {
  return {
    achievements: [],
    endingsSeen: [],
    rolesCompleted: [],
    settings: { theme: "system", reducedMotion: false },
  };
}

let memory = null;

function normalize(parsed) {
  const base = defaultData();
  if (!parsed || typeof parsed !== "object") return base;
  return {
    achievements: Array.isArray(parsed.achievements) ? parsed.achievements : base.achievements,
    endingsSeen: Array.isArray(parsed.endingsSeen) ? parsed.endingsSeen : base.endingsSeen,
    rolesCompleted: Array.isArray(parsed.rolesCompleted) ? parsed.rolesCompleted : base.rolesCompleted,
    settings: { ...base.settings, ...(parsed.settings && typeof parsed.settings === "object" ? parsed.settings : {}) },
  };
}

export function load() {
  if (memory) return memory;
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    memory = normalize(raw ? JSON.parse(raw) : null);
  } catch {
    memory = defaultData();
  }
  return memory;
}

export function save(data) {
  memory = normalize(data);
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
    return true;
  } catch {
    return false;
  }
}

export function update(mutator) {
  const data = load();
  mutator(data);
  return save(data);
}
