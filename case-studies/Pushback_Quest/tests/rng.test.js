import test from "node:test";
import assert from "node:assert/strict";
import { createRng, mulberry32, parseSeed, seedFromTime } from "../js/engine/rng.js";

test("same seed gives the same sequence", () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  for (let i = 0; i < 20; i++) assert.equal(a(), b());
});

test("different seeds give different sequences", () => {
  assert.notEqual(mulberry32(1)(), mulberry32(2)());
});

test("values stay in [0, 1)", () => {
  const next = mulberry32(7);
  for (let i = 0; i < 1000; i++) {
    const v = next();
    assert.ok(v >= 0 && v < 1);
  }
});

test("shuffle is reproducible, a permutation, and does not mutate the input", () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8];
  const copy = input.slice();
  const first = createRng(99).shuffle(input);
  const second = createRng(99).shuffle(input);
  assert.deepEqual(first, second);
  assert.deepEqual(input, copy);
  assert.deepEqual(first.slice().sort((x, y) => x - y), copy);
});

test("shuffle produces more than one ordering across seeds", () => {
  const orders = new Set();
  for (let seed = 1; seed <= 20; seed++) orders.add(createRng(seed).shuffle([1, 2, 3]).join(","));
  assert.ok(orders.size > 1);
});

test("parseSeed reads ?seed= and rejects bad values", () => {
  assert.equal(parseSeed("?seed=48213"), 48213);
  assert.equal(parseSeed("?a=1&seed=5"), 5);
  assert.equal(parseSeed("?seed=abc"), null);
  assert.equal(parseSeed("?seed=-3"), null);
  assert.equal(parseSeed(""), null);
  assert.equal(parseSeed(undefined), null);
});

test("seedFromTime stays within five digits", () => {
  assert.equal(seedFromTime(1234567890123), 90123);
});
