// Tiny DOM helpers. All text goes in through textContent or text nodes, never
// innerHTML, so content and player input can never become markup.

export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === "class") el.className = value;
    else if (key === "text") el.textContent = value;
    else if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? "" : String(value));
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return el;
}

export function clear(el) {
  el.replaceChildren();
  return el;
}

export function initials(name) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function hash(text) {
  let n = 0;
  for (const ch of text) n = (n * 31 + ch.codePointAt(0)) >>> 0;
  return n;
}

// Initials on a coloured circle, generated from the name. Colours are CSS
// classes (.av-0 to .av-6) so no inline styles are needed.
export function avatar(name, { size = "md" } = {}) {
  return h("span", { class: `avatar avatar--${size} av-${hash(name) % 7}`, "aria-hidden": "true" }, initials(name));
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
