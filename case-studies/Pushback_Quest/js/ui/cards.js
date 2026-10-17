// Response cards: large buttons, DOM order equals visual order (cards arrive
// already shuffled by the engine). Number keys 1-4 pick the matching card.
import strings from "../../content/strings.js";
import { resolveText } from "../engine/text.js";
import { clear, h } from "./dom.js";
import { isTyping } from "./a11y.js";

export function createCards(root) {
  const t = strings.ui.game;
  const heading = h("h2", { class: "cards__title", id: "cards-title", text: t.choices });
  const prompt = h("p", { class: "cards__prompt", hidden: true });
  const list = h("div", { class: "cards__list" });
  const hint = h("p", { class: "cards__hint muted" });
  root.append(heading, prompt, list, hint);
  root.setAttribute("aria-labelledby", "cards-title");
  root.hidden = true;

  let onChoose = null;

  const api = {
    clear() {
      clear(list);
      prompt.hidden = true;
      hint.textContent = "";
      root.hidden = true;
      onChoose = null;
    },
    show(cards, { promptText, choose }) {
      clear(list);
      onChoose = choose;
      prompt.hidden = !promptText;
      prompt.textContent = promptText || "";
      cards.forEach((card, index) => {
        const button = h(
          "button",
          { type: "button", class: `card${card.usesInsight ? " card--insight" : ""}`, "data-id": card.id, "aria-keyshortcuts": String(index + 1) },
          h("span", { class: "card__key", "aria-hidden": "true", text: index + 1 }),
          h(
            "span",
            { class: "card__body" },
            card.usesInsight ? h("span", { class: "card__label", text: `${t.usesNote}: ${card.usesInsight.title}` }) : null,
            h("span", { class: "card__text", text: card.text }),
          ),
        );
        button.addEventListener("click", () => {
          if (onChoose) onChoose(card.id);
        });
        list.append(button);
      });
      hint.textContent = resolveText(t.choiceHint, {}).replace("{n}", String(cards.length));
      root.hidden = false;
    },
    focusFirst() {
      const first = list.querySelector("button");
      if (first) first.focus({ preventScroll: true });
    },
    // Called from a document-level keydown listener.
    handleKey(event) {
      if (root.hidden || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return false;
      if (isTyping(event.target) || document.querySelector("dialog[open]")) return false;
      const n = Number(event.key);
      const buttons = list.querySelectorAll("button");
      if (Number.isInteger(n) && n >= 1 && n <= buttons.length) {
        event.preventDefault();
        buttons[n - 1].click();
        return true;
      }
      return false;
    },
  };
  return api;
}
