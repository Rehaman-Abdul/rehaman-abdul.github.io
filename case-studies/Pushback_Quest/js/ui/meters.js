// Three meters: label, bar, number and a status word (colour is never the only
// signal). The bar element carries role="meter" with full ARIA values.
import config from "../../content/config.js";
import strings from "../../content/strings.js";
import { meterStatus } from "../engine/game.js";
import { h } from "./dom.js";

export function createMeters({ qualityMeaning }) {
  const refs = {};
  const root = h("div", { class: "meters" });

  for (const key of config.meterKeys) {
    const label = strings.meters[key].label;
    const title = key === "quality" ? `${strings.meters[key].description} ${qualityMeaning}.` : strings.meters[key].description;
    const fill = h("span", { class: "meter__fill" });
    const bar = h("span", { class: "meter__bar", role: "meter", "aria-label": label, "aria-valuemin": 0, "aria-valuemax": 100 }, fill);
    const value = h("span", { class: "meter__value" });
    const status = h("span", { class: "meter__status" });
    const chips = h("span", { class: "meter__chips", "aria-hidden": "true" });
    refs[key] = { fill, bar, value, status, chips };
    root.append(
      h(
        "div",
        { class: "meter", title },
        h("span", { class: "meter__label", text: label }),
        bar,
        h("span", { class: "meter__read" }, value, status),
        chips,
      ),
    );
  }

  function setValue(key, n) {
    const r = refs[key];
    const status = meterStatus(n);
    r.fill.style.width = `${n}%`;
    r.fill.dataset.status = status;
    r.bar.setAttribute("aria-valuenow", n);
    r.bar.setAttribute("aria-valuetext", `${n}, ${status}`);
    r.value.textContent = n;
    r.status.textContent = strings.status[status];
  }

  return {
    el: root,
    set(meters) {
      for (const key of config.meterKeys) setValue(key, meters[key]);
    },
    // Updates the bars and flashes a delta chip like "+8" or "-15".
    change(meters, deltas = {}) {
      this.set(meters);
      for (const [key, delta] of Object.entries(deltas)) {
        const chip = h("span", { class: `chip ${delta > 0 ? "chip--up" : "chip--down"}`, text: delta > 0 ? `+${delta}` : `${delta}` });
        refs[key].chips.append(chip);
        setTimeout(() => chip.remove(), 2200);
      }
    },
  };
}
