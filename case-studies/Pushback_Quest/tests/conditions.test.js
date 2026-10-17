import test from "node:test";
import assert from "node:assert/strict";
import { matches, pickText } from "../js/engine/conditions.js";

const state = (over = {}) => ({
  meters: { trust: 50, bandwidth: 40, quality: 60 },
  overcommit: 2,
  insights: ["a"],
  flags: { criticalIncident: true },
  outcomes: { mon: "assertive" },
  beat: { tagsChosen: ["passive"] },
  difficulty: "standard",
  ...over,
});

test("an empty or missing condition always matches", () => {
  assert.equal(matches(undefined, state()), true);
  assert.equal(matches({}, state()), true);
});

test("meter comparisons", () => {
  const s = state();
  assert.equal(matches({ trustLt: 51 }, s), true);
  assert.equal(matches({ trustLt: 50 }, s), false);
  assert.equal(matches({ trustGte: 50 }, s), true);
  assert.equal(matches({ bandwidthLt: 41 }, s), true);
  assert.equal(matches({ bandwidthGte: 41 }, s), false);
  assert.equal(matches({ qualityLt: 61 }, s), true);
  assert.equal(matches({ qualityGte: 60 }, s), true);
});

test("overcommit, insight, flag, outcome, tag and difficulty", () => {
  const s = state();
  assert.equal(matches({ overcommitGte: 2 }, s), true);
  assert.equal(matches({ overcommitGte: 3 }, s), false);
  assert.equal(matches({ overcommitEq: 2 }, s), true);
  assert.equal(matches({ hasInsight: "a" }, s), true);
  assert.equal(matches({ hasInsight: "b" }, s), false);
  assert.equal(matches({ flag: "criticalIncident" }, s), true);
  assert.equal(matches({ flag: "other" }, s), false);
  assert.equal(matches({ mondayOutcome: "assertive" }, s), true);
  assert.equal(matches({ mondayOutcome: "passive" }, s), false);
  assert.equal(matches({ beatHadTag: "passive" }, s), true);
  assert.equal(matches({ beatHadTag: "aggressive" }, s), false);
  assert.equal(matches({ difficulty: "standard" }, s), true);
  assert.equal(matches({ difficulty: ["easy", "crunch"] }, s), false);
});

test("keys combine with AND", () => {
  const s = state();
  assert.equal(matches({ trustGte: 50, overcommitGte: 2 }, s), true);
  assert.equal(matches({ trustGte: 50, overcommitGte: 3 }, s), false);
});

test("unknown keys throw", () => {
  assert.throws(() => matches({ trustLess: 1 }, state()), /Unknown condition key/);
});

test("pickText: first matching variant wins, else default", () => {
  const item = {
    text: "default",
    variants: [
      { when: { trustLt: 10 }, text: "never" },
      { when: { overcommitGte: 2 }, text: "first" },
      { when: { overcommitGte: 1 }, text: "second" },
    ],
  };
  assert.equal(pickText(item, state()), "first");
  assert.equal(pickText(item, state({ overcommit: 0 })), "default");
  assert.equal(pickText({ text: "plain" }, state()), "plain");
});
