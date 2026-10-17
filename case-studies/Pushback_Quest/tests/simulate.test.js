import test from "node:test";
import assert from "node:assert/strict";
import tech from "../content/roles/tech.js";
import { ENDING_ORDER } from "../js/engine/endings.js";
import { analyseRole, explore, runPolicy } from "../tools/simulate.mjs";
import { clone } from "./helpers.js";

test("policies reach the endings the PRD expects on Standard", () => {
  for (let seed = 1; seed <= 20; seed++) {
    assert.equal(runPolicy(tech, "standard", seed, "assertive").ended, "master", `seed ${seed}`);
    assert.equal(runPolicy(tech, "standard", seed, "aggressive").ended, "lost_trust", `seed ${seed}`);
    assert.notEqual(runPolicy(tech, "standard", seed, "passive").ended, "master", `seed ${seed}`);
  }
});

test("exploration enumerates every path and visits every node", () => {
  const stats = explore(tech, "standard", 1);
  assert.ok(stats.paths > 1000);
  assert.equal(stats.paths, Object.values(stats.endings).reduce((a, b) => a + b, 0));
  for (const id of ENDING_ORDER) assert.ok(stats.endings[id] > 0, `${id} should be reachable`);
  assert.deepEqual(Object.keys(tech.nodes).filter((id) => !stats.visited.has(id)), []);
  assert.ok(stats.insightPaths > 0);
  assert.ok(stats.min.bandwidth === 0 && stats.max.trust === 100);
});

test("the balance analysis passes for Technology and fails when balance breaks", () => {
  const seeds = [1];
  const policySeeds = Array.from({ length: 10 }, (_, i) => i + 1);
  assert.deepEqual(analyseRole(tech, { seeds, policySeeds }).failures, []);

  // Make every assertive card drain 20 bandwidth: Master Negotiator is no longer reachable.
  const broken = clone(tech);
  for (const node of Object.values(broken.nodes)) {
    for (const c of node.choices) if (c.tag === "assertive") c.impact.bandwidth = -20;
  }
  const { failures } = analyseRole(broken, { seeds, policySeeds });
  assert.ok(failures.some((f) => f.includes("Master Negotiator")), failures.join("\n"));
});
