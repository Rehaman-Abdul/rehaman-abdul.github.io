// Game engine: pure logic, no DOM access, runs in the browser and in Node.
//
//   const game = createGame({ role, difficulty, name, seed });
//   game.current()          -> view to render (node info, messages, shuffled cards, meters, notes)
//   game.choose(choiceId)   -> ordered list of effects for the UI to play
//   game.log()              -> decision history for the debrief
//
// `role` is the role content object (see content/roles/*.js). Loading it with a
// dynamic import() is the caller's job (see content/roles/index.js).

import config from "../../content/config.js";
import strings from "../../content/strings.js";
import endingsContent from "../../content/endings.js";
import eventPool, { delayed as delayedEvents } from "../../content/events.js";
import { createRng, seedFromTime } from "./rng.js";
import { chooseTransitionEvent } from "./events.js";
import { runAchievements } from "./achievements.js";
import { pickText } from "./conditions.js";
import { resolveText, sanitizeName } from "./text.js";
import { evaluateEnding } from "./endings.js";

export const END_BEAT = "$endBeat";
export const RETURN = "$return";

const METERS = config.meterKeys;
const DAY_AFTER = { mon: "wed", wed: "fri" };

export function meterStatus(value) {
  if (value >= config.thresholds.healthy) return "healthy";
  if (value >= config.thresholds.strained) return "strained";
  return "critical";
}

const clamp = (n) => Math.max(0, Math.min(100, n));

export function createGame({ role, difficulty = "standard", name = "", seed } = {}) {
  if (!role) throw new Error("createGame needs a role object");
  const diff = config.difficulties[difficulty];
  if (!diff) throw new Error(`Unknown difficulty: ${difficulty}`);

  const runSeed = seed ?? seedFromTime();
  const rng = createRng(runSeed);

  const state = {
    roleId: role.id,
    difficulty,
    name: sanitizeName(name),
    seed: runSeed,
    meters: { ...diff.start },
    startMeters: { ...diff.start },
    day: "mon",
    beat: null,
    overcommit: 0,
    insights: [],
    flags: { criticalIncident: false },
    outcomes: { mon: null },
    firedEvents: [],
    history: [],
    minMeters: { ...diff.start },
    completed: false, // true once Friday's beat finished (the week was played out)
    achievements: [], // ids already announced during this run
    ended: null,
  };

  let view = null; // current view, built when a node is entered
  let cards = new Map(); // choice id -> full choice object for the current view

  // ---- helpers ----------------------------------------------------------

  const textVars = (extra) => ({ name: state.name, role: role.title, ...extra });
  const nodeOf = (id) => {
    const node = role.nodes[id];
    if (!node) throw new Error(`Missing node: ${id}`);
    return node;
  };
  const stakeholderName = (id) => (role.stakeholders[id] ? role.stakeholders[id].name : id);
  const firstName = (id) => stakeholderName(id).split(" ")[0];

  // Negative changes are scaled by the difficulty multiplier and rounded to the
  // nearest integer (symmetric around zero). Positive changes are unchanged.
  function scaleDelta(delta) {
    return delta < 0 ? -Math.round(-delta * diff.negativeMultiplier) : delta;
  }

  function applyImpact(impact, effects, { scale = true, source = "choice" } = {}) {
    const applied = {};
    for (const key of METERS) {
      const raw = impact[key] || 0;
      const delta = scale ? scaleDelta(raw) : raw;
      applied[key] = delta;
      state.meters[key] = clamp(state.meters[key] + delta);
      state.minMeters[key] = Math.min(state.minMeters[key], state.meters[key]);
    }
    if (METERS.some((key) => applied[key] !== 0)) {
      const deltas = {};
      for (const key of METERS) if (applied[key] !== 0) deltas[key] = applied[key];
      effects.push({ type: "meterChange", source, deltas, meters: { ...state.meters } });
    }
    return applied;
  }

  function endGame(effects) {
    state.ended = evaluateEnding(state);
    const content = endingsContent[state.ended];
    effects.push({
      type: "gameOver",
      ending: {
        id: state.ended,
        title: content.title,
        description: resolveText(content.description, textVars()),
        lesson: content.lesson,
      },
    });
    view = null;
    cards = new Map();
  }

  // Bandwidth or trust at 0 ends the week immediately.
  function checkFailure(effects) {
    if (state.meters.bandwidth <= 0 || state.meters.trust <= 0) {
      endGame(effects);
      return true;
    }
    return false;
  }

  // Quality at or below the threshold fires a critical incident, once per run.
  function checkCriticalIncident(effects) {
    if (state.flags.criticalIncident || state.meters.quality > config.thresholds.criticalIncidentQuality) {
      return false;
    }
    state.flags.criticalIncident = true;
    effects.push({
      type: "criticalIncident",
      label: strings.system.criticalIncidentLabel,
      text: resolveText(role.criticalIncident.text, textVars()),
    });
    applyImpact({ trust: config.thresholds.criticalIncidentTrustPenalty }, effects, { source: "criticalIncident" });
    return checkFailure(effects);
  }

  // ---- entering nodes and building views ---------------------------------

  function resolveMessage(message, node) {
    return {
      from: message.from,
      fromName: message.from === "system" ? null : stakeholderName(message.from),
      chat: node.chat,
      time: node.time,
      text: resolveText(pickText(message, state), textVars()),
    };
  }

  function buildTriageCards(node, followUp) {
    const vars = textVars({ wed: firstName(node.chat), mon: firstName(followUp.chat) });
    const t = strings.triage.cards;
    const make = (card, extra) => ({
      id: card.id,
      tag: "assertive",
      triage: true,
      text: resolveText(card.text, vars),
      coaching: card.coaching,
      line: card.line ? resolveText(card.line, vars) : null,
      ...extra,
    });
    return [
      make(t.wed, { triageChoice: "wed", impact: { trust: -diff.waitingPenalty }, scale: false }),
      make(t.mon, { triageChoice: "mon", impact: { trust: -diff.waitingPenalty }, scale: false }),
      make(t.hold, { triageChoice: "hold", subtype: "holding", impact: { bandwidth: -3 }, message: t.hold.message, messageChat: followUp.chat }),
    ];
  }

  // Base cards plus any unlocked insight cards (at most two), shuffled with the
  // seeded generator so order is reproducible for a given seed.
  function buildNodeCards(node) {
    const base = node.choices.filter((c) => !c.requiresInsight);
    const unlocked = node.choices.filter((c) => c.requiresInsight && state.insights.includes(c.requiresInsight)).slice(0, 2);
    return rng.shuffle([...base, ...unlocked]);
  }

  function enter(nodeId, effects, { triage = false } = {}) {
    const node = nodeOf(nodeId);
    state.beat.nodeId = nodeId;

    const fresh = !state.beat.delivered.includes(nodeId);
    const messages = fresh ? node.messages.map((m) => resolveMessage(m, node)) : [];
    if (fresh) state.beat.delivered.push(nodeId);

    if (fresh && node.joins) {
      const who = role.stakeholders[node.joins];
      effects.push({ type: "participantJoined", id: node.joins, name: who.name, title: who.title, chat: node.chat });
      effects.push({ type: "systemLine", text: resolveText(strings.system.joined, textVars({ who: who.name })) });
    }
    for (const m of messages) {
      effects.push(
        m.from === "system"
          ? { type: "systemLine", text: m.text }
          : { type: "stakeholderMessage", from: m.from, fromName: m.fromName, chat: m.chat, time: m.time, text: m.text },
      );
    }

    let kind = "choice";
    let nodeCards;
    let preview = null;
    let prompt = null;
    const followUpId = triage && role.beats[state.day].mondayFollowUp
      ? role.beats[state.day].mondayFollowUp[state.outcomes.mon]
      : null;

    if (followUpId) {
      const followUp = nodeOf(followUpId);
      kind = "triage";
      nodeCards = rng.shuffle(buildTriageCards(node, followUp));
      const first = followUp.messages[0];
      preview = {
        chat: followUp.chat,
        from: first.from,
        fromName: stakeholderName(first.from),
        text: resolveText(pickText(first, state), textVars()),
      };
      prompt = resolveText(strings.triage.prompt, textVars({ mon: firstName(followUp.chat) }));
      effects.push({ type: "triage", preview, prompt });
    } else {
      nodeCards = buildNodeCards(node);
    }

    cards = new Map(nodeCards.map((c) => [c.id, c]));
    view = {
      kind,
      nodeId,
      day: state.day,
      time: node.time,
      chat: node.chat,
      boundary: Boolean(node.boundary),
      messages,
      preview,
      prompt,
      cards: nodeCards.map((c) => {
        const card = { id: c.id, text: resolveText(c.text, textVars()) };
        if (c.requiresInsight) {
          card.usesInsight = { id: c.requiresInsight, title: role.insights[c.requiresInsight].title };
        }
        return card;
      }),
    };
  }

  function startBeat(day, effects) {
    const cfg = role.beats[day];
    state.day = day;
    state.beat = {
      id: day,
      nodeId: cfg.start,
      tagsChosen: [],
      escalated: false,
      delivered: [],
      returnTo: null,
    };
    enter(cfg.start, effects, { triage: day === "wed" });
  }

  // ---- beat flow ----------------------------------------------------------

  function shouldEscalate() {
    return state.beat.tagsChosen.includes("aggressive") || state.meters.trust < diff.escalationTrust;
  }

  function finishBeat(effects) {
    const day = state.day;
    if (day === "mon") state.outcomes.mon = state.beat.tagsChosen[state.beat.tagsChosen.length - 1] || null;
    if (day === "fri") {
      state.completed = true;
      endGame(effects);
      return;
    }
    const next = DAY_AFTER[day];

    // One event per day transition: a delayed consequence, the guaranteed
    // "rested" event, or a weighted random draw.
    const event = chooseTransitionEvent({ state, role, difficulty: diff, rng, pool: eventPool, delayed: delayedEvents, fromDay: day });
    const transition = { type: "dayTransition", from: day, to: next, event: null };
    effects.push(transition);
    if (event) {
      state.firedEvents.push(event.id);
      const applied = applyImpact(event.impact, effects, { source: "event" });
      const impact = Object.fromEntries(Object.entries(applied).filter(([, v]) => v !== 0));
      transition.event = { id: event.id, kind: event.kind, polarity: event.polarity, title: event.title, text: event.text, impact };
      if (checkFailure(effects) || checkCriticalIncident(effects)) return;
    }
    startBeat(next, effects);
  }

  function endBeat(effects) {
    const cfg = role.beats[state.day];
    if (!state.beat.escalated && cfg.escalation && shouldEscalate()) {
      state.beat.escalated = true;
      enter(cfg.escalation, effects);
      return;
    }
    finishBeat(effects);
  }

  function route(next, effects) {
    if (next === END_BEAT) return endBeat(effects);
    if (next === RETURN) {
      const target = state.beat.returnTo;
      state.beat.returnTo = null;
      return enter(target, effects);
    }
    return enter(next, effects);
  }

  // ---- public API -----------------------------------------------------------

  // Announces achievements newly satisfied by this choice, placed before any
  // gameOver effect so gameOver stays last.
  function choose(choiceId) {
    const effects = applyChoice(choiceId);
    const fresh = runAchievements(state, role).filter((id) => !state.achievements.includes(id));
    if (fresh.length) {
      state.achievements.push(...fresh);
      const unlocked = fresh.map((id) => ({ type: "achievementUnlocked", id }));
      const last = effects[effects.length - 1];
      if (last && last.type === "gameOver") effects.splice(effects.length - 1, 0, ...unlocked);
      else effects.push(...unlocked);
    }
    return effects;
  }

  function applyChoice(choiceId) {
    if (state.ended) throw new Error("The week is over");
    const card = cards.get(choiceId);
    if (!card) throw new Error(`Unknown or unavailable choice: ${choiceId}`);

    const effects = [];
    const nodeId = view.nodeId;
    const inEscalation = Boolean(state.beat.escalated && nodeId === role.beats[state.day].escalation);
    const boundary = card.triage ? false : view.boundary;

    // What the player "says"
    if (card.triage) {
      // The holding message goes to the Monday stakeholder's chat, not the current one.
      if (card.message) effects.push({ type: "playerMessage", text: card.message, choiceId: card.id, chat: card.messageChat });
      else effects.push({ type: "systemLine", text: card.line });
    } else {
      effects.push({ type: "playerMessage", text: resolveText(card.text, textVars()), choiceId: card.id, tag: card.tag, chat: view.chat });
    }

    const applied = applyImpact(card.impact, effects, { scale: card.scale !== false });

    state.history.push({
      nodeId: card.triage ? `${nodeId}:triage` : nodeId,
      choiceId: card.id,
      tag: card.tag,
      subtype: card.subtype || null,
      impact: { ...card.impact },
      appliedImpact: applied,
      day: state.day,
      escalation: inEscalation,
      boundary,
      usedInsight: card.requiresInsight || null,
    });

    if (!card.triage) {
      state.beat.tagsChosen.push(card.tag);
      if (card.tag === "passive") state.overcommit += 1;
    }

    if (card.grantsInsight && !state.insights.includes(card.grantsInsight)) {
      state.insights.push(card.grantsInsight);
      const insight = role.insights[card.grantsInsight];
      effects.push({ type: "insightAdded", id: card.grantsInsight, title: insight.title, note: insight.note });
    }

    if (checkFailure(effects)) return effects;
    if (checkCriticalIncident(effects)) return effects;

    if (card.triage) {
      const wedNode = state.beat.nodeId;
      if (card.triageChoice === "mon") {
        state.beat.returnTo = wedNode;
        enter(role.beats[state.day].mondayFollowUp[state.outcomes.mon], effects);
      } else {
        enter(wedNode, effects);
      }
      return effects;
    }

    route(card.next, effects);
    return effects;
  }

  function current() {
    const notes = state.insights.map((id) => ({ id, ...role.insights[id] }));
    if (state.ended) {
      return { ended: true, ending: state.ended, meters: { ...state.meters }, notes };
    }
    return { ended: false, ...view, meters: { ...state.meters }, notes };
  }

  startBeat("mon", []);

  return {
    current,
    choose,
    log: () => state.history.map((h) => ({ ...h })),
    // Read-only copy of the state (debrief, tests, simulator).
    snapshot: () => structuredClone(state),
    role,
    difficulty: diff,
  };
}
