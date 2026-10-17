import test from "node:test";
import assert from "node:assert/strict";
import { resolveText, sanitizeName, tokensIn } from "../js/engine/text.js";

test("{name} is replaced with the player's name", () => {
  assert.equal(resolveText("Hi {name}!", { name: "Sam" }), "Hi Sam!");
});

test("{name|fallback} uses the fallback when there is no name", () => {
  assert.equal(resolveText("Hey {name|there}", { name: "" }), "Hey there");
  assert.equal(resolveText("Hey {name|there}", {}), "Hey there");
  assert.equal(resolveText("Hey {name|there}", { name: "Sam" }), "Hey Sam");
});

test("{name} without fallback collapses cleanly when blank", () => {
  assert.equal(resolveText("Thanks {name}, see you.", { name: "" }), "Thanks, see you.");
});

test("{role} and context tokens resolve", () => {
  assert.equal(resolveText("As a {role}", { role: "Software Engineer" }), "As a Software Engineer");
  assert.equal(resolveText("{mon} and {wed}", { mon: "Priya", wed: "Marcus" }), "Priya and Marcus");
});

test("unknown tokens are left untouched", () => {
  assert.equal(resolveText("Hello {bogus}", {}), "Hello {bogus}");
});

test("sanitizeName keeps letters, spaces, hyphens and apostrophes", () => {
  assert.equal(sanitizeName("  Mary-Jane O'Neil  "), "Mary-Jane O'Neil");
  assert.equal(sanitizeName("Zoë"), "Zoë");
  assert.equal(sanitizeName("José   María"), "José María");
});

test("sanitizeName strips markup and symbols", () => {
  assert.equal(sanitizeName("<b>Sam</b>"), "bSamb");
  assert.equal(sanitizeName("Sam123!@#"), "Sam");
  assert.equal(sanitizeName("<script>"), "script");
});

test("sanitizeName limits length to 24 characters", () => {
  assert.equal(sanitizeName("A".repeat(40)).length, 24);
});

test("sanitizeName rejects names with no letters", () => {
  assert.equal(sanitizeName("---"), "");
  assert.equal(sanitizeName("123"), "");
  assert.equal(sanitizeName(undefined), "");
});

test("tokensIn lists token names", () => {
  assert.deepEqual(tokensIn("Hi {name|there}, {role} {x}"), ["name", "role", "x"]);
});
