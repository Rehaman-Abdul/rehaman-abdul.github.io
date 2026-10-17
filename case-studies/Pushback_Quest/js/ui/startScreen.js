// Start screen: premise, name, difficulty and the eight role cards.
// Picking a role starts the week at once (name and difficulty have defaults).
import achievementList from "../../content/achievements.js";
import { load } from "../storage.js";
import config from "../../content/config.js";
import strings from "../../content/strings.js";
import roleCards from "../../content/roleCards.js";
import { resolveText } from "../engine/text.js";
import { clear, h } from "./dom.js";
import { icon, logoMark } from "./icons.js";
import { effectiveTheme, openSettings, toggleTheme } from "./settings.js";

// Unlocked and locked achievements. State is shown in words, not only styling.
function achievementsPanel() {
  const a = strings.ui.achievements;
  const unlocked = new Set(load().achievements);
  const items = achievementList.map((item) => {
    const on = unlocked.has(item.id);
    return h(
      "li",
      { class: `achievement ${on ? "is-unlocked" : "is-locked"}` },
      h("strong", { text: item.title }),
      h("span", { class: "achievement__state", text: on ? a.unlocked : a.locked }),
      h("p", { class: "muted", text: item.description }),
    );
  });
  return h(
    "section",
    { class: "start__achievements" },
    h("h2", { text: a.heading }),
    h("p", { class: "muted", text: a.count.replace("{n}", unlocked.size).replace("{total}", achievementList.length) }),
    h("ul", { class: "achievements", role: "list" }, items),
  );
}

export function renderStartScreen(root, { initial = {}, focus, onStart }) {
  const s = strings.ui.start;
  let difficulty = initial.difficulty || "standard";

  const nameInput = h("input", {
    id: "player-name",
    type: "text",
    class: "input",
    maxlength: 24,
    autocomplete: "given-name",
    value: initial.name || "",
    "aria-describedby": "name-hint",
  });
  nameInput.addEventListener("input", () => {
    const cleaned = nameInput.value.replace(/[^\p{L}\p{M} '’-]/gu, "");
    if (cleaned !== nameInput.value) nameInput.value = cleaned;
  });

  const difficultyNote = h("p", { class: "muted difficulty-note", id: "difficulty-note" });
  const segments = h("div", { class: "segmented" });
  const updateNote = () => {
    difficultyNote.textContent = config.difficulties[difficulty].description;
  };
  const difficultyGroup = h("fieldset", { class: "field", "aria-describedby": "difficulty-note" }, h("legend", { text: s.difficultyLegend }), segments, difficultyNote);
  for (const [id, d] of Object.entries(config.difficulties)) {
    const input = h("input", { type: "radio", name: "difficulty", value: id, checked: id === difficulty });
    input.addEventListener("change", () => {
      difficulty = id;
      updateNote();
    });
    segments.append(h("label", { class: "segment" }, input, h("span", { text: d.label })));
  }
  updateNote();

  const grid = h("ul", { class: "role-grid", role: "list" });
  for (const role of roleCards) {
    const stakeholders = h("ul", { class: "role-card__people", role: "list" });
    for (const p of role.stakeholders) stakeholders.append(h("li", {}, h("strong", { text: p.name }), ` · ${p.title}`));

    const action = role.playable ? resolveText(s.playAs, { role: role.title }) : s.comingSoon;
    const card = h(
      "button",
      {
        type: "button",
        class: `role-card${role.playable ? "" : " role-card--soon"}`,
        "aria-disabled": role.playable ? null : "true",
        "data-role": role.id,
      },
      h("span", { class: "role-card__icon" }, icon(role.icon)),
      h("span", { class: "role-card__title", text: role.title }),
      h("span", { class: "role-card__teaser", text: role.teaser }),
      h("span", { class: "role-card__label", text: s.stakeholdersLabel }),
      stakeholders,
      h("span", { class: "role-card__action", text: action }),
    );
    if (role.playable) {
      card.addEventListener("click", () => onStart({ roleId: role.id, name: nameInput.value, difficulty }));
    }
    grid.append(h("li", {}, card));
  }

  const settingsButton = h("button", { type: "button", class: "icon-btn", "aria-label": strings.ui.game.settings }, icon("settings"));
  settingsButton.addEventListener("click", () => openSettings(settingsButton));
  const themeButton = h("button", { type: "button", class: "icon-btn", "aria-label": strings.ui.settings.toggleTheme }, icon(effectiveTheme() === "dark" ? "sun" : "moon"));
  themeButton.addEventListener("click", () => {
    themeButton.replaceChildren(icon(toggleTheme() === "dark" ? "sun" : "moon"));
  });

  clear(root).append(
    h(
      "div",
      { class: "start" },
      h(
        "header",
        { class: "start__top" },
        h("span", { class: "brand" }, logoMark(), h("span", { text: strings.app.chatAppName })),
        h("span", { class: "start__tools" }, themeButton, settingsButton),
      ),
      h(
        "main",
        { id: "main", class: "start__main", tabindex: "-1" },
        h(
          "section",
          { class: "hero" },
          h("h1", { text: strings.app.title }),
          h("p", { class: "hero__subtitle", text: strings.app.subtitle }),
          h("p", { class: "hero__premise", text: strings.app.premise }),
        ),
        h(
          "section",
          { class: "start__setup", "aria-label": "Setup" },
          h("div", { class: "field" }, h("label", { for: "player-name", text: s.nameLabel }), nameInput, h("p", { class: "muted", id: "name-hint", text: s.nameHint })),
          difficultyGroup,
        ),
        h("section", {}, h("h2", { text: s.roleHeading }), grid),
        achievementsPanel(),
        h("p", { class: "muted start__privacy", text: s.privacy }),
      ),
    ),
  );

  if (focus === "difficulty") root.querySelector('input[name="difficulty"]:checked').focus();
}
