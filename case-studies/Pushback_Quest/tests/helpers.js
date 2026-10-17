// Shared test helpers (not a test file: the name does not match *.test.js).
import tech from "../content/roles/tech.js";
import { createGame } from "../js/engine/game.js";

export const clone = (value) => structuredClone(value);

export function newGame(opts = {}) {
  const { role = tech, ...rest } = opts;
  return createGame({ role, seed: 1, ...rest });
}

// Clone the tech role, then let a callback tweak the copy (impacts, tags, ...).
export function tweakedTech(tweak) {
  const role = clone(tech);
  tweak(role);
  return role;
}

export function choiceOf(role, nodeId, choiceId) {
  return role.nodes[nodeId].choices.find((c) => c.id === choiceId);
}

export function tagOf(role, view, cardId) {
  if (cardId.startsWith("triage_")) return "assertive";
  return choiceOf(role, view.nodeId, cardId).tag;
}

// Picks a card for a strategy: "assertive" (insight cards first, holding
// message at triage), "passive" or "aggressive".
export function pick(role, view, strategy) {
  const ids = view.cards.map((c) => c.id);
  if (view.kind === "triage") {
    return strategy === "assertive" ? "triage_hold" : "triage_wed";
  }
  const withTag = (tag) => ids.filter((id) => tagOf(role, view, id) === tag);
  if (strategy === "assertive") {
    const insight = view.cards.find((c) => c.usesInsight);
    if (insight) return insight.id;
  }
  return withTag(strategy)[0];
}

// Plays to the end with a strategy. Returns { game, effects } (all effects).
export function playOut(game, strategy, guard = 60) {
  const all = [];
  for (let i = 0; i < guard; i++) {
    const view = game.current();
    if (view.ended) return { game, effects: all };
    all.push(...game.choose(pick(game.role, view, strategy)));
  }
  throw new Error("Run did not finish");
}

export const find = (effects, type) => effects.filter((e) => e.type === type);
