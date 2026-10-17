import test from "node:test";
import assert from "node:assert/strict";
import tech from "../content/roles/tech.js";
import { lintRole, lintShared, loadAvailableRoles } from "../tools/lint-content.mjs";
import { clone } from "./helpers.js";

const lintWith = (tweak) => {
  const role = clone(tech);
  tweak(role);
  return lintRole(role);
};
const choice = (role, nodeId, id) => role.nodes[nodeId].choices.find((c) => c.id === id);
const expectError = (errors, fragment) => assert.ok(errors.some((e) => e.includes(fragment)), `expected "${fragment}" in:\n${errors.join("\n")}`);

test("the Technology role and shared content lint clean", () => {
  assert.deepEqual(lintRole(tech), []);
  assert.deepEqual(lintShared(), []);
});

test("every role file on disk lints clean", async () => {
  for (const role of await loadAvailableRoles()) assert.deepEqual(lintRole(role), [], role.id);
});

test("missing required role fields are reported", () => {
  expectError(lintWith((r) => delete r.teaser), "missing teaser");
  expectError(lintWith((r) => delete r.qualityMeaning), "missing qualityMeaning");
  expectError(lintWith((r) => delete r.tips.passive), "missing tip for passive");
  expectError(lintWith((r) => delete r.criticalIncident), "missing criticalIncident");
  expectError(lintWith((r) => delete r.beats.wed.mondayFollowUp.aggressive), "mondayFollowUp: missing aggressive");
});

test("missing choice fields are reported", () => {
  expectError(lintWith((r) => delete choice(r, "tech_mon_open", "tech_mon_open_a").coaching), "missing coaching");
  expectError(lintWith((r) => delete choice(r, "tech_mon_open", "tech_mon_open_p").betterResponse), "need betterResponse");
  expectError(lintWith((r) => delete choice(r, "tech_mon_open", "tech_mon_open_g").betterResponse), "need betterResponse");
  expectError(lintWith((r) => delete choice(r, "tech_mon_open", "tech_mon_open_a").impact), "impact needs numeric");
});

test("broken next pointers and unreachable nodes are reported", () => {
  expectError(lintWith((r) => (choice(r, "tech_mon_open", "tech_mon_open_a").next = "nowhere")), "missing node nowhere");
  expectError(
    lintWith((r) => {
      r.nodes.orphan = { ...clone(r.nodes.tech_mon_after_clarify), id: "orphan" };
      for (const c of r.nodes.orphan.choices) c.id = `${c.id}_orphan`;
    }),
    "node orphan: is unreachable",
  );
});

test("each node needs exactly one passive, aggressive and assertive card", () => {
  expectError(lintWith((r) => (choice(r, "tech_mon_open", "tech_mon_open_g").tag = "passive")), "exactly one passive card (found 2)");
  expectError(lintWith((r) => (r.nodes.tech_mon_open.choices = r.nodes.tech_mon_open.choices.slice(0, 2))), "exactly one");
});

test("insights must be granted and used on Friday", () => {
  expectError(lintWith((r) => delete choice(r, "tech_mon_open", "tech_mon_open_a").grantsInsight), "tech_B: is never granted");
  expectError(lintWith((r) => (r.nodes.tech_fri_open.choices = r.nodes.tech_fri_open.choices.filter((c) => c.requiresInsight !== "tech_A"))), "tech_A: is never used on Friday");
});

test("opening nodes need a clarify card that earns an insight", () => {
  expectError(
    lintWith((r) => {
      const card = choice(r, "tech_wed_open", "tech_wed_open_a");
      delete card.grantsInsight;
      r.nodes.tech_wed_open.choices[2].subtype = "tradeoff";
    }),
    "opening node needs an assertive clarify (or boundary) card",
  );
});

test("boundary nodes need a boundary refusal and a costly compromise card", () => {
  const errors = lintWith((r) => (r.nodes.tech_wed_open.boundary = true));
  expectError(errors, "subtype boundary");
  expectError(errors, "compromise card needs quality -15 to -20");
  const fixed = lintWith((r) => {
    r.nodes.tech_wed_open.boundary = true;
    choice(r, "tech_wed_open", "tech_wed_open_a").subtype = "boundary";
    choice(r, "tech_wed_open", "tech_wed_open_p").impact.quality = -18;
  });
  assert.deepEqual(fixed.filter((e) => e.includes("boundary")), []);
});

test("length limits, tokens, brands and emoji are enforced", () => {
  expectError(lintWith((r) => (choice(r, "tech_mon_open", "tech_mon_open_a").text = "x".repeat(221))), "card is 221 characters");
  expectError(lintWith((r) => (r.nodes.tech_mon_open.messages[0].text = "x".repeat(321))), "message is 321 characters");
  expectError(lintWith((r) => (choice(r, "tech_mon_open", "tech_mon_open_a").coaching = "x".repeat(201))), "coaching is 201 characters");
  expectError(lintWith((r) => (r.nodes.tech_wed_after_passive.messages[0].text = "x".repeat(121))), "system line is 121 characters");
  expectError(lintWith((r) => (r.nodes.tech_mon_open.messages[0].text = "Hi {nickname}")), "unknown token {nickname}");
  expectError(lintWith((r) => (r.nodes.tech_mon_open.messages[0].text = "Ping me on Slack")), 'real brand "Slack"');
  expectError(lintWith((r) => (choice(r, "tech_mon_open", "tech_mon_open_p").text = "Sure 🙂")), "emoji not allowed");
  expectError(lintWith((r) => (r.nodes.tech_mon_open.messages[0].text = "Hi 🙂 there 🙂")), "more than one emoji");
  // Ordinary lower-case words are fine
  assert.deepEqual(lintWith((r) => (r.nodes.tech_mon_open.messages[0].text = "We have some slack in our teams.")), []);
});

test("impact ranges follow the tag", () => {
  expectError(lintWith((r) => (choice(r, "tech_mon_open", "tech_mon_open_p").impact.bandwidth = -5)), "outside passive range");
  expectError(lintWith((r) => (choice(r, "tech_mon_open", "tech_mon_open_g").impact.trust = -5)), "outside aggressive range");
  expectError(lintWith((r) => (choice(r, "tech_mon_open", "tech_mon_open_a").impact.quality = 30)), "outside assertive range");
  expectError(lintWith((r) => (choice(r, "tech_fri_open", "tech_fri_open_ins_A").impact.trust = 5)), "outside insight range");
});

test("$return and follow-up rules", () => {
  expectError(lintWith((r) => (choice(r, "tech_mon_open", "tech_mon_open_a").next = "$return")), "$return is only for Monday follow-up");
  expectError(lintWith((r) => (choice(r, "tech_wed_ping_assertive", "tech_wed_pa_a").next = "$endBeat")), "must use $return");
});

test("escalation nodes must add someone and openers need variants", () => {
  expectError(lintWith((r) => delete r.nodes.tech_mon_escalation.joins), "escalation node must add a different person");
  expectError(lintWith((r) => r.nodes.tech_fri_open.messages.forEach((m) => delete m.variants)), "needs a state-reactive variant");
});

test("unknown senders and condition keys are reported", () => {
  expectError(lintWith((r) => (r.nodes.tech_mon_open.messages[0].from = "ghost")), "unknown sender ghost");
  expectError(lintWith((r) => (r.nodes.tech_mon_escalation.messages[0].variants[0].when = { moodGte: 3 })), "unknown condition moodGte");
});
