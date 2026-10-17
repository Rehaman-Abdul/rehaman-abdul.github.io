// Evaluates `when` objects against game state. All keys are optional and
// combined with AND. Unknown keys throw so content typos surface early.

const CHECKS = {
  trustLt: (v, s) => s.meters.trust < v,
  trustGte: (v, s) => s.meters.trust >= v,
  bandwidthLt: (v, s) => s.meters.bandwidth < v,
  bandwidthGte: (v, s) => s.meters.bandwidth >= v,
  qualityLt: (v, s) => s.meters.quality < v,
  qualityGte: (v, s) => s.meters.quality >= v,
  overcommitGte: (v, s) => s.overcommit >= v,
  overcommitEq: (v, s) => s.overcommit === v,
  hasInsight: (v, s) => s.insights.includes(v),
  flag: (v, s) => Boolean(s.flags[v]),
  mondayOutcome: (v, s) => s.outcomes.mon === v,
  beatHadTag: (v, s) => Boolean(s.beat && s.beat.tagsChosen.includes(v)),
  difficulty: (v, s) => (Array.isArray(v) ? v.includes(s.difficulty) : s.difficulty === v),
};

export const CONDITION_KEYS = Object.keys(CHECKS);

export function matches(when, state) {
  if (!when) return true;
  for (const [key, value] of Object.entries(when)) {
    const check = CHECKS[key];
    if (!check) throw new Error(`Unknown condition key: ${key}`);
    if (!check(value, state)) return false;
  }
  return true;
}

// First matching variant wins; otherwise the default text is used.
export function pickText(item, state) {
  if (item.variants) {
    for (const variant of item.variants) {
      if (matches(variant.when, state)) return variant.text;
    }
  }
  return item.text;
}
