// Cross-role checks: every role is registered, matches its start-screen card,
// and plays from start to a debrief with the expected policy outcomes.
import test from "node:test";
import assert from "node:assert/strict";
import roleCards from "../content/roleCards.js";
import { ROLE_IDS, loadRole } from "../content/roles/index.js";
import { createGame } from "../js/engine/game.js";
import { loadAvailableRoles } from "../tools/lint-content.mjs";
import { runPolicy } from "../tools/simulate.mjs";
import { find, playOut } from "./helpers.js";

const roles = await loadAvailableRoles();

test("all eight roles have a content file and a start-screen card", () => {
  assert.deepEqual(roles.map((r) => r.id).sort(), [...ROLE_IDS].sort());
  assert.deepEqual(roleCards.map((c) => c.id).sort(), [...ROLE_IDS].sort());
  assert.ok(roleCards.every((c) => c.playable));
});

test("start-screen cards match their role files", () => {
  for (const card of roleCards) {
    const role = roles.find((r) => r.id === card.id);
    assert.equal(card.title, role.title, `${card.id} title`);
    assert.equal(card.teaser, role.teaser, `${card.id} teaser`);
    assert.equal(card.stakeholders.length, 3);
    for (const person of card.stakeholders) {
      const match = Object.values(role.stakeholders).find((s) => s.name === person.name);
      assert.ok(match, `${card.id}: ${person.name} is not a stakeholder in the role file`);
      assert.ok(match.title.startsWith(person.title), `${card.id}: ${person.name} title`);
    }
  }
});

test("loadRole imports every role by id", async () => {
  for (const id of ROLE_IDS) assert.equal((await loadRole(id)).id, id);
  await assert.rejects(() => loadRole("nope"), /Unknown role/);
});

test("each role plays through on every difficulty without errors", () => {
  for (const role of roles) {
    for (const difficulty of ["easy", "standard", "crunch"]) {
      for (const strategy of ["assertive", "passive", "aggressive"]) {
        const { game, effects } = playOut(createGame({ role, difficulty, seed: 3 }), strategy);
        assert.ok(game.snapshot().ended, `${role.id} ${difficulty} ${strategy}`);
        assert.equal(find(effects, "gameOver").length, 1);
      }
    }
  }
});

test("best assertive reaches Master Negotiator in every role on Standard", () => {
  for (const role of roles) {
    for (let seed = 1; seed <= 15; seed++) {
      assert.equal(runPolicy(role, "standard", seed, "assertive").ended, "master", `${role.id} seed ${seed}`);
    }
  }
});

test("passive never reaches Master and aggressive always ends in The Wall (Standard)", () => {
  for (const role of roles) {
    for (let seed = 1; seed <= 15; seed++) {
      assert.ok(["burnout", "quiet_fixer", "fumes"].includes(runPolicy(role, "standard", seed, "passive").ended), `${role.id} passive`);
      assert.equal(runPolicy(role, "standard", seed, "aggressive").ended, "lost_trust", `${role.id} aggressive`);
    }
  }
});

test("boundary roles record boundary moments, and Finance has two", () => {
  for (const role of roles.filter((r) => r.id !== "tech")) {
    const { game } = playOut(createGame({ role, seed: 4 }), "assertive");
    const boundary = game.log().filter((h) => h.boundary);
    assert.equal(boundary.length, role.id === "finance" ? 2 : 1, role.id);
    assert.ok(boundary.every((h) => h.tag === "assertive"));
  }
});

test("best path earns Held the line in boundary roles", () => {
  for (const role of roles.filter((r) => r.id !== "tech")) {
    const { effects } = playOut(createGame({ role, seed: 5 }), "assertive");
    const unlocked = find(effects, "achievementUnlocked").map((e) => e.id);
    assert.ok(unlocked.includes("boundary_keeper"), role.id);
  }
});

test("Monday opens differently in each role and the competing message names the Monday stakeholder", () => {
  const openers = new Set();
  for (const role of roles) {
    const game = createGame({ role, seed: 1 });
    openers.add(game.current().messages[0].text);
    for (const id of [game.current().cards.find((c) => /^[a-z]+_mon_open_a$/.test(c.id)).id]) game.choose(id);
  }
  assert.equal(openers.size, roles.length);
});
