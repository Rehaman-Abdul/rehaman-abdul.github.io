# Content guide: adding or editing a role

All game text lives in `content/`. A role is one file in `content/roles/`. This guide covers the structure, the writing rules, the numbers that keep a role balanced, and the checks to run. For how the engine uses this data, see [ARCHITECTURE.md](ARCHITECTURE.md).

## The workflow

1. Copy the closest existing role file (`content/roles/finance.js` is a good model for a role with boundary moments, `tech.js` for one without) and rename every id with a new prefix.
2. Write the content. Keep the node structure and the impact pattern below.
3. Register the role:
   - add its id to `ROLE_IDS` in `content/roles/index.js`;
   - add its card to `content/roleCards.js` (title, teaser, an icon name from `js/ui/icons.js`, and three stakeholders whose names and titles match the role file);
   - if you add a new icon, add its paths to `js/ui/icons.js`.
4. Run the checks:

```bash
npm run lint:content
node tools/simulate.mjs --roles <id> --seeds 1
npm test
```

The linter must report zero errors, and the simulator must pass every Standard-week target. Some tests assume exactly eight roles (`tests/roles.test.js`); update them if you add a ninth.

## A role file

```js
export default {
  id: "finance",                         // must be in ROLE_IDS
  title: "Financial Analyst",
  qualityMeaning: "Accuracy and regulatory compliance",
  teaser: "Quarter-end is close, and everyone needs numbers yesterday.",
  stakeholders: {
    kwame: { name: "Kwame Boateng", title: "Department Head", presence: "available" }, // available | busy | away
    // ... at least three
  },
  insights: {
    fin_A: { title: "Audit flagged reclassifications", note: "One sentence." },       // title under 40 characters
    fin_B: { title: "Pipeline upside is supportable", note: "One sentence." },
  },
  beats: {
    mon: { start: "fin_mon_open", escalation: "fin_mon_escalation" },
    wed: { start: "fin_wed_open", escalation: "fin_wed_escalation",
           mondayFollowUp: { passive: "...", assertive: "...", aggressive: "..." } },
    fri: { start: "fin_fri_open", escalation: "fin_fri_escalation" },
  },
  criticalIncident: { text: "Compliance alert: ..." },   // shown once if Quality falls to 30 or below
  tips: { passive: "...", aggressive: "...", assertive: "..." },   // debrief tip, by dominant style
  nodes: { /* see below */ },
};
```

Exactly two insights are expected: one earned on Monday (id suffix `_B` by convention) and one on Wednesday (`_A`). Both must be granted by a card and used on Friday.

## Nodes

A role has 18 nodes. The names below are the convention used by every role, so a new role can be compared side by side with an existing one.

| Node | Purpose | Next |
|---|---|---|
| `<r>_mon_open` | Monday request. Cards: passive, aggressive, assertive `clarify` (grants the Monday insight). | `_mon_after_passive`, `_mon_after_aggressive`, `_mon_after_clarify` |
| `<r>_mon_after_clarify` | Reply that reveals the insight. Cards include an assertive `tradeoff`. | `$endBeat` |
| `<r>_mon_after_passive` | A follow-up request after over-committing. Includes an assertive `repair`. | `$endBeat` |
| `<r>_mon_after_aggressive` | A cool reaction to a blunt no. Includes an assertive `repair`. | `$endBeat` |
| `<r>_mon_escalation` | The requester's manager joins (`joins`). Includes an assertive `impact` reply. | `$endBeat` |
| `<r>_wed_open` | The role's signature dilemma. Usually `boundary: true`. | `_wed_after_*` |
| `<r>_wed_after_clarify`, `_after_passive`, `_after_aggressive` | As on Monday. | `$endBeat` |
| `<r>_wed_escalation` | The Wednesday requester's manager joins. | `$endBeat` |
| `<r>_wed_ping_passive`, `_ping_assertive`, `_ping_aggressive` | The Monday stakeholder's competing message, one per Monday outcome. | `$return` |
| `<r>_fri_open` | The executive request. Three base cards plus up to two insight cards. | `_fri_after_good`, `_fri_after_passive`, `_fri_after_aggressive` |
| `<r>_fri_after_good` | Short follow-up after a strong answer (including both insight cards). | `$endBeat` |
| `<r>_fri_after_passive`, `_fri_after_aggressive` | Consequences of caving or refusing bluntly. | `$endBeat` |
| `<r>_fri_escalation` | The executive's manager joins. | `$endBeat` |

A typical best path is 7 decisions (Monday 2, Wednesday triage plus 2, Friday 2). A run with escalations and follow-ups reaches 11.

### Cards

Every node has exactly one passive, one aggressive and one assertive base card, plus (on Friday's opening node only) up to two insight cards:

```js
{ id: "fin_mon_open_a", tag: "assertive", subtype: "clarify",
  text: "What the player says, in second person, up to 220 characters.",
  impact: { trust: 6, bandwidth: -5, quality: 6 },
  grantsInsight: "fin_B",                 // clarify cards on the Monday and Wednesday opening nodes
  next: "fin_mon_after_clarify",
  coaching: "Why this works or does not, up to 200 characters." }

{ id: "fin_mon_open_p", tag: "passive", text: "...", impact: { ... }, next: "...",
  coaching: "...",
  betterResponse: "An assertive rewrite in the player's voice." }       // required on passive and aggressive cards

{ id: "fin_fri_open_ins_A", tag: "assertive", subtype: "insight", requiresInsight: "fin_A",
  text: "...", impact: { trust: 16, bandwidth: -5, quality: 16 }, next: "...", coaching: "..." }
```

Card ids are global within a role and are what the debrief records. Never rely on position: the engine shuffles cards.

## The impact pattern

The numbers below are the pattern all eight roles use, so every new role starts balanced. Ranges per tag are enforced by the linter from `impactRanges` in `content/config.js`:

| Tag | Trust | Bandwidth | Quality |
|---|---|---|---|
| passive | +3 to +8 | −35 to −15 | −20 to −5 |
| aggressive | −25 to −15 | 0 to +5 | 0 |
| assertive | +5 to +15 | −10 to +5 | +5 to +15 |
| insight card | +12 to +18 | exactly −5 | +12 to +18 |

Bandwidth for assertive cards is wider than a naive reading of the design would suggest. Master Negotiator needs every meter at 60 or more, and the best path has seven decisions starting from 75 Bandwidth, so assertive cards cannot all cost 5 to 10. Trade-off cards that remove or defer work are written at **+2 or 0**, which is also realistic: dropping scope gives you capacity back.

The Bandwidth budget of the best path (Monday clarify −5, trade-off +2, holding message −3, Wednesday clarify or boundary −5, trade-off +2, Friday insight card −5, closing card 0) is −14. With the guaranteed Rested event the best path finishes near 60 even if the Monday event is a −10. If you change a number on that path, re-run the simulator.

Suggested values by node, from the existing roles:

| Node and card | Trust | Bandwidth | Quality |
|---|---|---|---|
| Monday open: passive / aggressive / clarify | +5 / −18 / +6 | −20 / 0 / −5 | −10 / 0 / +6 |
| Monday after clarify: tradeoff / passive / aggressive | +8 / +4 / −15 | +2 / −18 / 0 | +8 / −8 / 0 |
| After passive: passive / repair / aggressive | +3 / +5 / −15 | −15 / −3 / 0 | −6 / +8 / 0 |
| After aggressive: repair / passive / aggressive | +12 / +3 / −15 | −5 / −20 / 0 | +5 / −10 / 0 |
| Escalation: impact / passive / aggressive | +12 / +4 / −15 | −5 / −20 / 0 | +8 / −10 / 0 |
| Wednesday open: passive / aggressive / clarify or boundary | +5 / −20 / +6 | −15 / 0 / −5 | −18 / 0 / +10 |
| Friday open: passive / aggressive / tradeoff | +6 / −22 / +10 | −30 / 0 / 0 | −18 / 0 / +10 |
| Friday insight card A / B | +16 / +15 | −5 / −5 | +16 / +15 |
| Friday after good: tradeoff / passive / aggressive | +6 / +4 / −15 | 0 / −18 / 0 | +6 / −8 / 0 |

## Boundary nodes

Mark a node `boundary: true` when the request breaks policy, security, safety or ethics. In these nodes:

- the assertive card has subtype `boundary`: a firm, respectful refusal with a reason and an alternative path (the linter requires it);
- the **compromise card is the passive card** and its Quality impact is −15 to −20 (also required);
- on a Monday or Wednesday opening node, the boundary card may also be the card that earns the insight (ask the clarifying question inside the refusal);
- the debrief calls out how the player handled each boundary moment, and the "Held the line" achievement needs the assertive card at every boundary node of the role (so a role needs at least one).

## Writing rules

**Voice.** Second person, plain language, sentence case, a realistic workplace tone. Stakeholders sound like real people under pressure, not villains.

**Length limits (enforced by the linter).**

| Text | Limit |
|---|---|
| Stakeholder message | 320 characters (split a longer message into two bubbles) |
| Response card and `betterResponse` | 220 |
| `coaching`, insight note, tip | 200 |
| System line | 120 |
| Insight title | under 40 |

**Realism.**
- Passive and aggressive cards must be things a capable professional might say on a bad day. No cartoonish options.
- Assertive cards must be specific: name the trade-off, the date or the deliverable. Generic advice is not an option.
- Opening messages for Wednesday and Friday need at least one `variants` entry that reacts to state (`overcommitGte`, `trustLt`, or a Monday outcome), so stakeholders feel like they remember.

**Fiction only.** Companies, products, clients and people are fictional. Never name a real brand; the linter checks a banned list (capitalized, so ordinary words like "slack" and "teams" are fine). Use a diverse, international set of names with no stereotypes tied to role, gender, age or culture, and avoid pronouns for stakeholders where you can.

**Domain accuracy.** Reflect how the work really happens, and describe policy in general terms ("company policy", "accounting rules") rather than making specific legal claims.

**Emoji.** At most one per stakeholder message, only where a real person would use one. Never in cards, coaching or system lines.

**Coaching.** Say why a response works or does not. Coaching appears only in the debrief, never in the chat.

**Tokens.** `{name}` and `{name|fallback}` for the player's name (always give a fallback in a greeting: `Hi {name|there}`), `{role}` for the role title.

**Differences from the brief.** The Wednesday requester should be a different person from the Monday stakeholder, so the triage involves two people. If the requester in the brief is the same person (HR was), use someone close to them, such as their director.

## Checklist before you open a pull request

- [ ] `npm run lint:content` reports zero errors.
- [ ] `node tools/simulate.mjs --roles <id> --seeds 3` passes every target, with no unreachable nodes.
- [ ] `npm test` passes.
- [ ] The role card's title, teaser and three stakeholders match the role file.
- [ ] Each passive and aggressive card has a plausible `betterResponse`.
- [ ] You played the role once by keyboard, and once with the best path, to read it as a player would.
