import test from "node:test";
import assert from "node:assert/strict";
import { assertiveShare, evaluateEnding } from "../js/engine/endings.js";

function s({ meters = {}, min = {}, tags = [] } = {}) {
  const m = { trust: 70, bandwidth: 70, quality: 70, ...meters };
  return {
    meters: m,
    minMeters: { ...m, ...min },
    history: tags.map((tag) => ({ tag })),
  };
}
const mostlyAssertive = ["assertive", "assertive", "assertive", "passive", "aggressive"];

test("burnout wins over everything", () => {
  assert.equal(evaluateEnding(s({ min: { bandwidth: 0 }, meters: { trust: 10 }, tags: mostlyAssertive })), "burnout");
});

test("lost_trust: trust reached 0 earlier or final trust below 35", () => {
  assert.equal(evaluateEnding(s({ min: { trust: 0 } })), "lost_trust");
  assert.equal(evaluateEnding(s({ meters: { trust: 34 } })), "lost_trust");
  assert.notEqual(evaluateEnding(s({ meters: { trust: 35 } })), "lost_trust");
});

test("lost_trust is checked before master", () => {
  assert.equal(evaluateEnding(s({ meters: { trust: 34 }, tags: mostlyAssertive })), "lost_trust");
});

test("master needs all meters at 60+ and at least 60% assertive", () => {
  assert.equal(evaluateEnding(s({ tags: mostlyAssertive })), "master");
  assert.notEqual(evaluateEnding(s({ tags: ["assertive", "passive"] })), "master");
  assert.notEqual(evaluateEnding(s({ meters: { quality: 59 }, tags: mostlyAssertive })), "master");
});

test("quiet_fixer: trust 60+ with low bandwidth or quality", () => {
  assert.equal(evaluateEnding(s({ meters: { bandwidth: 39 }, tags: mostlyAssertive })), "quiet_fixer");
  assert.equal(evaluateEnding(s({ meters: { quality: 49 }, tags: mostlyAssertive })), "quiet_fixer");
});

test("steady: all meters 45+ but not master or quiet fixer", () => {
  assert.equal(evaluateEnding(s({ meters: { trust: 50, bandwidth: 50, quality: 50 } })), "steady");
});

test("fumes: anything else", () => {
  assert.equal(evaluateEnding(s({ meters: { trust: 40, bandwidth: 44, quality: 70 } })), "fumes");
});

test("assertiveShare handles empty history", () => {
  assert.equal(assertiveShare([]), 0);
  assert.equal(assertiveShare([{ tag: "assertive" }, { tag: "passive" }]), 0.5);
});
