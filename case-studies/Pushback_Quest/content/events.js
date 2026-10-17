// Random workplace event pool (PRD section 5.9). Impacts are capped at 10 per
// meter. Role-specific variants can be added later through `roleText`.
// `rested` is only used as the guaranteed case in PRD section 5.7 (weight 0).

// Delayed consequences (PRD section 5.7). They replace the random event at the
// Wednesday to Friday transition, highest overcommit threshold first. They are
// not subject to the random-event impact cap.
export const delayed = [
  { id: "running_on_empty", minOvercommit: 3, polarity: "negative", title: "Running on empty", text: "Late nights all week catch up with you. You start Friday exhausted and it shows in your work.", impact: { bandwidth: -25, quality: -10 } },
  { id: "long_week", minOvercommit: 2, polarity: "negative", title: "Long week", text: "The extra hours start to show. Friday begins with less energy than you'd like.", impact: { bandwidth: -15 } },
];

// Optional per-role wording: `roleText: { <roleId>: "..." }` replaces `text` for that role.
export default [
  { id: "teammate_sick", polarity: "negative", title: "A teammate is out", text: "A teammate is out sick, and two of their urgent tasks land in your queue.", impact: { bandwidth: -10 }, when: null, weight: 3 },
  { id: "meeting_cancelled", polarity: "positive", title: "A free hour", text: "A recurring meeting got cancelled, freeing up an hour.", impact: { bandwidth: 8 }, when: null, weight: 3 },
  { id: "client_praise", polarity: "positive", title: "A good word", text: "A stakeholder praised your work to your manager.", impact: { trust: 6 }, when: { trustGte: 50 }, weight: 2 },
  { id: "forced_update", polarity: "negative", title: "Forced update", text: "A forced laptop update eats your morning.", roleText: { tech: "A forced laptop update eats your morning and breaks your local build." }, impact: { bandwidth: -5 }, when: null, weight: 2 },
  { id: "missed_email", polarity: "negative", title: "Missed email", text: "You missed an important email in the noise.", impact: { trust: -6 }, when: { bandwidthLt: 40 }, weight: 3 },
  { id: "colleague_help", polarity: "positive", title: "A helping hand", text: "A colleague offers to take a task off your plate.", impact: { bandwidth: 6 }, when: { trustGte: 60 }, weight: 2 },
  { id: "status_request", polarity: "negative", title: "Status update", text: "Your manager wants a written status update by noon.", impact: { bandwidth: -5 }, when: null, weight: 2 },
  { id: "late_night", polarity: "negative", title: "Late night", text: "You were online late answering messages.", impact: { bandwidth: -8 }, when: { overcommitGte: 1 }, weight: 3 },
  { id: "tool_outage", polarity: "negative", title: "Tool outage", text: "A shared tool is down for two hours.", impact: { quality: -5 }, when: null, weight: 2 },
  { id: "kudos_post", polarity: "positive", title: "Shout-out", text: "Your team gave you a shout-out in the team channel.", impact: { trust: 4 }, when: null, weight: 2 },
  { id: "focus_block", polarity: "positive", title: "Focus block", text: "You protected a two-hour focus block and it paid off.", impact: { quality: 6 }, when: { overcommitEq: 0 }, weight: 2 },
  { id: "rested", polarity: "positive", title: "Rested and ready", text: "You slept well and start the day rested and ready.", impact: { bandwidth: 10 }, when: null, weight: 0 },
];
