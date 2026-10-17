// Debrief screen: rank reveal, final meters, choice breakdown, strongest and
// costliest moments, role tip, actions and the run seed. Achievements and the
// boundary-moments section arrive in phase 3.
import achievementList from "../../content/achievements.js";
import config from "../../content/config.js";
import strings from "../../content/strings.js";
import { resolveText } from "../engine/text.js";
import { h } from "./dom.js";
import { reducedMotion } from "./a11y.js";

const sum = (obj, pick) => Object.values(obj).reduce((n, v) => n + pick(v), 0);
const gain = (entry) => sum(entry.appliedImpact, (v) => Math.max(0, v));
const loss = (entry) => sum(entry.appliedImpact, (v) => Math.max(0, -v));

function dominantTag(history) {
  const counts = { passive: 0, aggressive: 0, assertive: 0 };
  for (const entry of history) counts[entry.tag] += 1;
  // Ties favour assertive, then aggressive.
  return ["assertive", "aggressive", "passive"].reduce((best, tag) => (counts[tag] > counts[best] ? tag : best), "assertive");
}

function choiceOf(role, entry) {
  const node = role.nodes[entry.nodeId];
  return node ? node.choices.find((c) => c.id === entry.choiceId) : null;
}

export function renderDebrief(root, { game, ending, progress, onAgain, onAnother, onDifficulty }) {
  const t = strings.ui.debrief;
  const role = game.role;
  const snap = game.snapshot();
  const history = game.log();
  const realChoices = history.filter((e) => !e.nodeId.endsWith(":triage"));

  // ---- meters --------------------------------------------------------------
  const meterRows = h("ul", { class: "debrief__meters", role: "list" });
  const fills = [];
  for (const key of config.meterKeys) {
    const start = snap.startMeters[key];
    const end = snap.meters[key];
    const diff = end - start;
    const fill = h("span", { class: "meter__fill" });
    fill.dataset.target = end;
    fills.push(fill);
    meterRows.append(
      h(
        "li",
        { class: "debrief__meter" },
        h("span", { class: "meter__label", text: strings.meters[key].label }),
        h("span", { class: "meter__bar", "aria-hidden": "true" }, fill),
        h("span", { class: "debrief__delta", text: `${end} (${t.from} ${start}, ${diff > 0 ? "+" : ""}${diff})` }),
      ),
    );
  }

  // ---- breakdown -------------------------------------------------------------
  const counts = { passive: 0, aggressive: 0, assertive: 0 };
  for (const entry of history) counts[entry.tag] += 1;
  const total = history.length || 1;
  const bar = h("div", { class: "split", "aria-hidden": "true" });
  const legend = h("ul", { class: "split__legend", role: "list" });
  for (const tag of ["assertive", "passive", "aggressive"]) {
    const seg = h("span", { class: `split__seg split__seg--${tag}` });
    seg.dataset.width = (counts[tag] / total) * 100;
    bar.append(seg);
    legend.append(h("li", { class: `split__item split__item--${tag}`, text: `${t[tag]}: ${counts[tag]}` }));
  }

  // ---- moments ---------------------------------------------------------------
  const sections = [];
  const strongest = realChoices.filter((e) => e.tag === "assertive" && gain(e) > 0).sort((a, b) => gain(b) - gain(a))[0];
  if (strongest) {
    const choice = choiceOf(role, strongest);
    sections.push(
      h("section", { class: "debrief__block" }, h("h2", { text: t.strongest }), h("p", { class: "quote", text: choice.text }), h("p", { text: choice.coaching })),
    );
  }
  const costliest = realChoices.filter((e) => e.tag !== "assertive" && loss(e) > 0).sort((a, b) => loss(b) - loss(a))[0];
  if (costliest) {
    const choice = choiceOf(role, costliest);
    sections.push(
      h(
        "section",
        { class: "debrief__block" },
        h("h2", { text: t.costliest }),
        h("p", { class: "label", text: t.youSaid }),
        h("p", { class: "quote", text: choice.text }),
        h("p", { text: choice.coaching }),
        choice.betterResponse ? [h("p", { class: "label", text: t.tryInstead }), h("p", { class: "quote quote--better", text: choice.betterResponse })] : null,
      ),
    );
  }
  // Boundary moments: how the player handled each non-negotiable node.
  const boundaries = history.filter((e) => e.boundary);
  if (boundaries.length) {
    sections.push(
      h(
        "section",
        { class: "debrief__block" },
        h("h2", { text: t.boundaries }),
        h("p", { class: "muted", text: t.boundaryIntro }),
        h(
          "ul",
          { class: "boundary-list", role: "list" },
          boundaries.map((entry) => {
            const choice = choiceOf(role, entry);
            return h(
              "li",
              { class: `boundary boundary--${entry.tag}` },
              h("p", { class: "boundary__verdict", text: t.verdict[entry.tag] }),
              h("p", { class: "quote", text: choice.text }),
              h("p", { text: choice.coaching }),
              choice.betterResponse ? [h("p", { class: "label", text: t.tryInstead }), h("p", { class: "quote quote--better", text: choice.betterResponse })] : null,
            );
          }),
        ),
      ),
    );
  }

  // Achievements earned this run (new ones are flagged).
  const earned = (progress && progress.earned) || [];
  const earnedList = earned.length
    ? h(
        "ul",
        { class: "achievements", role: "list" },
        earned.map((id) => {
          const a = achievementList.find((x) => x.id === id);
          const isNew = progress.fresh.includes(id);
          return h("li", { class: "achievement is-unlocked" }, h("strong", { text: a.title }), isNew ? h("span", { class: "tag-new", text: t.newBadge }) : null, h("p", { class: "muted", text: a.description }));
        }),
      )
    : h("p", { class: "muted", text: t.noAchievements });
  sections.push(h("section", { class: "debrief__block" }, h("h2", { text: t.achievements }), earnedList));

  const tip = role.tips[dominantTag(history)];
  sections.push(h("section", { class: "debrief__block" }, h("h2", { text: resolveText(t.tip, { role: role.title }) }), h("p", { text: tip })));

  // ---- actions ---------------------------------------------------------------
  const again = h("button", { type: "button", class: "btn btn--primary", text: resolveText(t.again, { role: role.title }) });
  const another = h("button", { type: "button", class: "btn", text: t.another });
  const difficulty = h("button", { type: "button", class: "btn", text: t.changeDifficulty });
  again.addEventListener("click", onAgain);
  another.addEventListener("click", onAnother);
  difficulty.addEventListener("click", onDifficulty);

  const title = h("h1", { class: "rank__title", tabindex: "-1", text: ending.title });
  const page = h(
    "main",
    { id: "main", class: "debrief", tabindex: "-1" },
    h(
      "section",
      { class: "rank" },
      h("p", { class: "rank__label muted", text: `${role.title} · ${strings.days.fri}` }),
      title,
      h("p", { class: "rank__desc", text: ending.description }),
      h("p", { class: "rank__lesson", text: ending.lesson }),
    ),
    h("section", { class: "debrief__block" }, h("h2", { text: t.meters }), meterRows, h("p", { class: "muted", text: resolveText(t.qualityMeans, {}).replace("{meaning}", role.qualityMeaning) })),
    h("section", { class: "debrief__block" }, h("h2", { text: t.breakdown }), bar, legend, h("p", { class: "muted", text: t.decisions.replace("{n}", history.length) })),
    sections,
    h("div", { class: "debrief__actions" }, again, another, difficulty),
    h("p", { class: "muted debrief__seed", text: t.seed.replace("{seed}", snap.seed) }),
  );
  root.replaceChildren(page);
  title.focus({ preventScroll: true });

  // Rank reveal: the title builds in and meters settle to their final values.
  const settle = () => {
    for (const fill of fills) fill.style.width = `${fill.dataset.target}%`;
    for (const seg of bar.children) seg.style.width = `${seg.dataset.width}%`;
  };
  if (reducedMotion()) settle();
  else {
    page.classList.add("is-revealing");
    requestAnimationFrame(() => requestAnimationFrame(settle));
  }
}
