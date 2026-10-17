// Ending evaluation. Order matters: the first match wins.

export const ENDING_ORDER = ["burnout", "lost_trust", "master", "quiet_fixer", "steady", "fumes"];

export function assertiveShare(history) {
  if (history.length === 0) return 0;
  return history.filter((h) => h.tag === "assertive").length / history.length;
}

export function evaluateEnding(state) {
  const { meters, minMeters, history } = state;

  if (minMeters.bandwidth <= 0) return "burnout";
  if (minMeters.trust <= 0 || meters.trust < 35) return "lost_trust";

  const allAtLeast = (n) => meters.trust >= n && meters.bandwidth >= n && meters.quality >= n;
  if (allAtLeast(60) && assertiveShare(history) >= 0.6) return "master";
  if (meters.trust >= 60 && (meters.bandwidth < 40 || meters.quality < 50)) return "quiet_fixer";
  if (allAtLeast(45)) return "steady";
  return "fumes";
}
