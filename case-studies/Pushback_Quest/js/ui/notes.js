// Notes panel (earned insights, styled as pinned notes) and a generic side
// panel/bottom sheet that the meter details also use.
import strings from "../../content/strings.js";
import { clear, h } from "./dom.js";
import { icon } from "./icons.js";

// A non-modal panel: right-hand side panel on desktop, bottom sheet on mobile.
export function createPanel({ id, title, content, onClose }) {
  const closeButton = h("button", { type: "button", class: "icon-btn", "aria-label": `Close ${title}` }, icon("close"));
  const body = h("div", { class: "panel__body" }, content);
  const el = h(
    "aside",
    { class: "panel", id, hidden: true, "aria-labelledby": `${id}-title`, tabindex: "-1" },
    h("div", { class: "panel__head" }, h("h2", { id: `${id}-title`, text: title }), closeButton),
    body,
  );
  let opener = null;
  const api = {
    el,
    body,
    get isOpen() {
      return !el.hidden;
    },
    open(from) {
      opener = from || null;
      el.hidden = false;
      el.focus();
    },
    close() {
      if (el.hidden) return;
      el.hidden = true;
      if (opener && opener.isConnected) opener.focus();
      if (onClose) onClose();
    },
    toggle(from) {
      if (el.hidden) api.open(from);
      else api.close();
    },
  };
  closeButton.addEventListener("click", api.close);
  return api;
}

export function createNotes() {
  const t = strings.ui.game;
  const list = h("ul", { class: "notes", role: "list" });
  const empty = h("p", { class: "muted", text: t.notesEmpty });
  const content = h("div", {}, empty, list);
  const panel = createPanel({ id: "notes-panel", title: t.notes, content });
  const count = h("span", { class: "badge", hidden: true });
  const button = h("button", { type: "button", class: "btn btn--ghost notes-btn", "aria-controls": "notes-panel", "aria-expanded": "false" }, icon("notes"), h("span", { text: t.notes }), count);
  const sync = () => button.setAttribute("aria-expanded", String(panel.isOpen));

  button.addEventListener("click", () => {
    panel.toggle(button);
    sync();
  });
  panel.el.addEventListener("transitionend", sync);

  return {
    panel,
    button,
    add(note) {
      empty.hidden = true;
      list.append(
        h("li", { class: "note" }, h("span", { class: "note__pin" }, icon("notes")), h("div", {}, h("strong", { text: note.title }), h("p", { text: note.note }))),
      );
      const n = list.children.length;
      count.hidden = false;
      count.replaceChildren(String(n), h("span", { class: "visually-hidden", text: " saved" }));
    },
    close() {
      panel.close();
      sync();
    },
    reset() {
      clear(list);
      empty.hidden = false;
      count.hidden = true;
    },
    sync,
  };
}
