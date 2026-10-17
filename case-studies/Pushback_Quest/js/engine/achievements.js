// Achievement conditions. Run achievements depend only on one run's state;
// cumulative ones depend on saved progress (endings seen, roles completed).
import { ROLE_IDS } from "../../content/roles/index.js";
import { ENDING_ORDER } from "./endings.js";

const FAILED = ["burnout", "lost_trust"];

// Ids satisfied by this run so far. Some can only be true once the week ends.
export function runAchievements(state, role) {
  const earned = [];
  const history = state.history;

  if (state.completed && state.overcommit === 0) earned.push("zero_overtime");
  if (history.some((e) => e.escalation && e.tag === "assertive")) earned.push("turnaround");
  if (history.some((e) => e.usedInsight)) earned.push("insightful");
  if (state.insights.length >= Object.keys(role.insights).length) earned.push("curious");

  const boundaryNodes = Object.values(role.nodes).filter((n) => n.boundary).length;
  const boundaryChoices = history.filter((e) => e.boundary);
  if (state.completed && boundaryNodes > 0 && boundaryChoices.length === boundaryNodes && boundaryChoices.every((e) => e.tag === "assertive")) {
    earned.push("boundary_keeper");
  }

  if (history.some((e) => e.choiceId === "triage_hold")) earned.push("triage_pro");
  if (state.ended === "master") earned.push("master");
  if (state.difficulty === "crunch" && state.completed && !FAILED.includes(state.ended)) earned.push("crunch_survivor");
  return earned;
}

// Ids satisfied by saved progress across runs.
export function cumulativeAchievements({ endingsSeen, rolesCompleted }) {
  const earned = [];
  if (ENDING_ORDER.every((id) => endingsSeen.includes(id))) earned.push("all_endings");
  if (ROLE_IDS.every((id) => rolesCompleted.includes(id))) earned.push("all_roles");
  return earned;
}
