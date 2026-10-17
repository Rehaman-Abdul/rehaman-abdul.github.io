import test from "node:test";
import assert from "node:assert/strict";
import achievementList from "../content/achievements.js";
import tech from "../content/roles/tech.js";
import { ROLE_IDS } from "../content/roles/index.js";
import { ENDING_ORDER } from "../js/engine/endings.js";
import { cumulativeAchievements, runAchievements } from "../js/engine/achievements.js";
import { defaultData, load, save } from "../js/storage.js";
import { recordRun } from "../js/progress.js";
import { find, newGame, playOut, tweakedTech } from "./helpers.js";

const follow = (game, ids) => ids.flatMap((id) => game.choose(id));
const earned = (game, role = tech) => runAchievements(game.snapshot(), role);

test("every achievement in the PRD has a definition", () => {
  assert.deepEqual(
    achievementList.map((a) => a.id).sort(),
    ["all_endings", "all_roles", "boundary_keeper", "crunch_survivor", "curious", "insightful", "master", "triage_pro", "turnaround", "zero_overtime"],
  );
  for (const a of achievementList) assert.ok(a.title && a.description);
});

test("zero_overtime needs a finished week with no passive choices", () => {
  assert.ok(earned(playOut(newGame(), "assertive").game).includes("zero_overtime"));
  const game = newGame();
  game.choose("tech_mon_open_p");
  assert.ok(!earned(game).includes("zero_overtime")); // week not finished
  assert.ok(!earned(playOut(newGame(), "passive").game).includes("zero_overtime"));
});

test("turnaround: an assertive choice in an escalation node", () => {
  const game = newGame();
  follow(game, ["tech_mon_open_g", "tech_mon_agg_a"]);
  assert.ok(!earned(game).includes("turnaround"));
  follow(game, ["tech_mon_esc_a"]);
  assert.ok(earned(game).includes("turnaround"));
  const other = newGame();
  follow(other, ["tech_mon_open_g", "tech_mon_agg_a", "tech_mon_esc_g"]);
  assert.ok(!earned(other).includes("turnaround"));
});

test("insightful and curious", () => {
  const game = newGame();
  follow(game, ["tech_mon_open_a"]);
  assert.ok(!earned(game).includes("curious"));
  follow(game, ["tech_mon_clar_a", "triage_hold", "tech_wed_open_a"]);
  assert.ok(earned(game).includes("curious"));
  assert.ok(!earned(game).includes("insightful"));
  follow(game, ["tech_wed_clar_a"]);
  const view = game.current();
  game.choose(view.cards.find((c) => c.usesInsight).id);
  assert.ok(earned(game).includes("insightful"));
});

test("triage_pro: the holding message", () => {
  const game = newGame();
  follow(game, ["tech_mon_open_a", "tech_mon_clar_a"]);
  assert.ok(!earned(game).includes("triage_pro"));
  game.choose("triage_hold");
  assert.ok(earned(game).includes("triage_pro"));
  const other = newGame();
  follow(other, ["tech_mon_open_a", "tech_mon_clar_a", "triage_wed"]);
  assert.ok(!earned(other).includes("triage_pro"));
});

test("boundary_keeper: assertive at every boundary node, week finished", () => {
  const role = tweakedTech((r) => {
    r.nodes.tech_wed_open.boundary = true;
    r.nodes.tech_fri_open.boundary = true;
  });
  const good = playOut(newGame({ role }), "assertive").game;
  assert.ok(runAchievements(good.snapshot(), role).includes("boundary_keeper"));

  const bad = newGame({ role });
  follow(bad, ["tech_mon_open_a", "tech_mon_clar_a", "triage_hold", "tech_wed_open_p", "tech_wed_pas_a"]);
  playOut(bad, "assertive");
  assert.ok(!runAchievements(bad.snapshot(), role).includes("boundary_keeper"));

  // A role with no boundary nodes cannot earn it.
  assert.ok(!earned(playOut(newGame(), "assertive").game).includes("boundary_keeper"));
});

test("master and crunch_survivor depend on the ending and difficulty", () => {
  const base = playOut(newGame({ difficulty: "crunch" }), "assertive").game.snapshot();
  assert.ok(runAchievements({ ...base, ended: "steady" }, tech).includes("crunch_survivor"));
  assert.ok(!runAchievements({ ...base, ended: "burnout" }, tech).includes("crunch_survivor"));
  assert.ok(!runAchievements({ ...base, ended: "lost_trust" }, tech).includes("crunch_survivor"));
  assert.ok(!runAchievements({ ...base, difficulty: "standard", ended: "steady" }, tech).includes("crunch_survivor"));
  assert.ok(runAchievements({ ...base, ended: "master" }, tech).includes("master"));
  assert.ok(!runAchievements({ ...base, ended: "steady" }, tech).includes("master"));
});

test("cumulative achievements need every ending / every role", () => {
  assert.deepEqual(cumulativeAchievements({ endingsSeen: ENDING_ORDER.slice(1), rolesCompleted: [] }), []);
  assert.deepEqual(cumulativeAchievements({ endingsSeen: ENDING_ORDER, rolesCompleted: [] }), ["all_endings"]);
  assert.deepEqual(cumulativeAchievements({ endingsSeen: [], rolesCompleted: ROLE_IDS }), ["all_roles"]);
});

test("the engine announces achievements once, before gameOver", () => {
  const { effects } = playOut(newGame(), "assertive");
  const unlocked = find(effects, "achievementUnlocked").map((e) => e.id);
  assert.equal(new Set(unlocked).size, unlocked.length);
  assert.ok(unlocked.includes("triage_pro"));
  assert.ok(unlocked.includes("zero_overtime"));
  assert.equal(effects.at(-1).type, "gameOver");
});

// ---- persistence ----------------------------------------------------------------

test("recordRun saves endings, roles and achievements, flagging only new ones", () => {
  save(defaultData());
  const run = playOut(newGame(), "assertive").game;
  const first = recordRun({ snapshot: run.snapshot(), role: tech });
  assert.ok(first.fresh.includes("zero_overtime"));
  const saved = load();
  assert.ok(saved.endingsSeen.includes(run.snapshot().ended));
  assert.deepEqual(saved.rolesCompleted, ["tech"]);
  assert.ok(saved.achievements.includes("zero_overtime"));

  const second = recordRun({ snapshot: run.snapshot(), role: tech });
  assert.ok(second.earned.includes("zero_overtime"));
  assert.deepEqual(second.fresh, []);
  assert.deepEqual(load().rolesCompleted, ["tech"]);
});

test("a week ended early is not a completed role", () => {
  save(defaultData());
  const run = playOut(newGame(), "aggressive").game;
  recordRun({ snapshot: run.snapshot(), role: tech });
  assert.deepEqual(load().rolesCompleted, []);
  assert.deepEqual(load().endingsSeen, ["lost_trust"]);
});

test("cumulative achievements unlock when the last role or ending arrives", () => {
  save({ ...defaultData(), endingsSeen: ENDING_ORDER.filter((id) => id !== "steady"), rolesCompleted: ROLE_IDS.filter((id) => id !== "tech") });
  const run = playOut(newGame(), "assertive").game;
  const snapshot = { ...run.snapshot(), ended: "steady" };
  const result = recordRun({ snapshot, role: tech });
  assert.ok(result.fresh.includes("all_endings"));
  assert.ok(result.fresh.includes("all_roles"));
});

test("storage falls back to memory when localStorage is unavailable", () => {
  assert.equal(typeof globalThis.localStorage, "undefined");
  save({ ...defaultData(), achievements: ["x"] });
  assert.deepEqual(load().achievements, ["x"]);
});
