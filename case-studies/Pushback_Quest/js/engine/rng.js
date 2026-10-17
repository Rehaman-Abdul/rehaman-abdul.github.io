// Seeded PRNG (mulberry32) and Fisher-Yates shuffle. Pure, no DOM access.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed) {
  const next = mulberry32(seed);
  return {
    seed,
    next,
    // Integer in [0, max)
    int(max) {
      return Math.floor(next() * max);
    },
    // Returns a new shuffled array; the input is never mutated.
    shuffle(items) {
      const out = items.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
  };
}

// Seed for a new run, taken from the current time. Kept to five digits so it
// reads well as "Run #48213" in the debrief.
export function seedFromTime(now = Date.now()) {
  return now % 100000;
}

// Reads ?seed=<number> from a query string. Returns null when absent or invalid.
export function parseSeed(search) {
  const value = new URLSearchParams(search || "").get("seed");
  if (value === null || !/^\d{1,10}$/.test(value)) return null;
  return Number(value);
}
