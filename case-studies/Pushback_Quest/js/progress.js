// Saves the result of a finished run (endings seen, roles completed,
// achievements) through the safe storage wrapper.
import { cumulativeAchievements, runAchievements } from "./engine/achievements.js";
import { load, save } from "./storage.js";

// snapshot: game.snapshot() after the week ended. Returns the achievements
// earned this run and which of them are new.
export function recordRun({ snapshot, role }) {
  const data = load();
  if (snapshot.ended && !data.endingsSeen.includes(snapshot.ended)) data.endingsSeen.push(snapshot.ended);
  if (snapshot.completed && !data.rolesCompleted.includes(role.id)) data.rolesCompleted.push(role.id);

  const cumulative = cumulativeAchievements(data);
  const earned = [...new Set([...runAchievements(snapshot, role), ...cumulative.filter((id) => !data.achievements.includes(id))])];
  const fresh = earned.filter((id) => !data.achievements.includes(id));
  for (const id of cumulative) if (!data.achievements.includes(id)) data.achievements.push(id);
  data.achievements.push(...fresh.filter((id) => !data.achievements.includes(id)));
  save(data);
  return { earned, fresh };
}
