// Game screen orchestrator. It plays the engine's effect list in order (with
// typing delays) and never mutates game state.
import achievementList from "../../content/achievements.js";
import config from "../../content/config.js";
import strings from "../../content/strings.js";
import { createGame } from "../engine/game.js";
import { load } from "../storage.js";
import { announce, reducedMotion } from "./a11y.js";
import { createCards } from "./cards.js";
import { h, sleep } from "./dom.js";
import { icon } from "./icons.js";
import { createMeters } from "./meters.js";
import { createNotes, createPanel } from "./notes.js";
import { openSettings } from "./settings.js";
import { createShell } from "./shell.js";
import { createThread } from "./thread.js";
import { showDayTransition } from "./transition.js";

export function renderGame(root, { role, options, onEnd, onQuit }) {
  const t = strings.ui.game;
  const game = createGame({ role, ...options });
  const stakeholders = role.stakeholders;

  let busy = false;
  let ctxChat = null; // chat that system lines and player messages belong to
  let time = "";
  let day = "mon";
  let ending = null;

  // ---- parts ---------------------------------------------------------------
  const shell = createShell({
    stakeholders,
    onSelectChat(id) {
      shell.drawer.close({ restoreFocus: false });
      showChat(id);
      renderCards();
    },
    onOpenSettings: (opener) => openSettings(opener),
    onQuit() {
      if (globalThis.confirm(t.quitConfirm)) {
        destroy();
        onQuit();
      }
    },
  });
  const meters = createMeters({ qualityMeaning: role.qualityMeaning });
  const notes = createNotes();
  const meterList = h("dl", { class: "meter-info" });
  for (const key of config.meterKeys) {
    const extra = key === "quality" ? ` ${role.qualityMeaning}.` : "";
    meterList.append(h("dt", { text: strings.meters[key].label }), h("dd", { text: strings.meters[key].description + extra }));
  }
  const meterPanel = createPanel({ id: "meter-panel", title: t.meterDetailsTitle, content: meterList });
  const meterBtn = h("button", { type: "button", class: "icon-btn", "aria-label": t.meterDetails, "aria-controls": "meter-panel" }, icon("info"));
  meterBtn.addEventListener("click", () => meterPanel.toggle(meterBtn));

  const threadHost = h("div", { class: "thread__host" });
  const thread = createThread(threadHost);
  const notice = h("div", { class: "notice", hidden: true });
  const cardsRoot = h("section", { class: "cards" });
  const cards = createCards(cardsRoot);
  const endArea = h("div", { class: "endarea", hidden: true });
  const toasts = h("div", { class: "toasts", "aria-hidden": "true" });

  const statusbar = h("div", { class: "statusbar" }, meters.el, meterBtn, notes.button);
  const main = h("main", { class: "thread", id: "main", tabindex: "-1" }, shell.header, statusbar, threadHost, notice, cardsRoot, endArea);
  const gameEl = h("div", { class: "game" }, shell.rail, shell.chatList, main, notes.panel.el, meterPanel.el, toasts);
  root.replaceChildren(gameEl);

  // ---- helpers ---------------------------------------------------------------
  function showChat(id) {
    shell.upsertChat(id);
    thread.setChat(id);
    shell.setActive(id);
  }

  function setClock() {
    shell.setClock(`${strings.days[day].slice(0, 3)}, ${time}`);
  }

  function toast(text) {
    const el = h("div", { class: "toast" }, icon("check"), h("span", { text }));
    toasts.append(el);
    setTimeout(() => el.remove(), 2800);
  }

  async function typeThenPush(e) {
    if (thread.chat !== e.chat) showChat(e.chat);
    const ms = reducedMotion() ? 0 : Math.min(1200, Math.max(600, 600 + e.text.length * 3));
    if (ms) {
      thread.showTyping(e.chat, e.fromName);
      await sleep(ms);
      thread.hideTyping();
    }
    thread.push(e.chat, { kind: "other", from: e.from, fromName: e.fromName, text: e.text, time: e.time });
    shell.upsertChat(e.chat, { preview: e.text });
    announce(`${e.fromName}: ${e.text}`);
  }

  async function handle(e, effects, i) {
    switch (e.type) {
      case "playerMessage": {
        const chat = e.chat || ctxChat;
        thread.push(chat, { kind: "player", text: e.text, time });
        shell.upsertChat(chat, { preview: `${t.you}: ${e.text}`, ...(chat !== thread.chat ? { unread: 0 } : {}) });
        break;
      }
      case "meterChange":
        meters.change(e.meters, e.deltas);
        break;
      case "insightAdded":
        notes.add(e);
        toast(t.notesSaved);
        announce(`${t.notesSaved}: ${e.title}`);
        break;
      case "participantJoined":
        ctxChat = e.chat;
        shell.addPerson(e.chat, e.id);
        shell.setActive(thread.chat); // refreshes the participants line in the header
        break;
      case "systemLine":
        thread.push(ctxChat, { kind: "system", text: e.text });
        break;
      case "stakeholderMessage":
        ctxChat = e.chat;
        time = e.time;
        setClock();
        await typeThenPush(e);
        break;
      case "dayTransition": {
        const next = effects.slice(i + 1).find((x) => x.time);
        day = e.to;
        if (next) time = next.time;
        setClock();
        await showDayTransition({ day: e.to, time, event: e.event });
        if (next) {
          ctxChat = next.chat;
          showChat(next.chat);
        }
        thread.push(ctxChat, { kind: "system", text: strings.days[e.to] });
        if (e.event) thread.push(ctxChat, { kind: "system", text: e.event.text });
        break;
      }
      case "achievementUnlocked": {
        const found = achievementList.find((a) => a.id === e.id);
        if (found && !load().achievements.includes(e.id)) {
          toast(`${t.achievementUnlocked}: ${found.title}`);
          announce(`${t.achievementUnlocked}: ${found.title}`);
        }
        break;
      }
      case "criticalIncident":
        thread.push(ctxChat, { kind: "system", tone: "danger", text: `${e.label}: ${e.text}` });
        announce(`${e.label}: ${e.text}`, { urgent: true });
        break;
      case "triage":
        shell.addUnread(e.preview.chat, e.preview.text);
        announce(`${t.newMessage} from ${e.preview.fromName}: ${e.preview.text}`);
        break;
      case "gameOver":
        ending = e.ending;
        break;
      default:
        break;
    }
  }

  async function play(effects) {
    for (let i = 0; i < effects.length; i++) await handle(effects[i], effects, i);
  }

  function renderCards({ focus = false } = {}) {
    const view = game.current();
    notice.hidden = true;
    endArea.hidden = true;
    cards.clear();
    if (view.ended) {
      const button = h("button", { type: "button", class: "btn btn--primary", text: t.seeDebrief });
      button.addEventListener("click", () => {
        destroy();
        onEnd(ending);
      });
      endArea.replaceChildren(h("p", { text: t.weekOver }), button);
      endArea.hidden = false;
      if (focus) button.focus({ preventScroll: true });
      announce(t.weekOver);
      return;
    }
    if (view.chat !== thread.chat) {
      const go = h("button", { type: "button", class: "btn", text: t.goToCurrent.replace("{name}", stakeholders[view.chat].name.split(" ")[0]) });
      go.addEventListener("click", () => {
        showChat(view.chat);
        renderCards({ focus: true });
      });
      notice.replaceChildren(h("p", { text: t.viewingOther }), go);
      notice.hidden = false;
      return;
    }
    cards.show(view.cards, { promptText: view.prompt, choose });
    if (focus) cards.focusFirst();
  }

  async function choose(id) {
    if (busy) return;
    busy = true;
    cards.clear();
    notice.hidden = true;
    // The clicked card is gone: park focus on the conversation so keyboard and
    // screen reader users are not dropped back to the top of the page.
    thread.scroller.focus({ preventScroll: true });
    ctxChat = game.current().chat;
    try {
      await play(game.choose(id));
    } finally {
      busy = false;
    }
    renderCards({ focus: true });
  }

  // ---- keyboard ----------------------------------------------------------------
  function onKey(event) {
    if (event.key === "Escape") {
      if (document.querySelector("dialog[open]")) return;
      if (notes.panel.isOpen) notes.close();
      else if (meterPanel.isOpen) meterPanel.close();
      else if (shell.drawer.isOpen) shell.drawer.close();
      return;
    }
    if (!busy) cards.handleKey(event);
  }
  document.addEventListener("keydown", onKey);
  function destroy() {
    document.removeEventListener("keydown", onKey);
  }

  // ---- start ---------------------------------------------------------------------
  meters.set(game.snapshot().meters);
  const first = game.current();
  ctxChat = first.chat;
  showChat(first.chat);
  busy = true;
  thread.push(first.chat, { kind: "system", text: strings.days.mon });
  play(first.messages.map((m) => ({ type: "stakeholderMessage", ...m }))).then(() => {
    busy = false;
    renderCards({ focus: true });
  });
  return { game, destroy };
}
