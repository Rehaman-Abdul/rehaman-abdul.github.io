// Event selection at day transitions (PRD sections 5.7 and 5.9). Pure logic:
// the caller supplies the state, the seeded rng and the content.
import config from "../../content/config.js";
import { matches } from "./conditions.js";

const cap = (n) => {
  const limit = config.thresholds.eventImpactCap;
  return Math.max(-limit, Math.min(limit, n));
};

function describe(event, roleId, kind) {
  const impact = {};
  for (const [key, value] of Object.entries(event.impact)) impact[key] = kind === "random" ? cap(value) : value;
  return {
    id: event.id,
    kind,
    polarity: event.polarity,
    title: event.title,
    text: (event.roleText && event.roleText[roleId]) || event.text,
    impact,
  };
}

export function weightOf(event, difficulty) {
  const multiplier = event.polarity === "negative" ? difficulty.eventNegativeWeight : difficulty.eventPositiveWeight;
  return event.weight * multiplier;
}

// Events that could fire right now: weight above zero, condition met, not yet fired.
export function eligibleEvents(pool, state) {
  return pool.filter((e) => e.weight > 0 && !state.firedEvents.includes(e.id) && matches(e.when, state));
}

export function pickWeighted(events, difficulty, rng) {
  const weights = events.map((e) => weightOf(e, difficulty));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;
  let roll = rng.next() * total;
  for (let i = 0; i < events.length; i++) {
    roll -= weights[i];
    if (roll < 0) return events[i];
  }
  return events[events.length - 1];
}

// fromDay is "mon" or "wed". Returns an event description or null.
export function chooseTransitionEvent({ state, role, difficulty, rng, pool, delayed, fromDay }) {
  if (fromDay === "wed") {
    const consequence = [...delayed].sort((a, b) => b.minOvercommit - a.minOvercommit).find((d) => state.overcommit >= d.minOvercommit);
    if (consequence) return describe(consequence, role.id, "delayed");
    if (state.overcommit === 0) {
      const rested = pool.find((e) => e.id === "rested");
      if (rested && !state.firedEvents.includes("rested")) return describe(rested, role.id, "guaranteed");
    }
  }
  const picked = pickWeighted(eligibleEvents(pool, state), difficulty, rng);
  return picked ? describe(picked, role.id, "random") : null;
}
