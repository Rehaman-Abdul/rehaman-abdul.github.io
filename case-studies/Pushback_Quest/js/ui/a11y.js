// Live regions and small accessibility helpers.
import { load } from "../storage.js";

let polite = null;
let assertive = null;

function region(id, live) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.className = "visually-hidden";
    el.setAttribute("aria-live", live);
    el.setAttribute("aria-atomic", "false");
    el.setAttribute("aria-relevant", "additions");
    document.body.append(el);
  }
  return el;
}

export function initLiveRegions() {
  polite = region("live-polite", "polite");
  assertive = region("live-assertive", "assertive");
}

// Each announcement is its own child node, so several in quick succession are
// queued by screen readers instead of replacing each other. Nodes are removed
// after a few seconds to keep the region small.
export function announce(text, { urgent = false } = {}) {
  const el = urgent ? assertive : polite;
  if (!el) return;
  const line = document.createElement("div");
  line.textContent = text;
  el.append(line);
  setTimeout(() => line.remove(), 6000);
}

export function reducedMotion() {
  const system = globalThis.matchMedia && globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return Boolean(system || load().settings.reducedMotion);
}

export function isTyping(target) {
  return target instanceof Element && target.closest("input, textarea, select, [contenteditable]") !== null;
}
