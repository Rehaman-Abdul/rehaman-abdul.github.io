// Content and schema linter (PRD section 12.2).
// Usage: node tools/lint-content.mjs [--roles tech,finance]
// Exits with code 1 if any error is found.
import { fileURLToPath } from "node:url";
import achievements from "../content/achievements.js";
import config from "../content/config.js";
import endings from "../content/endings.js";
import events, { delayed } from "../content/events.js";
import { ROLE_IDS } from "../content/roles/index.js";
import { ENDING_ORDER } from "../js/engine/endings.js";
import { CONDITION_KEYS } from "../js/engine/conditions.js";
import { KNOWN_TOKENS, tokensIn } from "../js/engine/text.js";

const SPECIAL_NEXT = new Set(["$endBeat", "$return"]);
const TAGS = ["passive", "aggressive", "assertive"];
const SUBTYPES = ["clarify", "tradeoff", "impact", "boundary", "insight", "holding", "repair"];
const METERS = config.meterKeys;
// Case-sensitive on purpose: "slack" and "teams" are ordinary words.
export const BANNED_TERMS = [
  "Microsoft", "Teams", "Slack", "Zoom", "Google", "Salesforce", "Jira", "Asana", "Trello", "Workday",
  "Zendesk", "ServiceNow", "HubSpot", "Outlook", "SharePoint", "Gmail", "Amazon", "LinkedIn", "Twitter",
  "Facebook", "GitHub", "Confluence", "Okta", "QuickBooks", "Oracle",
];
const EMOJI = /\p{Extended_Pictographic}/gu;

export function lintRole(role) {
  const errors = [];
  const err = (where, message) => errors.push(`${role.id || "?"}: ${where}: ${message}`);
  const nodes = role.nodes || {};

  // ---- role-level fields ---------------------------------------------------------
  for (const field of ["id", "title", "qualityMeaning", "teaser", "stakeholders", "insights", "beats", "criticalIncident", "tips", "nodes"]) {
    if (!role[field]) err("role", `missing ${field}`);
  }
  if (!role.id || !role.stakeholders || !role.beats || !role.nodes || !role.insights) return errors;
  if (!ROLE_IDS.includes(role.id)) err("role", `unknown role id ${role.id}`);
  for (const tag of TAGS) if (!role.tips?.[tag]) err("tips", `missing tip for ${tag}`);
  if (!role.criticalIncident?.text) err("criticalIncident", "missing text");
  const people = Object.keys(role.stakeholders);
  if (people.length < 3) err("stakeholders", "needs at least three stakeholders");
  for (const [id, p] of Object.entries(role.stakeholders)) {
    if (!p.name || !p.title || !["available", "busy", "away"].includes(p.presence)) err(`stakeholder ${id}`, "needs name, title and presence (available, busy, away)");
  }

  const text = (where, value, limit, kind) => {
    if (typeof value !== "string" || !value.trim()) return err(where, "missing text");
    if (value.length > limit) err(where, `${kind} is ${value.length} characters, limit ${limit}`);
    for (const token of tokensIn(value)) if (!KNOWN_TOKENS.includes(token)) err(where, `unknown token {${token}}`);
    for (const term of BANNED_TERMS) if (new RegExp(`\\b${term}\\b`).test(value)) err(where, `mentions real brand "${term}"`);
    const emoji = (value.match(EMOJI) || []).length;
    if (emoji > (kind === "message" ? 1 : 0)) err(where, kind === "message" ? "more than one emoji" : `emoji not allowed in a ${kind}`);
  };

  // ---- beats --------------------------------------------------------------------
  const roots = [];
  for (const day of ["mon", "wed", "fri"]) {
    const beat = role.beats[day];
    if (!beat) {
      err("beats", `missing ${day}`);
      continue;
    }
    for (const key of ["start", "escalation"]) {
      if (!beat[key]) err(`beats.${day}`, `missing ${key}`);
      else if (!nodes[beat[key]]) err(`beats.${day}.${key}`, `node ${beat[key]} does not exist`);
      else roots.push(beat[key]);
    }
  }
  const followUps = new Set();
  const followUpMap = role.beats.wed?.mondayFollowUp;
  for (const outcome of TAGS) {
    const id = followUpMap?.[outcome];
    if (!id) err("beats.wed.mondayFollowUp", `missing ${outcome}`);
    else if (!nodes[id]) err("beats.wed.mondayFollowUp", `node ${id} does not exist`);
    else {
      followUps.add(id);
      roots.push(id);
    }
  }

  // ---- nodes and choices -----------------------------------------------------------
  const choiceIds = new Set();
  const granted = new Set();
  const used = new Set();
  for (const [key, node] of Object.entries(nodes)) {
    const at = `node ${key}`;
    if (node.id !== key) err(at, `id "${node.id}" does not match its key`);
    for (const field of ["type", "day", "time", "chat", "messages", "choices"]) if (!node[field]) err(at, `missing ${field}`);
    if (!node.chat || !Array.isArray(node.messages) || !Array.isArray(node.choices)) continue;
    if (!role.stakeholders[node.chat]) err(at, `unknown chat ${node.chat}`);
    if (node.joins && !role.stakeholders[node.joins]) err(at, `unknown joins ${node.joins}`);
    if (node.messages.length === 0) err(at, "needs at least one message");

    node.messages.forEach((m, i) => {
      const system = m.from === "system";
      if (!system && !role.stakeholders[m.from]) err(`${at} message ${i + 1}`, `unknown sender ${m.from}`);
      text(`${at} message ${i + 1}`, m.text, system ? config.limits.system : config.limits.message, system ? "system line" : "message");
      (m.variants || []).forEach((v, j) => {
        text(`${at} message ${i + 1} variant ${j + 1}`, v.text, system ? config.limits.system : config.limits.message, system ? "system line" : "message");
        for (const k of Object.keys(v.when || {})) if (!CONDITION_KEYS.includes(k)) err(`${at} message ${i + 1} variant ${j + 1}`, `unknown condition ${k}`);
      });
    });

    const base = node.choices.filter((c) => !c.requiresInsight);
    const insightCards = node.choices.filter((c) => c.requiresInsight);
    for (const tag of TAGS) {
      const n = base.filter((c) => c.tag === tag).length;
      if (n !== 1) err(at, `needs exactly one ${tag} card (found ${n})`);
    }
    if (insightCards.length > 2) err(at, "more than two insight cards");

    for (const c of node.choices) {
      const where = `choice ${c.id || "?"} in ${key}`;
      if (!c.id) err(where, "missing id");
      else if (choiceIds.has(c.id)) err(where, "duplicate id");
      else choiceIds.add(c.id);
      if (!TAGS.includes(c.tag)) err(where, `invalid tag ${c.tag}`);
      if (c.subtype && !SUBTYPES.includes(c.subtype)) err(where, `invalid subtype ${c.subtype}`);
      text(where, c.text, config.limits.card, "card");
      if (!c.coaching) err(where, "missing coaching");
      else text(`${where} coaching`, c.coaching, config.limits.coaching, "coaching");
      if (c.tag !== "assertive") {
        if (!c.betterResponse) err(where, "passive and aggressive cards need betterResponse");
        else text(`${where} betterResponse`, c.betterResponse, config.limits.card, "card");
      }
      if (!c.next) err(where, "missing next");
      else if (!SPECIAL_NEXT.has(c.next) && !nodes[c.next]) err(where, `next points to missing node ${c.next}`);
      if (c.next === "$return" && !followUps.has(key)) err(where, "$return is only for Monday follow-up nodes");
      if (followUps.has(key) && c.next !== "$return") err(where, "Monday follow-up cards must use $return");

      // Impact and ranges
      if (!c.impact || METERS.some((m) => typeof c.impact[m] !== "number")) err(where, "impact needs numeric trust, bandwidth and quality");
      else {
        const rangeKey = c.requiresInsight ? "insight" : c.tag;
        const ranges = config.impactRanges[rangeKey];
        if (ranges) for (const m of METERS) if (c.impact[m] < ranges[m][0] || c.impact[m] > ranges[m][1]) err(where, `${m} ${c.impact[m]} is outside ${rangeKey} range ${ranges[m][0]} to ${ranges[m][1]}`);
      }

      if (c.grantsInsight) {
        if (!role.insights[c.grantsInsight]) err(where, `grantsInsight ${c.grantsInsight} is not defined`);
        else granted.add(c.grantsInsight);
      }
      if (c.requiresInsight) {
        if (!role.insights[c.requiresInsight]) err(where, `requiresInsight ${c.requiresInsight} is not defined`);
        if (c.tag !== "assertive" || c.subtype !== "insight") err(where, "insight cards must be assertive with subtype insight");
        if (key === role.beats.fri?.start) used.add(c.requiresInsight);
        else err(where, "insight cards belong on Friday's opening node");
      }
    }

    // Boundary nodes: firm assertive refusal, compromise card is passive and costly
    if (node.boundary) {
      if (!base.some((c) => c.tag === "assertive" && c.subtype === "boundary")) err(at, "boundary node needs an assertive card with subtype boundary");
      const passive = base.find((c) => c.tag === "passive");
      if (passive && passive.impact && passive.impact.quality > -15) err(at, "boundary node's compromise card needs quality -15 to -20");
      if (passive && passive.impact && passive.impact.quality < -20) err(at, "boundary node's compromise card needs quality -15 to -20");
    }
  }

  // Escalation nodes bring in a manager
  for (const day of ["mon", "wed", "fri"]) {
    const node = nodes[role.beats[day]?.escalation];
    if (node && (!node.joins || node.joins === node.chat)) err(`node ${node.id}`, "escalation node must add a different person via joins");
  }

  // Opening nodes: an assertive clarify card (or, on a boundary node, the boundary
  // refusal that also asks the clarifying question) that earns an insight
  for (const day of ["mon", "wed"]) {
    const node = nodes[role.beats[day]?.start];
    if (node && !node.choices.some((c) => c.tag === "assertive" && ["clarify", "boundary"].includes(c.subtype) && c.grantsInsight)) {
      err(`node ${node.id}`, "opening node needs an assertive clarify (or boundary) card that grants an insight");
    }
  }
  for (const day of ["wed", "fri"]) {
    const node = nodes[role.beats[day]?.start];
    if (node && !node.messages.some((m) => m.variants && m.variants.length)) err(`node ${node.id}`, "opening message needs a state-reactive variant");
  }

  // Insights
  const insightIds = Object.keys(role.insights);
  if (insightIds.length !== 2) err("insights", `expected two insights, found ${insightIds.length}`);
  for (const id of insightIds) {
    const insight = role.insights[id];
    text(`insight ${id} title`, insight.title, config.limits.insightTitle - 1, "title");
    text(`insight ${id} note`, insight.note, config.limits.coaching, "coaching");
    if (!granted.has(id)) err(`insight ${id}`, "is never granted");
    if (!used.has(id)) err(`insight ${id}`, "is never used on Friday");
  }
  text("teaser", role.teaser, 120, "teaser");
  if (role.qualityMeaning) text("qualityMeaning", role.qualityMeaning, 80, "qualityMeaning");
  if (role.criticalIncident?.text) text("criticalIncident", role.criticalIncident.text, config.limits.message, "message");
  for (const tag of TAGS) if (role.tips?.[tag]) text(`tip ${tag}`, role.tips[tag], config.limits.coaching, "coaching");

  // Reachability
  const reached = new Set();
  const queue = [...roots];
  while (queue.length) {
    const id = queue.pop();
    if (reached.has(id) || !nodes[id]) continue;
    reached.add(id);
    for (const c of nodes[id].choices || []) if (c.next && !SPECIAL_NEXT.has(c.next)) queue.push(c.next);
  }
  for (const id of Object.keys(nodes)) if (!reached.has(id)) err(`node ${id}`, "is unreachable from its beat start");

  return errors;
}

export function lintShared() {
  const errors = [];
  const err = (where, message) => errors.push(`shared: ${where}: ${message}`);
  for (const id of ENDING_ORDER) {
    const e = endings[id];
    if (!e || !e.title || !e.description || !e.lesson) err(`ending ${id}`, "needs title, description and lesson");
    else if (!e.description.includes("{role}")) err(`ending ${id}`, "description should mention {role}");
  }
  for (const a of achievements) if (!a.id || !a.title || !a.description) err("achievements", `${a.id || "?"} needs id, title and description`);
  const cap = config.thresholds.eventImpactCap;
  for (const e of events) {
    if (!e.id || !e.text || !e.title) err(`event ${e.id}`, "needs id, title and text");
    for (const [m, v] of Object.entries(e.impact)) if (Math.abs(v) > cap) err(`event ${e.id}`, `${m} impact ${v} exceeds cap ${cap}`);
    for (const k of Object.keys(e.when || {})) if (!CONDITION_KEYS.includes(k)) err(`event ${e.id}`, `unknown condition ${k}`);
    if (e.text.length > config.limits.system + 60) err(`event ${e.id}`, "text is too long for a day card");
    if ((e.polarity === "negative") !== Object.values(e.impact).some((v) => v < 0)) err(`event ${e.id}`, "polarity does not match impact");
  }
  for (const d of delayed) if (!d.id || !d.text) err(`delayed ${d.id}`, "needs id and text");
  return errors;
}

// Role files that exist on disk (roles not written yet are skipped).
export async function loadAvailableRoles(ids = ROLE_IDS) {
  const roles = [];
  for (const id of ids) {
    try {
      roles.push((await import(`../content/roles/${id}.js`)).default);
    } catch (error) {
      if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
    }
  }
  return roles;
}

async function main() {
  const flag = process.argv.indexOf("--roles");
  const ids = flag > -1 ? process.argv[flag + 1].split(",") : ROLE_IDS;
  const roles = await loadAvailableRoles(ids);
  const errors = [...lintShared()];
  for (const role of roles) errors.push(...lintRole(role));
  const missing = ids.filter((id) => !roles.some((r) => r.id === id));
  if (missing.length) console.log(`Skipped (no content file yet): ${missing.join(", ")}`);
  if (errors.length) {
    console.error(errors.map((e) => `  ✖ ${e}`).join("\n"));
    console.error(`\n${errors.length} content error${errors.length === 1 ? "" : "s"}`);
    process.exit(1);
  }
  console.log(`Content OK: ${roles.length} role${roles.length === 1 ? "" : "s"} (${roles.map((r) => r.id).join(", ")}), shared content`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
