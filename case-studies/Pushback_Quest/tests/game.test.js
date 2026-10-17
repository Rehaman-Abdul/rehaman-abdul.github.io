import test from "node:test";
import assert from "node:assert/strict";
import { createGame } from "../js/engine/game.js";
import tech from "../content/roles/tech.js";
import { find, newGame, playOut, tweakedTech } from "./helpers.js";

const ids = (view) => view.cards.map((c) => c.id).sort();

// Plays a short, known path: Monday all-assertive, ending at Wednesday triage.
function toWednesday(game) {
  game.choose("tech_mon_open_a");
  game.choose("tech_mon_clar_a");
  return game.current();
}

test("starting meters follow the difficulty", () => {
  assert.deepEqual(newGame({ difficulty: "easy" }).snapshot().meters, { trust: 80, bandwidth: 85, quality: 80 });
  assert.deepEqual(newGame({ difficulty: "standard" }).snapshot().meters, { trust: 70, bandwidth: 75, quality: 75 });
  assert.deepEqual(newGame({ difficulty: "crunch" }).snapshot().meters, { trust: 60, bandwidth: 55, quality: 65 });
});

test("unknown difficulty or missing role throws", () => {
  assert.throws(() => newGame({ difficulty: "nope" }), /Unknown difficulty/);
  assert.throws(() => createGame({}), /role/);
});

test("the opening view shows Priya's messages with the name token resolved", () => {
  const view = newGame({ name: "Sam" }).current();
  assert.equal(view.kind, "choice");
  assert.equal(view.nodeId, "tech_mon_open");
  assert.equal(view.messages[0].text, "Morning Sam! Leadership loved the video hero on a competitor's site.");
  assert.equal(newGame().current().messages[0].text.startsWith("Morning there!"), true);
});

test("the name is sanitized before use", () => {
  const view = newGame({ name: "<b>Sam</b>" }).current();
  assert.ok(!view.messages[0].text.includes("<"));
});

test("views never leak impacts or coaching to the UI", () => {
  const card = newGame().current().cards[0];
  assert.deepEqual(Object.keys(card).sort(), ["id", "text"]);
});

test("every node starts with exactly three cards, one per tag", () => {
  const game = newGame();
  assert.equal(game.current().cards.length, 3);
});

test("negative impacts scale with difficulty and round to the nearest integer", () => {
  // tech_mon_open_p: trust +5, bandwidth -20, quality -10
  const crunch = newGame({ difficulty: "crunch" });
  crunch.choose("tech_mon_open_p");
  assert.deepEqual(crunch.log()[0].appliedImpact, { trust: 5, bandwidth: -25, quality: -13 });
  assert.deepEqual(crunch.snapshot().meters, { trust: 65, bandwidth: 30, quality: 52 });

  const easy = newGame({ difficulty: "easy" });
  easy.choose("tech_mon_open_p");
  assert.deepEqual(easy.log()[0].appliedImpact, { trust: 5, bandwidth: -15, quality: -8 });

  const standard = newGame();
  standard.choose("tech_mon_open_p");
  assert.deepEqual(standard.log()[0].appliedImpact, { trust: 5, bandwidth: -20, quality: -10 });
});

test("meters are clamped to 0..100", () => {
  const role = tweakedTech((r) => {
    r.nodes.tech_mon_open.choices.find((c) => c.id === "tech_mon_open_a").impact = { trust: 100, bandwidth: 100, quality: 100 };
  });
  const game = newGame({ role });
  const effects = game.choose("tech_mon_open_a");
  assert.deepEqual(game.snapshot().meters, { trust: 100, bandwidth: 100, quality: 100 });
  assert.deepEqual(find(effects, "meterChange")[0].meters, { trust: 100, bandwidth: 100, quality: 100 });
});

test("choosing records history by id and counts passive over-commitment", () => {
  const game = newGame();
  game.choose("tech_mon_open_p");
  game.choose("tech_mon_pas_p");
  const snap = game.snapshot();
  assert.equal(snap.overcommit, 2);
  assert.deepEqual(game.log().map((h) => [h.choiceId, h.tag]), [
    ["tech_mon_open_p", "passive"],
    ["tech_mon_pas_p", "passive"],
  ]);
  const aggressive = newGame();
  aggressive.choose("tech_mon_open_g");
  assert.equal(aggressive.snapshot().overcommit, 0);
});

test("choose returns ordered effects: player message, then meters, then the reply", () => {
  const effects = newGame().choose("tech_mon_open_a");
  assert.deepEqual(effects.map((e) => e.type), ["playerMessage", "meterChange", "insightAdded", "stakeholderMessage", "stakeholderMessage"]);
});

test("unknown choices are rejected", () => {
  assert.throws(() => newGame().choose("nope"), /Unknown or unavailable choice/);
});

// ---- insights ---------------------------------------------------------------

test("a clarify card grants its insight and it shows in the notes", () => {
  const game = newGame();
  const effects = game.choose("tech_mon_open_a");
  assert.deepEqual(find(effects, "insightAdded")[0], {
    type: "insightAdded",
    id: "tech_B",
    title: "Client wants 3 usage views",
    note: "Halvern Analytics only cares about the three usage views.",
  });
  assert.deepEqual(game.current().notes.map((n) => n.id), ["tech_B"]);
});

test("insight cards unlock on Friday only for earned insights, at most two", () => {
  const none = newGame();
  for (const id of ["tech_mon_open_p", "tech_mon_pas_a", "triage_hold", "tech_wed_open_p", "tech_wed_pas_a"]) none.choose(id);
  assert.equal(none.current().nodeId, "tech_fri_open");
  assert.deepEqual(ids(none.current()).filter((id) => id.includes("_ins_")), []);

  const both = newGame();
  playUntil(both, "tech_fri_open", "assertive");
  const view = both.current();
  assert.deepEqual(view.notes.map((n) => n.id).sort(), ["tech_A", "tech_B"]);
  assert.equal(view.cards.length, 5);
  const insightCards = view.cards.filter((c) => c.usesInsight);
  assert.equal(insightCards.length, 2);
  assert.deepEqual(insightCards.map((c) => c.usesInsight.id).sort(), ["tech_A", "tech_B"]);
});

test("only the earned insight unlocks its card", () => {
  const game = newGame();
  game.choose("tech_mon_open_a"); // earns tech_B
  game.choose("tech_mon_clar_a");
  game.choose("triage_hold");
  game.choose("tech_wed_open_p"); // passive: no tech_A
  game.choose("tech_wed_pas_p");
  const view = game.current();
  assert.equal(view.nodeId, "tech_fri_open");
  assert.deepEqual(view.cards.filter((c) => c.usesInsight).map((c) => c.usesInsight.id), ["tech_B"]);
});

function playUntil(game, nodeId, strategy) {
  for (let i = 0; i < 40 && game.current().nodeId !== nodeId; i++) {
    const view = game.current();
    const id = view.kind === "triage" ? "triage_hold" : strategyCard(game, view, strategy);
    game.choose(id);
  }
  assert.equal(game.current().nodeId, nodeId);
}

function strategyCard(game, view, strategy) {
  const node = game.role.nodes[view.nodeId];
  return view.cards.map((c) => node.choices.find((x) => x.id === c.id)).find((c) => c.tag === strategy).id;
}

// ---- escalation -------------------------------------------------------------

test("an aggressive choice sends the beat to its escalation node, which adds the manager", () => {
  const game = newGame();
  game.choose("tech_mon_open_g");
  const effects = game.choose("tech_mon_agg_a"); // repaired, but the beat still had an aggressive choice
  assert.equal(game.current().nodeId, "tech_mon_escalation");
  assert.deepEqual(find(effects, "participantJoined")[0].name, "Dana Okafor");
  assert.equal(find(effects, "systemLine")[0].text, "Dana Okafor was added to the conversation");
  // The escalation variant reflects why Dana joined
  assert.ok(game.current().messages[0].text.includes("after this morning"));
});

test("low trust triggers escalation even without an aggressive choice", () => {
  const role = tweakedTech((r) => {
    r.nodes.tech_mon_after_clarify.choices.find((c) => c.id === "tech_mon_clar_p").impact = { trust: -40, bandwidth: -18, quality: -8 };
  });
  const game = newGame({ role });
  game.choose("tech_mon_open_a");
  game.choose("tech_mon_clar_p"); // trust 76 - 40 = 36, below the standard threshold of 40
  assert.equal(game.current().nodeId, "tech_mon_escalation");
});

test("the escalation threshold depends on difficulty", () => {
  // trust 66 after the clarify card on crunch (60 + 6); threshold 50 -> no escalation at 66
  const game = newGame({ difficulty: "crunch" });
  game.choose("tech_mon_open_a");
  game.choose("tech_mon_clar_a");
  assert.equal(game.current().kind, "triage");
});

test("no escalation when the beat was handled assertively", () => {
  const game = newGame();
  const view = toWednesday(game);
  assert.equal(view.kind, "triage");
  assert.equal(view.day, "wed");
});

test("at most one escalation per beat", () => {
  const game = newGame();
  game.choose("tech_mon_open_g");
  game.choose("tech_mon_agg_g");
  assert.equal(game.current().nodeId, "tech_mon_escalation");
  game.choose("tech_mon_esc_g"); // aggressive again: still moves on
  assert.equal(game.current().day, "wed");
  assert.equal(game.current().kind, "triage");
});

test("a strong assertive reply in escalation is recorded as an escalation choice", () => {
  const game = newGame();
  game.choose("tech_mon_open_g");
  game.choose("tech_mon_agg_a");
  game.choose("tech_mon_esc_a");
  assert.equal(game.log().at(-1).escalation, true);
  assert.equal(game.log()[0].escalation, false);
});

// ---- Wednesday triage ---------------------------------------------------------

test("Wednesday opens with triage: Marcus's messages, a competing preview and three cards", () => {
  const game = newGame();
  const effects = [...game.choose("tech_mon_open_a"), ...game.choose("tech_mon_clar_a")];
  const view = game.current();
  assert.equal(view.kind, "triage");
  assert.equal(view.nodeId, "tech_wed_open");
  assert.equal(view.messages[0].fromName, "Marcus Lindqvist");
  assert.equal(view.preview.fromName, "Priya Raman");
  assert.deepEqual(ids(view), ["triage_hold", "triage_mon", "triage_wed"]);
  assert.deepEqual(find(effects, "dayTransition").map((e) => [e.from, e.to]), [["mon", "wed"]]);
  assert.equal(find(effects, "triage").length, 1);
});

test("the competing message depends on Monday's outcome", () => {
  const assertive = newGame();
  toWednesday(assertive);
  assert.ok(assertive.current().preview.text.includes("checking in"));

  const passive = newGame();
  passive.choose("tech_mon_open_p");
  passive.choose("tech_mon_pas_p");
  assert.ok(passive.current().preview.text.includes("countdown"));

  const aggressive = newGame();
  aggressive.choose("tech_mon_open_g");
  aggressive.choose("tech_mon_agg_g");
  aggressive.choose("tech_mon_esc_g");
  assert.ok(aggressive.current().preview.text.startsWith("Hi. Following up"));
});

test("triage: a holding message costs no trust and only 3 bandwidth", () => {
  const game = newGame();
  toWednesday(game);
  const before = game.snapshot().meters;
  const effects = game.choose("triage_hold");
  const after = game.snapshot().meters;
  assert.equal(after.trust, before.trust);
  assert.equal(after.bandwidth, before.bandwidth - 3);
  assert.equal(find(effects, "playerMessage")[0].text, "Saw this, I'll get back to you by 4 PM.");
  const view = game.current();
  assert.equal(view.kind, "choice");
  assert.equal(view.nodeId, "tech_wed_open");
  assert.deepEqual(view.messages, []); // already delivered during triage
  assert.equal(game.log().at(-1).subtype, "holding");
  assert.equal(game.log().at(-1).tag, "assertive");
});

test("triage: answering either person first applies the difficulty's waiting penalty", () => {
  for (const [difficulty, penalty] of [["easy", 4], ["standard", 7], ["crunch", 10]]) {
    for (const card of ["triage_wed", "triage_mon"]) {
      const game = newGame({ difficulty });
      toWednesday(game);
      const before = game.snapshot().meters;
      game.choose(card);
      const after = game.snapshot().meters;
      assert.equal(after.trust, before.trust - penalty, `${difficulty} ${card}`);
      assert.equal(after.bandwidth, before.bandwidth);
    }
  }
});

test("triage: answering Monday first plays Priya's follow-up, then returns to Wednesday", () => {
  const game = newGame();
  toWednesday(game);
  game.choose("triage_mon");
  assert.equal(game.current().nodeId, "tech_wed_ping_assertive");
  assert.equal(game.current().chat, "priya");
  game.choose("tech_wed_pa_a");
  const view = game.current();
  assert.equal(view.nodeId, "tech_wed_open");
  assert.deepEqual(view.messages, []);
  assert.equal(view.cards.length, 3);
});

test("triage: answering Wednesday first skips Priya's follow-up", () => {
  const game = newGame();
  toWednesday(game);
  game.choose("triage_wed");
  assert.equal(game.current().nodeId, "tech_wed_open");
  assert.ok(!game.log().some((h) => h.choiceId.startsWith("tech_wed_pa")));
});

// ---- failure states -----------------------------------------------------------

test("bandwidth reaching 0 ends the week with Burnout", () => {
  const role = tweakedTech((r) => {
    r.nodes.tech_mon_open.choices.find((c) => c.id === "tech_mon_open_p").impact = { trust: 5, bandwidth: -200, quality: 0 };
  });
  const game = newGame({ role });
  const effects = game.choose("tech_mon_open_p");
  assert.equal(find(effects, "gameOver")[0].ending.id, "burnout");
  assert.equal(effects.at(-1).type, "gameOver");
  assert.equal(game.current().ended, true);
  assert.throws(() => game.choose("tech_mon_pas_p"), /over/);
});

test("trust reaching 0 ends the week with The Wall", () => {
  const role = tweakedTech((r) => {
    r.nodes.tech_mon_open.choices.find((c) => c.id === "tech_mon_open_g").impact = { trust: -200, bandwidth: 0, quality: 0 };
  });
  const game = newGame({ role });
  const effects = game.choose("tech_mon_open_g");
  const ending = find(effects, "gameOver")[0].ending;
  assert.equal(ending.id, "lost_trust");
  assert.equal(ending.title, "The Wall");
  assert.ok(ending.description.includes("Software Engineer"));
});

test("burnout takes priority when both meters hit 0", () => {
  const role = tweakedTech((r) => {
    r.nodes.tech_mon_open.choices.find((c) => c.id === "tech_mon_open_p").impact = { trust: -200, bandwidth: -200, quality: 0 };
  });
  const game = newGame({ role });
  assert.equal(find(game.choose("tech_mon_open_p"), "gameOver")[0].ending.id, "burnout");
});

test("quality at or below 30 fires one critical incident and costs trust", () => {
  const role = tweakedTech((r) => {
    r.nodes.tech_mon_open.choices.find((c) => c.id === "tech_mon_open_p").impact = { trust: 0, bandwidth: -5, quality: -45 };
    r.nodes.tech_mon_after_passive.choices.find((c) => c.id === "tech_mon_pas_p").impact = { trust: 0, bandwidth: -5, quality: -10 };
  });
  const game = newGame({ role });
  const first = game.choose("tech_mon_open_p"); // quality 75 - 45 = 30
  const incident = find(first, "criticalIncident");
  assert.equal(incident.length, 1);
  assert.ok(incident[0].text.includes("error rates"));
  assert.equal(game.snapshot().flags.criticalIncident, true);
  assert.equal(game.snapshot().meters.trust, 70 - 10);
  const second = game.choose("tech_mon_pas_p"); // quality drops further: no second incident
  assert.equal(find(second, "criticalIncident").length, 0);
});

test("the critical incident trust penalty scales with difficulty", () => {
  const role = tweakedTech((r) => {
    r.nodes.tech_mon_open.choices.find((c) => c.id === "tech_mon_open_p").impact = { trust: 0, bandwidth: 0, quality: -45 };
  });
  const game = newGame({ role, difficulty: "crunch" }); // quality 65 - 56 = 9
  game.choose("tech_mon_open_p");
  assert.equal(game.snapshot().meters.trust, 60 - 13); // -10 * 1.25 = 12.5 rounds to 13
});

// ---- determinism ---------------------------------------------------------------

test("same seed and same choices produce the same run", () => {
  const run = (seed) => {
    const game = newGame({ seed });
    const trace = [];
    for (let i = 0; i < 40 && !game.current().ended; i++) {
      const view = game.current();
      trace.push(view.cards.map((c) => c.id).join(","));
      const id = view.kind === "triage" ? "triage_hold" : strategyCard(game, view, "assertive");
      game.choose(id);
    }
    return trace.join("|") + JSON.stringify(game.snapshot().meters);
  };
  assert.equal(run(48213), run(48213));
});

test("card order is shuffled and varies by seed", () => {
  const orders = new Set();
  for (let seed = 1; seed <= 12; seed++) {
    orders.add(newGame({ seed }).current().cards.map((c) => c.id).join(","));
  }
  assert.ok(orders.size > 1);
});

test("calling current() repeatedly does not reshuffle", () => {
  const game = newGame({ seed: 5 });
  const a = game.current().cards.map((c) => c.id).join(",");
  const b = game.current().cards.map((c) => c.id).join(",");
  assert.equal(a, b);
});

// ---- full runs -------------------------------------------------------------------

test("an all-assertive run reaches a non-failure ending in a normal number of decisions", () => {
  const { game } = playOut(newGame(), "assertive");
  const snap = game.snapshot();
  assert.ok(snap.ended);
  assert.ok(!["burnout", "lost_trust"].includes(snap.ended), `ended with ${snap.ended}`);
  assert.ok(snap.history.length >= 7 && snap.history.length <= 11, `${snap.history.length} decisions`);
  assert.ok(snap.history.every((h) => h.tag === "assertive"));
  assert.equal(snap.insights.length, 2);
});

test("an all-aggressive run ends in The Wall", () => {
  const { game } = playOut(newGame(), "aggressive");
  assert.equal(game.snapshot().ended, "lost_trust");
});

test("an all-passive run ends in burnout, never Master Negotiator", () => {
  const { game } = playOut(newGame(), "passive");
  assert.notEqual(game.snapshot().ended, "master");
  assert.equal(game.snapshot().ended, "burnout");
});

test("every run ends with exactly one gameOver effect", () => {
  for (const strategy of ["assertive", "passive", "aggressive"]) {
    const { effects } = playOut(newGame(), strategy);
    assert.equal(find(effects, "gameOver").length, 1, strategy);
  }
});

test("the three days play in order", () => {
  const { effects } = playOut(newGame(), "assertive");
  assert.deepEqual(find(effects, "dayTransition").map((e) => `${e.from}>${e.to}`), ["mon>wed", "wed>fri"]);
});

test("the tech role object is not mutated by play", () => {
  const before = JSON.stringify(tech);
  playOut(newGame(), "assertive");
  assert.equal(JSON.stringify(tech), before);
});
