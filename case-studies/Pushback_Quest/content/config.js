// Difficulty settings (PRD section 5.2) and shared thresholds.

export default {
  meterKeys: ["trust", "bandwidth", "quality"],
  difficulties: {
    easy: {
      label: "New joiner",
      description: "A gentler week: more starting energy and kinder consequences.",
      start: { trust: 80, bandwidth: 85, quality: 80 },
      negativeMultiplier: 0.75,
      eventNegativeWeight: 0.6,
      eventPositiveWeight: 1.4,
      escalationTrust: 30,
      waitingPenalty: 4,
    },
    standard: {
      label: "Standard week",
      description: "A realistic week. Choices have clear, fair consequences.",
      start: { trust: 70, bandwidth: 75, quality: 75 },
      negativeMultiplier: 1.0,
      eventNegativeWeight: 1.0,
      eventPositiveWeight: 1.0,
      escalationTrust: 40,
      waitingPenalty: 7,
    },
    crunch: {
      label: "Crunch week",
      description: "Tight on every front. Mistakes cost more and luck is scarcer.",
      start: { trust: 60, bandwidth: 55, quality: 65 },
      negativeMultiplier: 1.25,
      eventNegativeWeight: 1.5,
      eventPositiveWeight: 0.6,
      escalationTrust: 50,
      waitingPenalty: 10,
    },
  },
  // Allowed impact ranges per tag (PRD section 5.3), checked by the content
  // linter. Assertive bandwidth is relaxed from the PRD's -5..-10 to -10..+5:
  // with -5 or worse on every assertive card, Master Negotiator (all meters
  // 60+) cannot be reached from the Standard start of 75 bandwidth. Trade-off
  // and repair cards that remove or defer work can restore a little capacity.
  impactRanges: {
    passive: { trust: [3, 8], bandwidth: [-35, -15], quality: [-20, -5] },
    aggressive: { trust: [-25, -15], bandwidth: [0, 5], quality: [0, 0] },
    assertive: { trust: [5, 15], bandwidth: [-10, 5], quality: [5, 15] },
    insight: { trust: [12, 18], bandwidth: [-5, -5], quality: [12, 18] },
  },
  limits: { message: 320, card: 220, coaching: 200, system: 120, insightTitle: 40 },
  thresholds: {
    healthy: 60, // 60 or above
    strained: 31, // 31 to 59; 30 or below is critical
    criticalIncidentQuality: 30,
    criticalIncidentTrustPenalty: -10,
    eventImpactCap: 10,
  },
};
