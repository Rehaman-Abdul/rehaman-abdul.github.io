// Day transition card: a modal dialog over the thread with the day name in the
// display face, the time, the event (if any) with its meter effect, and Continue.
import config from "../../content/config.js";
import strings from "../../content/strings.js";
import { h } from "./dom.js";
import { announce } from "./a11y.js";

export function showDayTransition({ day, time, event }) {
  const t = strings.ui.transition;
  return new Promise((resolve) => {
    const effects = event
      ? h(
          "p",
          { class: "transition__effects" },
          ...config.meterKeys
            .filter((key) => event.impact[key])
            .map((key) => h("span", { class: `chip ${event.impact[key] > 0 ? "chip--up" : "chip--down"}`, text: `${strings.meters[key].label} ${event.impact[key] > 0 ? "+" : ""}${event.impact[key]}` })),
        )
      : null;
    const next = h("button", { type: "button", class: "btn btn--primary", text: t.continue });
    const dialog = h(
      "dialog",
      { class: "dialog transition", "aria-labelledby": "transition-title" },
      h("p", { class: "transition__time", text: time }),
      h("h2", { id: "transition-title", class: "transition__day", text: strings.days[day] }),
      h("p", { class: "transition__event", text: event ? event.text : t.quiet }),
      effects,
      h("div", { class: "dialog__actions" }, next),
    );
    // The card is acknowledged with Continue, never dismissed by Escape.
    dialog.addEventListener("cancel", (e) => e.preventDefault());
    next.addEventListener("click", () => {
      dialog.close();
      dialog.remove();
      resolve();
    });
    document.body.append(dialog);
    dialog.showModal();
    next.focus();
    announce(`${strings.days[day]}. ${event ? event.text : t.quiet}`, { urgent: Boolean(event && event.polarity === "negative") });
  });
}
