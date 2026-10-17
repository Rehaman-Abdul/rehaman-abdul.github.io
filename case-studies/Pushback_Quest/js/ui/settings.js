// Theme, reduced-motion override and reset. Settings persist through storage.js.
import { load, update, defaultData } from "../storage.js";
import strings from "../../content/strings.js";
import { h } from "./dom.js";

export function applySettings() {
  const { settings } = load();
  const root = document.documentElement;
  if (settings.theme === "light" || settings.theme === "dark") root.setAttribute("data-theme", settings.theme);
  else root.removeAttribute("data-theme");
  if (settings.reducedMotion) root.setAttribute("data-motion", "reduce");
  else root.removeAttribute("data-motion");
}

export function effectiveTheme() {
  const { theme } = load().settings;
  if (theme === "light" || theme === "dark") return theme;
  return globalThis.matchMedia && globalThis.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function toggleTheme() {
  const next = effectiveTheme() === "dark" ? "light" : "dark";
  update((data) => {
    data.settings.theme = next;
  });
  applySettings();
  return next;
}

export function openSettings(opener) {
  const t = strings.ui.settings;
  const settings = load().settings;

  const themeGroup = h("fieldset", { class: "field" }, h("legend", { text: t.theme }));
  for (const [value, label] of [["system", t.themeSystem], ["light", t.themeLight], ["dark", t.themeDark]]) {
    const input = h("input", { type: "radio", name: "theme", value, checked: settings.theme === value });
    input.addEventListener("change", () => {
      update((data) => {
        data.settings.theme = value;
      });
      applySettings();
    });
    themeGroup.append(h("label", { class: "choice" }, input, h("span", { text: label })));
  }

  const motion = h("input", { type: "checkbox", checked: Boolean(settings.reducedMotion) });
  motion.addEventListener("change", () => {
    update((data) => {
      data.settings.reducedMotion = motion.checked;
    });
    applySettings();
  });

  const resetStatus = h("p", { class: "muted", role: "status" });
  const reset = h("button", { type: "button", class: "btn btn--ghost", text: t.reset });
  reset.addEventListener("click", () => {
    if (globalThis.confirm(t.resetConfirm)) {
      update((data) => {
        const fresh = defaultData();
        data.achievements = fresh.achievements;
        data.endingsSeen = fresh.endingsSeen;
        data.rolesCompleted = fresh.rolesCompleted;
      });
      resetStatus.textContent = t.resetDone;
    }
  });

  const close = h("button", { type: "button", class: "btn", text: t.close });
  const dialog = h(
    "dialog",
    { class: "dialog", "aria-labelledby": "settings-title" },
    h("h2", { id: "settings-title", text: t.title }),
    themeGroup,
    h("label", { class: "choice" }, motion, h("span", { text: t.reducedMotion })),
    h("div", { class: "field" }, reset, resetStatus),
    h("div", { class: "dialog__actions" }, close),
  );
  const finish = () => {
    dialog.close();
    dialog.remove();
    if (opener && opener.isConnected) opener.focus();
  };
  close.addEventListener("click", finish);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    finish();
  });
  document.body.append(dialog);
  dialog.showModal();
}
