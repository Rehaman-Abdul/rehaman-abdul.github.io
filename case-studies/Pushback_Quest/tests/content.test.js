// Structural checks for the Technology role content. Phase 4 replaces this
// with the full content linter (tools/lint-content.mjs).
import test from "node:test";
import assert from "node:assert/strict";
import tech from "../content/roles/tech.js";
import config from "../content/config.js";
import events from "../content/events.js";
import endings from "../content/endings.js";
import { ENDING_ORDER } from "../js/engine/endings.js";
import { CONDITION_KEYS } from "../js/engine/conditions.js";
import { KNOWN_TOKENS, tokensIn } from "../js/engine/text.js";
import { ROLE_IDS } from "../content/roles/index.js";

const SPECIAL = new Set(["$endBeat", "$return"]);
// Case-sensitive on purpose: "slack" and "teams" are ordinary English words.
const BANNED = ["Microsoft", "Teams", "Slack", "Zoom", "Google", "Salesforce", "Jira"];
const nodes = Object.values(tech.nodes);
const allChoices = nodes.flatMap((n) => n.choices.map((c) => ({ node: n, choice: c })));

function textsOf(node) {
  const texts = [];
  for (const m of node.messages) {
    texts.push({ kind: m.from === "system" ? "system" : "message", text: m.text });
    for (const v of m.variants || []) texts.push({ kind: "message", text: v.text });
  }
  for (const c of node.choices) {
    texts.push({ kind: "card", text: c.text });
    texts.push({ kind: "coaching", text: c.coaching });
    if (c.betterResponse) texts.push({ kind: "card", text: c.betterResponse });
  }
  return texts;
}

test("role has every required top-level field", () => {
  for (const key of ["id", "title", "qualityMeaning", "teaser", "stakeholders", "insights", "beats", "criticalIncident", "tips", "nodes"]) {
    assert.ok(tech[key], `missing ${key}`);
  }
  for (const tag of ["passive", "aggressive", "assertive"]) assert.ok(tech.tips[tag], `missing tip ${tag}`);
  for (const outcome of ["passive", "assertive", "aggressive"]) assert.ok(tech.beats.wed.mondayFollowUp[outcome]);
  assert.ok(ROLE_IDS.includes(tech.id));
});

test("node ids match their keys and every node has the required fields", () => {
  for (const [key, node] of Object.entries(tech.nodes)) {
    assert.equal(node.id, key);
    for (const field of ["type", "day", "time", "chat", "messages", "choices"]) assert.ok(node[field], `${key} missing ${field}`);
    assert.ok(tech.stakeholders[node.chat], `${key}: unknown chat ${node.chat}`);
    if (node.joins) assert.ok(tech.stakeholders[node.joins], `${key}: unknown joins`);
    for (const m of node.messages) assert.ok(m.from === "system" || tech.stakeholders[m.from], `${key}: unknown sender ${m.from}`);
  }
});

test("every next points at a real node or a special value", () => {
  for (const { node, choice } of allChoices) {
    assert.ok(SPECIAL.has(choice.next) || tech.nodes[choice.next], `${choice.id} -> ${choice.next}`);
    assert.ok(node.id);
  }
});

test("choice ids are unique", () => {
  const seen = new Set();
  for (const { choice } of allChoices) {
    assert.ok(!seen.has(choice.id), `duplicate ${choice.id}`);
    seen.add(choice.id);
  }
});

test("$return is used only by Monday follow-up nodes", () => {
  const followUps = new Set(Object.values(tech.beats.wed.mondayFollowUp));
  for (const { node, choice } of allChoices) {
    if (choice.next === "$return") assert.ok(followUps.has(node.id), `${node.id} uses $return`);
    if (followUps.has(node.id)) assert.equal(choice.next, "$return", `${choice.id} must $return`);
  }
});

test("every node is reachable from a beat start, escalation or follow-up", () => {
  const roots = [];
  for (const beat of Object.values(tech.beats)) {
    roots.push(beat.start, beat.escalation);
    if (beat.mondayFollowUp) roots.push(...Object.values(beat.mondayFollowUp));
  }
  const reached = new Set();
  const queue = roots.filter(Boolean);
  while (queue.length) {
    const id = queue.pop();
    if (reached.has(id)) continue;
    assert.ok(tech.nodes[id], `missing ${id}`);
    reached.add(id);
    for (const c of tech.nodes[id].choices) if (!SPECIAL.has(c.next)) queue.push(c.next);
  }
  assert.deepEqual(Object.keys(tech.nodes).filter((id) => !reached.has(id)), []);
});

test("each node has exactly one passive, aggressive and assertive base card", () => {
  for (const node of nodes) {
    const base = node.choices.filter((c) => !c.requiresInsight);
    assert.equal(base.length, 3, node.id);
    assert.deepEqual(base.map((c) => c.tag).sort(), ["aggressive", "assertive", "passive"], node.id);
    assert.ok(node.choices.length - base.length <= 2, `${node.id}: more than two insight cards`);
  }
});

test("cards carry coaching; passive and aggressive cards carry a better response", () => {
  for (const { choice } of allChoices) {
    assert.ok(choice.coaching, `${choice.id} lacks coaching`);
    assert.ok(choice.impact, `${choice.id} lacks impact`);
    if (choice.tag !== "assertive") assert.ok(choice.betterResponse, `${choice.id} lacks betterResponse`);
  }
});

test("insight cards are assertive, subtype insight, with the strongest impact", () => {
  const insightCards = allChoices.filter(({ choice }) => choice.requiresInsight);
  assert.equal(insightCards.length, 2);
  for (const { choice } of insightCards) {
    assert.equal(choice.tag, "assertive");
    assert.equal(choice.subtype, "insight");
    assert.ok(choice.impact.trust >= 12 && choice.impact.trust <= 18);
    assert.equal(choice.impact.bandwidth, -5);
    assert.ok(choice.impact.quality >= 12 && choice.impact.quality <= 18);
  }
});

test("each insight is granted by a card and used on Friday", () => {
  for (const id of Object.keys(tech.insights)) {
    assert.ok(allChoices.some(({ choice }) => choice.grantsInsight === id), `${id} never granted`);
    assert.ok(
      allChoices.some(({ node, choice }) => choice.requiresInsight === id && node.id === tech.beats.fri.start),
      `${id} never used on Friday`,
    );
    assert.ok(tech.insights[id].title.length < 40);
  }
  // Both opening Monday and Wednesday nodes grant an insight through a clarify card
  for (const start of [tech.beats.mon.start, tech.beats.wed.start]) {
    assert.ok(tech.nodes[start].choices.some((c) => c.subtype === "clarify" && c.grantsInsight), start);
  }
});

test("text stays within the PRD length limits, tokens are known, no real brands", () => {
  for (const node of nodes) {
    for (const { kind, text } of textsOf(node)) {
      const limit = { message: 320, card: 220, coaching: 200, system: 120 }[kind];
      assert.ok(text.length <= limit, `${node.id} ${kind} is ${text.length} chars: ${text}`);
      for (const token of tokensIn(text)) assert.ok(KNOWN_TOKENS.includes(token), `${node.id}: unknown token {${token}}`);
      for (const banned of BANNED) assert.ok(!new RegExp(`\\b${banned}\\b`).test(text), `${node.id} mentions ${banned}`);
    }
  }
  for (const tip of Object.values(tech.tips)) assert.ok(tip.length > 0);
});

test("emoji appear at most once per stakeholder message and never in cards or system lines", () => {
  const emoji = /\p{Extended_Pictographic}/gu;
  for (const node of nodes) {
    for (const { kind, text } of textsOf(node)) {
      const count = (text.match(emoji) || []).length;
      assert.ok(count <= (kind === "message" ? 1 : 0), `${node.id} ${kind}: ${text}`);
    }
  }
});

test("Wednesday and Friday openers have a state-reactive variant", () => {
  for (const day of ["wed", "fri"]) {
    const opener = tech.nodes[tech.beats[day].start];
    assert.ok(opener.messages.some((m) => m.variants && m.variants.length), `${day} opener lacks a variant`);
  }
});

test("variant conditions only use supported keys", () => {
  for (const node of nodes) {
    for (const m of node.messages) {
      for (const v of m.variants || []) {
        for (const key of Object.keys(v.when)) assert.ok(CONDITION_KEYS.includes(key), `${node.id}: ${key}`);
      }
    }
  }
});

test("every escalation node introduces a manager who is not the main stakeholder", () => {
  for (const beat of Object.values(tech.beats)) {
    const node = tech.nodes[beat.escalation];
    assert.ok(node.joins);
    assert.notEqual(node.joins, node.chat);
  }
});

// ---- shared content --------------------------------------------------------------------

test("event pool matches the PRD table and respects the impact cap", () => {
  assert.equal(events.length, 12);
  for (const event of events) {
    for (const value of Object.values(event.impact)) assert.ok(Math.abs(value) <= config.thresholds.eventImpactCap, event.id);
    assert.equal(event.polarity === "negative", Object.values(event.impact).some((v) => v < 0), event.id);
    if (event.when) for (const key of Object.keys(event.when)) assert.ok(CONDITION_KEYS.includes(key), `${event.id}: ${key}`);
  }
  assert.equal(events.find((e) => e.id === "rested").weight, 0);
});

test("every ending has a title, description and lesson", () => {
  assert.deepEqual(Object.keys(endings).sort(), [...ENDING_ORDER].sort());
  for (const ending of Object.values(endings)) {
    assert.ok(ending.title && ending.description && ending.lesson);
    assert.ok(ending.description.includes("{role}"));
    assert.equal(ending.description.split(/(?<=\.)\s/).length, 2, "two sentences");
  }
});
