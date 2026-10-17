// App shell: rail, chat list and thread header. Chats appear as stakeholders
// first write to the player. Presence has a dot plus a text alternative.
import strings from "../../content/strings.js";
import { resolveText } from "../engine/text.js";
import { avatar, clear, h } from "./dom.js";
import { icon, logoMark } from "./icons.js";

export function createShell({ stakeholders, onSelectChat, onOpenSettings, onQuit }) {
  const t = strings.ui.game;

  // ---- rail ---------------------------------------------------------------
  const navItem = (name, label, active) =>
    h("button", { type: "button", class: `rail__btn${active ? " is-active" : ""}`, "aria-current": active ? "page" : null, "aria-disabled": active ? null : "true", title: label }, icon(name), h("span", { class: "visually-hidden", text: label }));
  const settingsBtn = h("button", { type: "button", class: "rail__btn", title: t.settings }, icon("settings"), h("span", { class: "visually-hidden", text: t.settings }));
  settingsBtn.addEventListener("click", () => onOpenSettings(settingsBtn));
  const quitBtn = h("button", { type: "button", class: "rail__btn rail__quit", title: t.quit }, icon("close"), h("span", { class: "visually-hidden", text: t.quit }));
  quitBtn.addEventListener("click", onQuit);
  const rail = h(
    "nav",
    { class: "rail", "aria-label": t.app },
    h("span", { class: "rail__logo" }, logoMark()),
    navItem("chat", t.chats, true),
    navItem("activity", t.activity, false),
    navItem("calendar", t.calendar, false),
    h("span", { class: "rail__spacer" }),
    settingsBtn,
    quitBtn,
  );

  // ---- chat list ------------------------------------------------------------
  const chatEls = new Map();
  const chatData = new Map();
  const listEl = h("ul", { class: "chat-list", role: "list" });
  const closeChats = h("button", { type: "button", class: "icon-btn chatlist__close", "aria-label": t.closeChats }, icon("close"));
  const chatList = h("aside", { class: "chatlist", id: "chatlist", "aria-label": t.chatList }, h("div", { class: "chatlist__head" }, h("h2", { text: t.chats }), closeChats), listEl);

  function renderChat(id) {
    const who = stakeholders[id];
    const data = chatData.get(id);
    let item = chatEls.get(id);
    const button = h(
      "button",
      { type: "button", class: "chat", "aria-current": data.active ? "true" : null },
      h("span", { class: "chat__avatar" }, avatar(who.name), h("span", { class: `presence presence--${who.presence}`, "aria-hidden": "true" })),
      h(
        "span",
        { class: "chat__text" },
        h("span", { class: "chat__name" }, who.name, h("span", { class: "visually-hidden", text: `, ${t.presence[who.presence]}` })),
        h("span", { class: "chat__preview", text: data.preview || who.title }),
      ),
      data.unread ? h("span", { class: "badge" }, String(data.unread), h("span", { class: "visually-hidden", text: " unread" })) : null,
    );
    button.addEventListener("click", () => onSelectChat(id));
    if (!item) {
      item = h("li");
      chatEls.set(id, item);
      listEl.append(item);
    }
    item.replaceChildren(button);
  }

  // ---- thread header ----------------------------------------------------------
  const menuBtn = h("button", { type: "button", class: "icon-btn thread__menu", "aria-label": t.openChats, "aria-controls": "chatlist", "aria-expanded": "false" }, icon("menu"));
  const headAvatar = h("span", { class: "thread__avatar" });
  const headName = h("h1", { class: "thread__name" });
  const headSub = h("p", { class: "thread__sub muted" });
  const clock = h("p", { class: "thread__clock" });
  const header = h("header", { class: "thread__head" }, menuBtn, headAvatar, h("div", { class: "thread__who" }, headName, headSub), clock);

  const drawer = {
    open() {
      document.querySelector(".game").classList.add("drawer-open");
      document.querySelector(".thread").inert = true; // keeps focus in the drawer while it covers the thread
      menuBtn.setAttribute("aria-expanded", "true");
      closeChats.focus();
    },
    close({ restoreFocus = true } = {}) {
      const game = document.querySelector(".game");
      if (!game || !game.classList.contains("drawer-open")) return;
      game.classList.remove("drawer-open");
      document.querySelector(".thread").inert = false;
      menuBtn.setAttribute("aria-expanded", "false");
      if (restoreFocus) menuBtn.focus();
    },
    get isOpen() {
      return document.querySelector(".game").classList.contains("drawer-open");
    },
  };
  menuBtn.addEventListener("click", () => (drawer.isOpen ? drawer.close() : drawer.open()));
  closeChats.addEventListener("click", () => drawer.close());

  return {
    rail,
    chatList,
    header,
    menuBtn,
    drawer,
    chatIds: () => [...chatData.keys()],
    // Adds the chat if new, then merges `patch` (preview text, unread count).
    upsertChat(id, patch = {}) {
      const data = chatData.get(id) || { unread: 0, preview: "", active: false, people: [] };
      Object.assign(data, patch);
      chatData.set(id, data);
      renderChat(id);
    },
    addUnread(id, preview) {
      const data = chatData.get(id);
      this.upsertChat(id, { unread: (data ? data.unread : 0) + 1, preview });
    },
    setActive(id) {
      for (const [chatId, data] of chatData) {
        data.active = chatId === id;
        if (data.active) data.unread = 0;
        renderChat(chatId);
      }
      const who = stakeholders[id];
      const data = chatData.get(id);
      headAvatar.replaceChildren(avatar(who.name, { size: "md" }));
      headName.textContent = who.name;
      const people = data.people.map((p) => `${stakeholders[p].name} (${stakeholders[p].title})`);
      headSub.textContent = people.length ? `${who.title} · ${resolveText(t.withPeople, {}).replace("{names}", people.join(", "))}` : `${who.title} · ${t.presence[who.presence]}`;
    },
    addPerson(chatId, personId) {
      const data = chatData.get(chatId);
      if (data && !data.people.includes(personId)) data.people.push(personId);
    },
    setClock(text) {
      clock.textContent = text;
    },
    clear() {
      clear(listEl);
    },
  };
}
