// Guards the WCAG AA contrast of the design tokens in both themes.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../css/tokens.css", import.meta.url), "utf8");

function block(startMarker) {
  const start = css.indexOf(startMarker);
  assert.ok(start >= 0, `missing ${startMarker}`);
  return css.slice(start, css.indexOf("}", start));
}

function parseTokens(text) {
  const out = {};
  for (const [, key, value] of text.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) out[key] = value;
  return out;
}

const light = parseTokens(block(":root {"));
const dark = parseTokens(block(':root[data-theme="dark"]'));
const darkMedia = parseTokens(block(':root:not([data-theme="light"])'));

const channel = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// [foreground, background, minimum ratio]
const PAIRS = [
  ["text", "surface", 4.5],
  ["text", "panel", 4.5],
  ["text-muted", "surface", 4.5],
  ["text-muted", "panel", 4.5],
  ["accent", "panel", 4.5],
  ["accent", "surface", 4.5],
  ["accent-contrast", "accent", 4.5],
  ["warn", "panel", 4.5],
  ["danger", "panel", 4.5],
  ["insight", "panel", 4.5],
  ["text", "bubble-other", 4.5],
  ["warn", "surface", 4.5],
  ["danger", "surface", 4.5],
  ["insight", "surface", 4.5],
  ["accent-contrast", "danger", 4.5], // unread badge
  ["accent-contrast", "insight", 4.5], // toast and notes badge
  ["text-muted", "bubble-other", 4.5],
  ["focus", "panel", 3],
  ["focus", "surface", 3],
  ["border", "panel", 1.2],
];

for (const [name, tokens] of [["light", light], ["dark (manual)", dark], ["dark (system)", darkMedia]]) {
  test(`token contrast meets AA in ${name} theme`, () => {
    for (const [fg, bg, min] of PAIRS) {
      if (name !== "light" && fg === "border") continue; // decorative only
      const ratio = contrast(tokens[fg] || light[fg], tokens[bg] || light[bg]);
      assert.ok(ratio >= min, `${fg} on ${bg} is ${ratio.toFixed(2)}, needs ${min}`);
    }
  });
}

test("manual dark and system dark token sets agree", () => {
  for (const [key, value] of Object.entries(darkMedia)) assert.equal(dark[key], value, key);
});
