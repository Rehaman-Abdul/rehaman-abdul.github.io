// Message thread: stakeholder bubbles (left), player bubbles (right), centred
// system lines and a typing indicator. Messages are stored per chat; the
// thread shows one chat at a time.
import strings from "../../content/strings.js";
import { resolveText } from "../engine/text.js";
import { avatar, clear, h } from "./dom.js";
import { reducedMotion } from "./a11y.js";

function renderEntry(entry) {
  if (entry.kind === "system") {
    return h("div", { class: `sysline${entry.tone ? ` sysline--${entry.tone}` : ""}`, text: entry.text });
  }
  const mine = entry.kind === "player";
  const who = mine ? strings.ui.game.you : entry.fromName;
  const meta = h("span", { class: "msg__meta" }, h("strong", { text: who }), entry.time ? ` · ${entry.time}` : "");
  const bubble = h("div", { class: "bubble", text: entry.text });
  if (mine) return h("div", { class: "msg msg--player" }, h("div", { class: "msg__body" }, meta, bubble));
  return h("div", { class: "msg msg--other" }, avatar(entry.fromName, { size: "sm" }), h("div", { class: "msg__body" }, meta, bubble));
}

export function createThread(root) {
  const list = h("div", { class: "thread__list" });
  const scroller = h("div", { class: "thread__scroll", role: "region", "aria-label": strings.ui.game.thread, tabindex: "0" }, list);
  root.append(scroller);

  const store = new Map();
  let current = null;
  let typingEl = null;

  const entriesFor = (chat) => {
    if (!store.has(chat)) store.set(chat, []);
    return store.get(chat);
  };

  function scrollEnd() {
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: reducedMotion() ? "auto" : "smooth" });
  }

  return {
    scroller,
    get chat() {
      return current;
    },
    setChat(chat) {
      current = chat;
      clear(list);
      for (const entry of entriesFor(chat)) list.append(renderEntry(entry));
      if (typingEl) list.append(typingEl);
      scroller.scrollTop = scroller.scrollHeight;
    },
    push(chat, entry) {
      entriesFor(chat).push(entry);
      if (chat !== current) return false;
      const node = renderEntry(entry);
      if (typingEl && typingEl.parentNode === list) list.insertBefore(node, typingEl);
      else list.append(node);
      scrollEnd();
      return true;
    },
    showTyping(chat, name) {
      this.hideTyping();
      if (chat !== current) return;
      typingEl = h(
        "div",
        { class: "msg msg--other msg--typing" },
        avatar(name, { size: "sm" }),
        h("div", { class: "bubble bubble--typing" }, h("span", { class: "dots", "aria-hidden": "true" }, h("i"), h("i"), h("i")), h("span", { class: "visually-hidden", text: resolveText(strings.ui.game.typing.replace("{name}", "{who}"), { who: name }) })),
      );
      list.append(typingEl);
      scrollEnd();
    },
    hideTyping() {
      if (typingEl) typingEl.remove();
      typingEl = null;
    },
    scrollEnd,
  };
}
