// Path simulator and balance report (PRD section 12.3).
// Usage: node tools/simulate.mjs [--seeds 5] [--policy-seeds 30] [--roles tech] [--verbose]
//
// For each role and difficulty it enumerates every choice path (depth-first)
// across a set of seeds, then runs three fixed policies (best assertive, always
// passive, always aggressive) across many seeds. Standard-week balance targets
// are checked and the process exits with code 1 if any fails.
import { fileURLToPath } from "node:url";
import config from "../content/config.js";
import { ROLE_IDS } from "../content/roles/index.js";
import { ENDING_ORDER } from "../js/engine/endings.js";
import { createGame } from "../js/engine/game.js";
import { loadAvailableRoles } from "./lint-content.mjs";

const METERS = config.meterKeys;
const DIFFICULTIES = Object.keys(config.difficulties);

// ---- policies ---------------------------------------------------------------------

function tagOf(role, view, cardId) {
  if (cardId.startsWith("triage_")) return "assertive";
  return role.nodes[view.nodeId].choices.find((c) => c.id === cardId).tag;
}

// Best assertive: insight cards first, the holding message at triage, then the assertive card.
export function pickPolicy(role, view, policy) {
  if (view.kind === "triage") return policy === "assertive" ? "triage_hold" : "triage_wed";
  if (policy === "assertive") {
    const insight = view.cards.find((c) => c.usesInsight);
    if (insight) return insight.id;
  }
  return view.cards.find((c) => tagOf(role, view, c.id) === policy).id;
}

export function runPolicy(role, difficulty, seed, policy) {
  const game = createGame({ role, difficulty, seed });
  for (let i = 0; i < 80 && !game.current().ended; i++) game.choose(pickPolicy(role, game.current(), policy));
  return game.snapshot();
}

// ---- exhaustive exploration ---------------------------------------------------------

export function explore(role, difficulty, seed) {
  const stats = {
    paths: 0,
    endings: Object.fromEntries(ENDING_ORDER.map((id) => [id, 0])),
    visited: new Set(),
    min: { trust: 100, bandwidth: 100, quality: 100 },
    max: { trust: 0, bandwidth: 0, quality: 0 },
    decisions: [],
    completedDecisions: [],
    insightPaths: 0,
    insightCardsOffered: 0,
    insightCardsUsed: 0,
  };

  const walk = (prefix) => {
    const game = createGame({ role, difficulty, seed });
    for (const id of prefix) {
      game.choose(id);
      const m = game.snapshot().meters;
      for (const key of METERS) {
        stats.min[key] = Math.min(stats.min[key], m[key]);
        stats.max[key] = Math.max(stats.max[key], m[key]);
      }
    }
    const view = game.current();
    if (view.ended) {
      const snap = game.snapshot();
      stats.paths += 1;
      stats.endings[snap.ended] += 1;
      stats.decisions.push(snap.history.length);
      if (snap.completed) stats.completedDecisions.push(snap.history.length);
      if (snap.history.some((h) => h.usedInsight)) stats.insightPaths += 1;
      return;
    }
    stats.visited.add(view.nodeId);
    for (const card of view.cards) if (card.usesInsight) stats.insightCardsOffered += 1;
    for (const card of view.cards) {
      if (card.usesInsight) stats.insightCardsUsed += 1;
      walk([...prefix, card.id]);
    }
  };
  walk([]);
  return stats;
}

function mergeStats(list) {
  const out = {
    paths: 0,
    endings: Object.fromEntries(ENDING_ORDER.map((id) => [id, 0])),
    visited: new Set(),
    min: { trust: 100, bandwidth: 100, quality: 100 },
    max: { trust: 0, bandwidth: 0, quality: 0 },
    decisions: [],
    completedDecisions: [],
    insightPaths: 0,
    insightCardsOffered: 0,
  };
  for (const s of list) {
    out.paths += s.paths;
    for (const id of ENDING_ORDER) out.endings[id] += s.endings[id];
    for (const v of s.visited) out.visited.add(v);
    for (const key of METERS) {
      out.min[key] = Math.min(out.min[key], s.min[key]);
      out.max[key] = Math.max(out.max[key], s.max[key]);
    }
    for (const n of s.decisions) out.decisions.push(n);
    for (const n of s.completedDecisions) out.completedDecisions.push(n);
    out.insightPaths += s.insightPaths;
    out.insightCardsOffered += s.insightCardsOffered;
  }
  return out;
}

const maxOf = (xs) => xs.reduce((a, b) => (b > a ? b : a), 0);
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);

// ---- analysis -------------------------------------------------------------------------

// seeds: array of numbers. Returns { report, failures } for one role.
export function analyseRole(role, { seeds, policySeeds }) {
  const failures = [];
  const byDifficulty = {};
  const allNodeIds = Object.keys(role.nodes);

  for (const difficulty of DIFFICULTIES) {
    const stats = mergeStats(seeds.map((seed) => explore(role, difficulty, seed)));
    const policies = {};
    for (const policy of ["assertive", "passive", "aggressive"]) {
      const tally = {};
      let decisions = 0;
      for (const seed of policySeeds) {
        const snap = runPolicy(role, difficulty, seed, policy);
        tally[snap.ended] = (tally[snap.ended] || 0) + 1;
        decisions += snap.history.length;
      }
      policies[policy] = { tally, avgDecisions: decisions / policySeeds.length };
    }
    const unreachableEndings = ENDING_ORDER.filter((id) => stats.endings[id] === 0);
    const unreachableNodes = allNodeIds.filter((id) => !stats.visited.has(id));
    byDifficulty[difficulty] = { stats, policies, unreachableEndings, unreachableNodes };
  }

  // Balance targets (Standard week)
  const std = byDifficulty.standard;
  const fail = (message) => failures.push(`${role.id}: ${message}`);
  if (std.unreachableEndings.length) fail(`endings never reached on Standard: ${std.unreachableEndings.join(", ")}`);
  if (std.unreachableNodes.length) fail(`nodes never visited: ${std.unreachableNodes.join(", ")}`);
  for (const difficulty of DIFFICULTIES) {
    if (byDifficulty[difficulty].unreachableNodes.length && difficulty !== "standard") {
      fail(`nodes never visited on ${difficulty}: ${byDifficulty[difficulty].unreachableNodes.join(", ")}`);
    }
  }
  const total = policySeeds.length;
  const masterShare = pct(std.policies.assertive.tally.master || 0, total);
  if (masterShare < 90) fail(`best assertive path reached Master Negotiator in ${masterShare}% of seeds (needs 90%)`);
  if (std.policies.passive.tally.master) fail("always-passive reached Master Negotiator");
  for (const ending of Object.keys(std.policies.passive.tally)) {
    if (!["burnout", "quiet_fixer", "fumes"].includes(ending)) fail(`always-passive ended with ${ending} (allowed: burnout, quiet_fixer, fumes)`);
  }
  for (const ending of Object.keys(std.policies.aggressive.tally)) {
    if (ending !== "lost_trust") fail(`always-aggressive ended with ${ending} (needs The Wall)`);
  }
  const typical = avg(std.stats.completedDecisions);
  if (typical < 7 || typical > 11) fail(`typical completed run has ${typical.toFixed(1)} decisions (needs 7 to 11)`);
  const bestDecisions = std.policies.assertive.avgDecisions;
  if (bestDecisions < 7 || bestDecisions > 11) fail(`best path has ${bestDecisions.toFixed(1)} decisions (needs 7 to 11)`);

  // Insight cards must be reachable and used
  if (std.stats.insightPaths === 0) fail("no path ever uses an insight card");

  return { byDifficulty, failures };
}

function formatReport(role, { byDifficulty }, seedCount, policyCount) {
  const lines = [`\n== ${role.title} (${role.id}) · ${seedCount} seeds exhaustive, ${policyCount} seeds per policy ==`];
  for (const difficulty of DIFFICULTIES) {
    const { stats, policies, unreachableEndings, unreachableNodes } = byDifficulty[difficulty];
    lines.push(`\n  ${config.difficulties[difficulty].label} (${difficulty})`);
    lines.push(`    paths ${stats.paths}; decisions avg ${avg(stats.decisions).toFixed(1)}, completed-week avg ${avg(stats.completedDecisions).toFixed(1)}, max ${maxOf(stats.decisions)}`);
    lines.push(`    endings: ${ENDING_ORDER.map((id) => `${id} ${pct(stats.endings[id], stats.paths)}%`).join(", ")}`);
    lines.push(`    unreachable endings: ${unreachableEndings.length ? unreachableEndings.join(", ") : "none"}; unreachable nodes: ${unreachableNodes.length ? unreachableNodes.join(", ") : "none"}`);
    lines.push(`    meter range: ${METERS.map((m) => `${m} ${stats.min[m]}-${stats.max[m]}`).join(", ")}`);
    lines.push(`    insight cards: used on ${pct(stats.insightPaths, stats.paths)}% of paths`);
    for (const policy of ["assertive", "passive", "aggressive"]) {
      const { tally, avgDecisions } = policies[policy];
      lines.push(`    always ${policy}: ${Object.entries(tally).map(([k, v]) => `${k} ${pct(v, policyCount)}%`).join(", ")} (${avgDecisions.toFixed(1)} decisions)`);
    }
  }
  return lines.join("\n");
}

// ---- CLI --------------------------------------------------------------------------------

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}

async function main() {
  const seedCount = Number(arg("seeds", 5));
  const policyCount = Number(arg("policy-seeds", 30));
  const ids = arg("roles", ROLE_IDS.join(",")).split(",");
  const seeds = Array.from({ length: seedCount }, (_, i) => i + 1);
  const policySeeds = Array.from({ length: policyCount }, (_, i) => i + 1);
  const roles = await loadAvailableRoles(ids);

  const started = Date.now();
  const failures = [];
  for (const role of roles) {
    const result = analyseRole(role, { seeds, policySeeds });
    console.log(formatReport(role, result, seedCount, policyCount));
    failures.push(...result.failures);
  }
  const missing = ids.filter((id) => !roles.some((r) => r.id === id));
  if (missing.length) console.log(`\nSkipped (no content file yet): ${missing.join(", ")}`);
  console.log(`\nSimulated ${roles.length} role(s) in ${((Date.now() - started) / 1000).toFixed(1)}s`);

  if (failures.length) {
    console.error(`\nBalance targets failed:\n${failures.map((f) => `  ✖ ${f}`).join("\n")}`);
    process.exit(1);
  }
  console.log("All balance targets passed");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
