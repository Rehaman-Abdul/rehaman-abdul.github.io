import test from "node:test";
import assert from "node:assert/strict";
import config from "../content/config.js";
import pool, { delayed } from "../content/events.js";
import tech from "../content/roles/tech.js";
import { createRng } from "../js/engine/rng.js";
import { chooseTransitionEvent, eligibleEvents, pickWeighted, weightOf } from "../js/engine/events.js";
import { find, newGame, playOut, tweakedTech } from "./helpers.js";

const baseState = (over = {}) => ({
  meters: { trust: 70, bandwidth: 75, quality: 75 },
  overcommit: 0,
  insights: [],
  flags: {},
  outcomes: {},
  beat: { tagsChosen: [] },
  firedEvents: [],
  difficulty: "standard",
  ...over,
});

const draw = (state, fromDay, seed = 1, extra = {}) =>
  chooseTransitionEvent({ state, role: tech, difficulty: config.difficulties.standard, rng: createRng(seed), pool, delayed, fromDay, ...extra });

test("eligibility excludes unmet conditions, fired events and weight 0", () => {
  const ids = (s) => eligibleEvents(pool, s).map((e) => e.id);
  const fresh = ids(baseState());
  assert.ok(!fresh.includes("rested"));
  assert.ok(!fresh.includes("late_night")); // needs overcommit >= 1
  assert.ok(!fresh.includes("missed_email")); // needs bandwidth < 40
  assert.ok(fresh.includes("focus_block")); // overcommit = 0
  assert.ok(ids(baseState({ overcommit: 1 })).includes("late_night"));
  assert.ok(!ids(baseState({ overcommit: 1 })).includes("focus_block"));
  assert.ok(ids(baseState({ meters: { trust: 70, bandwidth: 30, quality: 75 } })).includes("missed_email"));
  assert.ok(!ids(baseState({ meters: { trust: 49, bandwidth: 75, quality: 75 } })).includes("client_praise"));
  assert.ok(!ids(baseState({ firedEvents: ["teammate_sick"] })).includes("teammate_sick"));
});

test("difficulty multipliers adjust weights by polarity", () => {
  const sick = pool.find((e) => e.id === "teammate_sick"); // negative, weight 3
  const cancelled = pool.find((e) => e.id === "meeting_cancelled"); // positive, weight 3
  const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} vs ${b}`);
  near(weightOf(sick, config.difficulties.easy), 1.8);
  near(weightOf(cancelled, config.difficulties.easy), 4.2);
  near(weightOf(sick, config.difficulties.crunch), 4.5);
  near(weightOf(cancelled, config.difficulties.crunch), 1.8);
  near(weightOf(sick, config.difficulties.standard), 3);
});

test("weighted picking follows the weights", () => {
  const events = [
    { id: "a", polarity: "positive", weight: 1 },
    { id: "b", polarity: "positive", weight: 9 },
  ];
  const rng = createRng(3);
  const counts = { a: 0, b: 0 };
  for (let i = 0; i < 2000; i++) counts[pickWeighted(events, config.difficulties.standard, rng).id] += 1;
  assert.ok(counts.b > counts.a * 5);
  assert.equal(pickWeighted([], config.difficulties.standard, rng), null);
});

test("random selection is reproducible for a seed", () => {
  assert.equal(draw(baseState({ overcommit: 1 }), "mon", 11).id, draw(baseState({ overcommit: 1 }), "mon", 11).id);
});

test("random event impacts are capped at 10 per meter, delayed ones are not", () => {
  const big = [{ id: "big", polarity: "negative", title: "x", text: "x", impact: { bandwidth: -50, trust: 40 }, when: null, weight: 1 }];
  const event = draw(baseState(), "mon", 1, { pool: big });
  assert.deepEqual(event.impact, { bandwidth: -10, trust: 10 });
  assert.equal(draw(baseState({ overcommit: 3 }), "wed").impact.bandwidth, -25);
});

test("delayed consequences replace the random event at Wednesday to Friday", () => {
  const three = draw(baseState({ overcommit: 3 }), "wed");
  assert.equal(three.id, "running_on_empty");
  assert.equal(three.kind, "delayed");
  assert.deepEqual(three.impact, { bandwidth: -25, quality: -10 });
  assert.equal(draw(baseState({ overcommit: 5 }), "wed").id, "running_on_empty");
  const two = draw(baseState({ overcommit: 2 }), "wed");
  assert.equal(two.id, "long_week");
  assert.deepEqual(two.impact, { bandwidth: -15 });
});

test("overcommit 0 guarantees Rested and ready; overcommit 1 draws normally", () => {
  const rested = draw(baseState({ overcommit: 0 }), "wed");
  assert.equal(rested.id, "rested");
  assert.equal(rested.kind, "guaranteed");
  assert.deepEqual(rested.impact, { bandwidth: 10 });
  const one = draw(baseState({ overcommit: 1 }), "wed");
  assert.equal(one.kind, "random");
  assert.notEqual(one.id, "rested");
});

test("Monday to Wednesday never fires a delayed consequence or the guaranteed event", () => {
  for (const overcommit of [0, 2, 3]) {
    for (let seed = 1; seed <= 30; seed++) {
      const event = draw(baseState({ overcommit }), "mon", seed);
      assert.equal(event.kind, "random");
      assert.notEqual(event.id, "rested");
    }
  }
});

test("role wording replaces the shared text", () => {
  const forced = { ...pool.find((e) => e.id === "forced_update") };
  const event = draw(baseState(), "mon", 1, { pool: [forced] });
  assert.ok(event.text.includes("local build"));
});

// ---- inside the engine -------------------------------------------------------

test("a transition applies the event, announces it and never repeats one", () => {
  for (let seed = 1; seed <= 25; seed++) {
    const { game, effects } = playOut(newGame({ seed }), "assertive");
    const transitions = find(effects, "dayTransition");
    assert.equal(transitions.length, 2);
    const fired = game.snapshot().firedEvents;
    assert.equal(new Set(fired).size, fired.length);
    for (const t of transitions) {
      assert.ok(t.event, `seed ${seed}: an event fires at every transition`);
      const i = effects.indexOf(t);
      const change = effects[i + 1];
      assert.equal(change.type, "meterChange");
      assert.equal(change.source, "event");
      for (const [key, value] of Object.entries(t.event.impact)) {
        if (value) assert.equal(change.deltas[key], value);
      }
    }
  }
});

test("an all-assertive week gets the guaranteed Rested event before Friday", () => {
  const { effects } = playOut(newGame({ seed: 2 }), "assertive");
  const friday = find(effects, "dayTransition")[1];
  assert.equal(friday.event.id, "rested");
  assert.deepEqual(friday.event.impact, { bandwidth: 10 });
});

test("heavy over-commitment triggers Running on empty before Friday", () => {
  const game = newGame({ difficulty: "easy", seed: 4 });
  const effects = [];
  for (const id of ["tech_mon_open_p", "tech_mon_pas_p", "triage_hold", "tech_wed_open_p", "tech_wed_pas_p"]) {
    if (game.current().ended) break;
    effects.push(...game.choose(id));
  }
  const friday = find(effects, "dayTransition").find((t) => t.to === "fri");
  assert.equal(friday.event.id, "running_on_empty");
  assert.equal(friday.event.kind, "delayed");
  assert.deepEqual(friday.event.impact, { bandwidth: -19, quality: -8 }); // scaled by 0.75 on easy
});

test("an event that drains the last bandwidth ends the week right after the transition card", () => {
  const role = tweakedTech((r) => {
    r.nodes.tech_wed_open.choices.find((c) => c.id === "tech_wed_open_p").impact = { trust: 5, bandwidth: -30, quality: -5 };
    r.nodes.tech_mon_open.choices.find((c) => c.id === "tech_mon_open_p").impact = { trust: 5, bandwidth: -15, quality: -5 };
    r.nodes.tech_mon_after_passive.choices.find((c) => c.id === "tech_mon_pas_p").impact = { trust: 3, bandwidth: -15, quality: -5 };
    r.nodes.tech_wed_after_passive.choices.find((c) => c.id === "tech_wed_pas_p").impact = { trust: 3, bandwidth: -2, quality: -5 };
  });
  let sawEventEnding = false;
  for (let seed = 1; seed <= 60; seed++) {
    const game = newGame({ role, seed });
    const effects = [];
    for (const id of ["tech_mon_open_p", "tech_mon_pas_p", "triage_hold", "tech_wed_open_p", "tech_wed_pas_p"]) {
      if (game.current().ended) break;
      effects.push(...game.choose(id));
    }
    const friday = find(effects, "dayTransition").find((t) => t.to === "fri");
    if (friday && game.current().ended) {
      sawEventEnding = true;
      const last = effects.at(-1);
      assert.equal(last.type, "gameOver");
      assert.equal(last.ending.id, "burnout");
      assert.ok(!effects.slice(effects.indexOf(friday)).some((e) => e.type === "stakeholderMessage"));
    }
  }
  assert.ok(sawEventEnding, "expected at least one seed where the event ends the week");
});

test("same seed and choices give the same events", () => {
  const events = (seed) => find(playOut(newGame({ seed }), "assertive").effects, "dayTransition").map((t) => t.event.id);
  assert.deepEqual(events(31), events(31));
});
