# PRD: Pushback Quest

**Subtitle:** Navigating work demands without burning out
**Document type:** Product Requirements Document for implementation by Claude Code
**Target platform:** Static website hosted on GitHub Pages
**Status:** Ready for build (full build, all eight roles)

---

## 0. How to use this document (for Claude Code)

This PRD is the single source of truth. Build the complete project described here, following the phased plan in section 14. Where this document gives exact values (meter numbers, thresholds, schema fields), use them exactly. Where it gives briefs (scenario outlines per role), write the full content yourself following the content guidelines in section 9 and the worked example in section 10.

Hard constraints that apply everywhere:

- Vanilla HTML, CSS and JavaScript (ES modules). No frameworks, no bundler, no build step, no npm runtime dependencies.
- No backend, no AI or LLM features, no analytics, no tracking, no cookies.
- The interface is inspired by modern workplace chat apps but must not copy Microsoft Teams, Slack, or any real product's branding, logos, colors, icons or distinctive interface details.
- All paths relative, so the site works when served from a GitHub Pages project subpath (for example `/pushback-quest/`).

---

## 1. Product overview

### 1.1 Problem

Professionals often receive unrealistic or high-pressure requests from managers, peers, clients and executives. Because of power dynamics, they usually respond in one of two weak ways:

- **Passive compliance:** saying yes to everything, which leads to burnout, missed deadlines, lower quality and quiet resentment.
- **Aggressive refusal:** rejecting requests bluntly without alternatives, which damages trust and relationships.

### 1.2 Solution

A browser game in which the player lives through one high-pressure work week inside a fictional workplace chat app. They choose a professional role, receive realistic requests from stakeholders, and pick how to respond. Three meters (Trust, Bandwidth, Quality) react to every decision, and consequences of earlier choices surface later in the week.

### 1.3 Learning objective

Players practice **Assertive Alignment**: negotiating scope, timeline and resource trade-offs while keeping stakeholder trust and protecting their own capacity and work quality. Assertive Alignment is the project's own label for a synthesis of established assertiveness and negotiation practices. It has four techniques the game teaches:

1. **Trade-off framing:** "I can do X. To keep the date, should we drop Y or move Z?"
2. **Clarify before committing:** ask questions that reveal real effort, dependencies and priorities.
3. **Impact-first language:** explain pushback in terms of business risk, not personal inconvenience.
4. **Firm boundaries:** when a request breaks policy, security, safety or ethics, a respectful "no" with a reason and an alternative path is the right answer. Compromise is not always correct.

### 1.4 Audience

Anyone visiting the creator's portfolio: hiring managers in learning and development, developers, recruiters and general visitors. Design implications:

- A visitor must understand the idea and start playing within about 10 seconds, without reading instructions.
- A full playthrough takes 5 to 8 minutes.
- Depth (instructional design rationale, architecture) lives in the docs, not in the game.

### 1.5 Success criteria

- All eight roles are fully playable from start to debrief.
- Every ending is reachable in every role (verified by the simulator in section 12).
- Lighthouse scores of 95 or higher for Performance, Accessibility, Best Practices and SEO.
- WCAG 2.2 AA conformance.
- Works in the latest two versions of Chrome, Edge, Firefox and Safari, on desktop and mobile.

---

## 2. Scope

### 2.1 In scope

- Start screen with role selection (8 roles), optional first name, difficulty selection, and an achievements panel.
- One simulated work week per playthrough: Monday, Wednesday and Friday beats.
- Three meters with role-specific meaning.
- Mechanics: hybrid content structure, random workplace events, shuffled card order, information as a resource (insights), escalation chains, competing messages, delayed consequences, achievements, three difficulty levels.
- State-computed endings and a role-aware debrief.
- Original, Teams-inspired chat interface in light and dark themes.
- Automated tests, a path simulator, a content linter, GitHub Actions CI and Pages deployment.
- README and design rationale documentation.

### 2.2 Out of scope

- AI agents, LLMs or free-text input.
- Accounts, backend, leaderboards, analytics.
- Countdown timers (deliberately excluded for accessibility).
- Sound and music.
- Localization (English only, but keep all strings in content files so localization is possible later).

---

## 3. Player experience flow

```
Start screen
  ├─ Choose role (8 role cards)
  ├─ Enter first name (optional)
  ├─ Choose difficulty (New joiner / Standard week / Crunch week)
  └─ Start the week
        │
Monday: shared beat (scope creep)
        │   possible escalation
        ▼
Day transition: random event
        │
Wednesday: role signature beat
        │   competing message (triage) from Monday's stakeholder
        │   possible escalation
        ▼
Day transition: random event, or delayed consequence event
        │
Friday: shared beat (executive escalation)
        │   insight cards unlocked if earned
        │   possible escalation
        ▼
Debrief: rank, meters, choice breakdown, key moments, role tip, achievements
        │
Play again (same role / new role / new difficulty)
```

Failure can end the week early (see section 5.7). The debrief still appears.

---

## 4. Roles

### 4.1 Role list and meter meaning

Meters are identical in every role. Only the description of Quality changes, shown in the meter tooltip and in the debrief.

| Role ID | Player title | Quality means |
|---|---|---|
| `hr` | HR Business Partner | Compliance and employee experience |
| `tech` | Software Engineer | Code stability and system reliability |
| `sales` | Account Executive | Deal health and credibility with clients |
| `marketing` | Marketing Specialist | Brand consistency and campaign effectiveness |
| `ops` | Operations Coordinator | Process accuracy and safety |
| `servicedesk` | Service Desk Analyst | Security and resolution quality |
| `support` | Customer Support Specialist | Customer outcomes and satisfaction |
| `finance` | Financial Analyst | Accuracy and regulatory compliance |

### 4.2 Role cards (start screen)

Each card shows: role title, a simple original SVG icon, a one-line "your week" teaser, and the names and titles of the three main stakeholders. Teasers hint at tension without revealing dilemmas. Examples:

- Finance: "Quarter-end is close, and everyone needs numbers yesterday."
- Service Desk: "Your queue is full, and everyone thinks they're the priority."

Write teasers for all eight roles in the same spirit.

### 4.3 Role briefs

Each role needs: a Monday shared beat, a Wednesday signature beat, a Friday shared beat, two possible insights, a competing-message follow-up from the Monday stakeholder, and one escalation character per beat (the requester's manager). Full content is written by Claude Code following sections 9 and 10. Company names must be fictional.

"Boundary" marks a non-negotiable boundary node (section 5.5).

#### Human Resources (`hr`)

- **Monday (scope creep):** Engineering Manager keeps changing a job description after it is posted (new requirements, different level). Re-posting resets the candidate pipeline.
- **Wednesday (signature, Boundary):** The same manager asks the player to "just send the offer letter today," before compensation approval, to beat a competing offer. Assertive path: decline to send an unapproved offer, offer to expedite the approval today, and suggest a call expressing strong interest without numbers.
- **Friday (executive):** VP of People asks for a reorganization announcement plus a full FAQ for 120 employees, drafted over the weekend for Monday's all-hands. Assertive path: core announcement and manager talking points by Monday, full FAQ by Wednesday.
- **Insight A** (clarify on Wednesday): Legal reviews all reorganization communications with a 48-hour turnaround. Friday card: a weekend draft cannot go out Monday anyway, so align on a realistic plan.
- **Insight B** (clarify on Monday): The hiring manager's own team is affected by the reorg and he hasn't been briefed. Friday card: announcing Monday risks managers learning about it with their teams.

#### Technology (`tech`)

- **Monday (scope creep):** Product Manager adds a dynamic video module to the launch page mid-sprint without moving the Tuesday launch date.
- **Wednesday (signature, dependency):** Tech Lead asks for a "5-minute" rename of `customer_id` to `account_id` in an API. Hidden dependencies: the billing export and the mobile app read the same endpoint. Clarifying reveals this. Accepting blindly triggers a broken build.
- **Friday (executive):** Director of Product at 4:30 PM: the client needs a custom reporting dashboard for a Monday 9 AM demo; build it over the weekend. Assertive path: a clickable mock with sample data for Monday, live version Wednesday after QA.
- **Insight A** (clarify on Wednesday): The billing export reads the same endpoint the dashboard would use. Friday card: building against it over the weekend risks billing, so demo with a mock.
- **Insight B** (clarify on Monday): The Product Manager mentions the client only cares about three usage views. Friday card: build just those three views as the demo.

#### Sales (`sales`)

- **Monday (scope creep):** In a shared channel with a client, the client's champion keeps adding requirements to the proposal.
- **Wednesday (signature, Boundary):** Sales Manager asks the player to "just tell them" an unreleased integration will ship next month to close the deal. Assertive path: decline to promise unreleased roadmap items and offer a call with the product team under the standard roadmap disclosure process.
- **Friday (executive):** Regional Sales Director wants a 25% discount (policy maximum is 15%) sent to the client tonight to close the quarter. Assertive path: submit a deal desk exception with a business case, or trade discount for multi-year terms.
- **Insight A** (clarify on Wednesday): The deal desk approves exceptions within two hours when tied to multi-year terms. Friday card uses it.
- **Insight B** (clarify on Monday): The client's real priority is onboarding speed, not price. Friday card: offer an accelerated onboarding package instead of a deeper discount.

#### Marketing (`marketing`)

- **Monday (scope creep):** Product Marketing Manager keeps adding assets to a launch (extra social sizes, a new video cut).
- **Wednesday (signature, Boundary):** Head of Growth wants to change an approved headline to "fastest on the market" after legal review. Assertive path: unsubstantiated claims can't go out; use the approved claim now and submit the new one for the next wave.
- **Friday (executive):** VP of Marketing wants the campaign live on Saturday, skipping final approvals, because a competitor just launched. Assertive path: launch the already-approved assets Saturday and hold new pieces until Monday's review.
- **Insight A** (clarify on Wednesday): Legal offers same-day review for submissions before noon. Friday card uses it.
- **Insight B** (clarify on Monday): Only the paid social assets were top performers last quarter. Friday card: launch paid social first.

#### Operations (`ops`)

- **Monday (scope creep):** An account manager changes order quantities after the production plan is locked.
- **Wednesday (signature, Boundary):** Procurement Manager wants to use a cheaper, unqualified supplier for a component "just this once." Assertive path: decline unqualified parts, offer to expedite a qualification sample or split the order.
- **Friday (executive):** Head of Operations wants a large order shipped a day early, skipping the final QA check, because the client called. Assertive path: keep QA, add a second inspection shift, ship a QA-complete partial order early.
- **Insight A** (clarify on Wednesday): The last unqualified supplier batch had an 8% defect rate. Friday card uses it.
- **Insight B** (clarify on Monday): The client's receiving dock is closed until Monday 7 AM. Friday card: a Sunday-night QA-complete shipment arrives at the same time as an early, unchecked one.

#### Service Desk (`servicedesk`)

- **Monday (scope creep):** An office manager's single laptop-setup ticket grows into five requests.
- **Wednesday (signature, Boundary):** A senior employee asks for "temporary" local admin rights. Assertive path: decline per policy, offer to install the specific software through the approved catalog or start the privileged-access approval workflow.
- **Friday (executive):** During a company-wide email outage, the COO demands her laptop be fixed first, jumping the incident queue. Assertive path: acknowledge, explain incident priority, give an ETA, offer a workaround.
- **Insight A** (clarify on Monday): Webmail on phones still works during this kind of outage. Friday card: offer it as an immediate workaround.
- **Insight B** (clarify on Wednesday): An executive support line is staffed during major incidents. Friday card: route the COO there with a named contact.

#### Customer Support (`support`)

- **Monday (scope creep):** An account manager keeps adding a client's unrelated issues to one escalation ticket.
- **Wednesday (signature, Boundary):** Team Lead wants a 40-ticket backlog cleared by end of day, implying closing tickets without real resolution. Assertive path: decline to close unresolved tickets, triage by severity, batch-respond to known-issue tickets, ask for temporary help.
- **Friday (executive):** Customer Success Director relays a key account's demand for a full refund outside policy, answer needed tonight. Assertive path: offer a service credit within the player's authority and escalate the refund exception with a case on Monday.
- **Insight A** (clarify on Wednesday): Twelve backlog tickets share one known bug with a fix shipping Monday, and it caused the key account's outage. Friday card: offer a credit and confirm the fix date.
- **Insight B** (clarify on Monday): The client's contract includes SLA credits of up to 10%. Friday card uses it.

#### Finance (`finance`)

- **Monday (scope creep):** A department head keeps revising budget model inputs.
- **Wednesday (signature, Boundary):** An operations director asks for a "quick" reclassification of a $40,000 expense from operating to capital to stay under budget. Assertive path: decline to reclassify without the controller's review against accounting policy, offer to review it together.
- **Friday (executive, Boundary):** The CFO asks for forecast assumptions to be adjusted "to look better" before Monday's board meeting. Assertive path: present the base case plus a clearly labeled upside scenario with stated assumptions; never alter actuals.
- **Insight A** (clarify on Wednesday): Last year's audit flagged reclassifications. Friday card uses it.
- **Insight B** (clarify on Monday): The department head's revised pipeline data shows a real, supportable upside. Friday card: build the upside scenario on that data.

---

## 5. Game mechanics

### 5.1 Meters

| Meter | Key | Meaning | Range |
|---|---|---|---|
| Stakeholder Trust | `trust` | Rapport and confidence in the player's reliability | 0 to 100 |
| Bandwidth | `bandwidth` | Personal capacity and energy | 0 to 100 |
| Quality | `quality` | Standard of work (role-specific meaning) | 0 to 100 |

Values are clamped to 0 to 100 after every change. The UI shows each meter as a bar with a numeric value and a text status (Healthy 60 or above, Strained 31 to 59, Critical 30 or below). Color is never the only signal.

### 5.2 Starting values by difficulty

| Difficulty | ID | Trust | Bandwidth | Quality | Negative impact multiplier |
|---|---|---|---|---|---|
| New joiner | `easy` | 80 | 85 | 80 | 0.75 |
| Standard week | `standard` | 70 | 75 | 75 | 1.0 |
| Crunch week | `crunch` | 60 | 55 | 65 | 1.25 |

The negative impact multiplier applies to every negative meter change (choices and events). Round results to the nearest integer.

Other difficulty settings:

| Setting | easy | standard | crunch |
|---|---|---|---|
| Negative event weight multiplier | 0.6 | 1.0 | 1.5 |
| Positive event weight multiplier | 1.4 | 1.0 | 0.6 |
| Escalation trust threshold | 30 | 40 | 50 |
| Competing message waiting penalty (trust) | -4 | -7 | -10 |

### 5.3 Choice tags and impact ranges

Every response card has exactly one tag. The debrief tally counts these three tags.

| Tag | Meaning | Trust | Bandwidth | Quality |
|---|---|---|---|---|
| `passive` | Over-commits or caves | +3 to +8 | -15 to -35 | -5 to -20 |
| `aggressive` | Refuses bluntly, blames, no alternative | -15 to -25 | 0 to +5 | 0 |
| `assertive` | Trade-off, clarify, impact-first, or firm boundary with alternative | +5 to +15 | -5 to -10 | +5 to +15 |

Cards may also carry an optional `subtype` for debrief coaching and achievements: `clarify`, `tradeoff`, `impact`, `boundary`, `insight`, `holding` (triage holding message), `repair` (recovering after a mistake).

Rules:

- Every passive choice increments the hidden `overcommit` counter by 1.
- Every choice node offers exactly three base cards: one passive, one aggressive, one assertive. Insight cards are added as a fourth card when unlocked (section 5.4).
- In every role, at least the Monday and Wednesday opening nodes include an assertive card with subtype `clarify` that earns an insight. A node may have two assertive cards (for example `clarify` and `tradeoff`) in place of a third type only if the debrief tally still works; prefer one of each tag.
- Passive and aggressive cards must sound like something a reasonable person might actually say. No cartoonish options.

### 5.4 Information as a resource (insights)

- Each role defines two insights (A and B), each with an `id`, short `title` (under 40 characters) and one-sentence `note`.
- Choosing a card with `grantsInsight` adds that insight to the player's notes.
- Earned insights appear in a "Notes" panel in the interface, styled as pinned notes, with a subtle confirmation when one is added ("Saved to your notes").
- On Friday's opening node, each earned insight unlocks its own extra card (`requiresInsight`). Show at most two insight cards. They are tagged `assertive`, subtype `insight`, are visually marked with a small "Uses your note" label naming the insight, and have the strongest impact in the game (trust +12 to +18, bandwidth -5, quality +12 to +18).
- Insight cards are shuffled with the other cards like any card.

### 5.5 Non-negotiable boundary nodes

Nodes marked `boundary: true` involve policy, security, safety or ethics. In these nodes:

- The assertive card is a firm, respectful refusal with a reason and an alternative path (subtype `boundary`).
- The compromise card that bends the rule is tagged `passive` (quality -15 to -20) and its coaching explains why compromise was wrong here.
- The debrief explicitly calls out boundary moments.

### 5.6 Escalation chains

- When a beat reaches its end (`$endBeat`), check: if the player made any `aggressive` choice in that beat, or trust is below the difficulty's escalation threshold, play the beat's escalation node before the beat ends.
- The escalation node introduces the requester's manager, who joins the thread with a system line ("Jordan Lee was added to the conversation"). Its opening message uses variants to reflect why they joined (a blunt refusal vs. general loss of confidence).
- The escalation node offers the usual three cards. A strong assertive reply (subtype `repair` or `impact`) recovers trust (+10 to +15). All its cards lead to `$endBeat`.
- Maximum one escalation per beat. Passive choices never trigger escalation directly, but they often lead to follow-up requests written into the branch.

### 5.7 Delayed consequences and failure states

Checked after every meter change:

- **Bandwidth reaches 0:** the week ends immediately with the Burnout ending.
- **Trust reaches 0:** the week ends immediately with the Lost Trust ending.
- **Quality drops to 30 or below (first time only):** insert a "critical incident" event in the current thread (role-specific text, for example a production bug, a compliance finding, a customer complaint). Apply trust -10 and set flag `criticalIncident`.

At the Wednesday to Friday transition, the delayed consequence event replaces the random event if `overcommit` is 2 or more:

| overcommit | Event | Impact |
|---|---|---|
| 3 or more | "Running on empty": late nights all week catch up | bandwidth -25, quality -10 |
| 2 | "Long week": the extra hours start to show | bandwidth -15 |
| 0 or 1 | No consequence event; a normal random event fires. If overcommit is 0, guarantee the positive event "Rested and ready" (bandwidth +10). | |

### 5.8 Competing messages (Wednesday triage)

- On Wednesday, after the signature beat's opening message is delivered, the Monday stakeholder's chat shows an unread badge and a new message preview. Its content depends on Monday's outcome: a new add-on request (Monday passive), a friendly check-in (Monday assertive) or a cool, short message (Monday aggressive).
- A triage node asks the player who to answer first, with three cards:
  1. Answer the Wednesday stakeholder first: the Monday stakeholder waits (apply the difficulty's waiting penalty).
  2. Answer the Monday stakeholder first: the Wednesday stakeholder waits (same penalty), and the Monday follow-up exchange plays first.
  3. Send a quick holding message to the Monday stakeholder ("Saw this, I'll get back to you by 4 PM"), then continue: no trust penalty, bandwidth -3. Tag `assertive`, subtype `holding`.
- Options 1 and 2 are tagged `assertive` but with no trust bonus; the debrief coaching notes the holding message as the strongest triage move.
- The Monday follow-up is a single short exchange (one choice node) that returns to the Wednesday flow.

### 5.9 Random workplace events

- One event fires at each day transition (Monday to Wednesday, Wednesday to Friday), except where the delayed consequence replaces it.
- Events are drawn from a weighted pool using the seeded random generator. Difficulty multipliers adjust weights by polarity. Events with unmet conditions are excluded. The same event cannot fire twice in a run.
- Each event's impact is capped at an absolute value of 10 per meter.
- Events appear in a day-transition card (see section 7.6) and as a system message at the top of that day's thread.
- Event text may include role-specific variants; otherwise use the shared text.

Event pool (shared; Claude Code may add role variants):

| ID | Polarity | Text (paraphrase, refine in writing) | Impact | Condition | Weight |
|---|---|---|---|---|---|
| `teammate_sick` | negative | A teammate is out sick; two of their urgent tasks land in your queue | bandwidth -10 | none | 3 |
| `meeting_cancelled` | positive | A recurring meeting got cancelled, freeing up an hour | bandwidth +8 | none | 3 |
| `client_praise` | positive | A stakeholder praised your work to your manager | trust +6 | trust ≥ 50 | 2 |
| `forced_update` | negative | A forced laptop update eats your morning | bandwidth -5 | none | 2 |
| `missed_email` | negative | You missed an important email in the noise | trust -6 | bandwidth < 40 | 3 |
| `colleague_help` | positive | A colleague offers to take a task off your plate | bandwidth +6 | trust ≥ 60 | 2 |
| `status_request` | negative | Your manager wants a written status update by noon | bandwidth -5 | none | 2 |
| `late_night` | negative | You were online late answering messages | bandwidth -8 | overcommit ≥ 1 | 3 |
| `tool_outage` | negative | A shared tool is down for two hours | quality -5 | none | 2 |
| `kudos_post` | positive | Your team gave you a shout-out in the team channel | trust +4 | none | 2 |
| `focus_block` | positive | You protected a two-hour focus block | quality +6 | overcommit = 0 | 2 |
| `rested` | positive | Rested and ready (guaranteed case only, section 5.7) | bandwidth +10 | special | 0 |

### 5.10 Shuffled card order

- Cards are shuffled with Fisher-Yates using the seeded random generator every time a choice node renders.
- Choices are always recorded by `id`, never by position.
- DOM order equals visual order, so screen readers read cards as displayed.

### 5.11 Seeded randomness

- Use a small seeded PRNG (for example mulberry32). The seed is generated at run start from the current time.
- If the URL contains `?seed=<number>`, use it. This exists for debugging and for the simulator.
- Show the seed in small text in the debrief ("Run #48213") so a run can be reproduced.

### 5.12 Text tokens

- `{name}` is replaced with the player's first name. If no name was given, use a natural fallback defined per message via `{name|there}` syntax (for example "Hey {name|there}" becomes "Hey there").
- The name field is optional, trimmed, limited to 24 characters, and only letters, spaces, hyphens and apostrophes are accepted. It is inserted with `textContent` only, never as HTML.
- All game text is written in second person. No pronoun selection exists.

---

## 6. Endings and debrief

### 6.1 Endings (evaluated in this order; first match wins)

| ID | Title | Condition |
|---|---|---|
| `burnout` | Burnout Casualty | Bandwidth reached 0 at any point |
| `lost_trust` | The Wall | Trust reached 0 at any point, or final trust below 35 |
| `master` | Master Negotiator | All final meters 60 or above, and at least 60% of choices assertive |
| `quiet_fixer` | Quiet Fixer | Final trust 60 or above, and bandwidth below 40 or quality below 50 |
| `steady` | Steady Professional | All final meters 45 or above |
| `fumes` | Running on Fumes | Anything else |

Each ending has a title, a two-sentence description written in second person, and a one-line key lesson. Endings are shared across roles, but the description may mention the role title via a `{role}` token.

### 6.2 Debrief contents

1. **Rank reveal:** ending title and description (the game's one signature animated moment, section 7.8).
2. **Final meters** with start-to-end change.
3. **Choice breakdown:** count of passive, aggressive and assertive choices, shown as a simple horizontal bar with text labels.
4. **Your strongest moment:** the assertive choice with the highest combined positive impact, with its coaching text.
5. **The decision that cost you most:** the choice with the largest combined negative impact, with an assertive rewrite (each passive and aggressive card has a `betterResponse` field).
6. **Boundary moments:** if the role had boundary nodes, show how the player handled each.
7. **Role tip:** one actionable tip specific to the role, chosen by the player's dominant tag (each role defines three tips: for mostly passive, mostly aggressive, mostly assertive players).
8. **Achievements unlocked this run.**
9. **Actions:** "Play again as {role}", "Try another role", "Change difficulty".
10. Run seed in small text.

---

## 7. Interface and visual design

### 7.1 Concept

The game runs inside a fictional workplace chat app. The layout is familiar (rail, chat list, thread), so the player instantly understands it, but every visual detail is original.

- **Fictional app name:** use a working name such as "Threadline." Before finalizing, avoid any name that matches a well-known real product. The app has its own simple geometric logo mark drawn in SVG.
- **Do not use:** Microsoft Teams purple, Slack aubergine, either product's icons, logo shapes, layout signatures or wording ("huddle", "channels" styled like Slack). Use generic terms: "Chats", "Activity", "Calendar".

### 7.2 Design tokens

Define all colors as CSS custom properties on `:root`, with dark values under `@media (prefers-color-scheme: dark)`, plus a manual theme toggle using `data-theme="light" | "dark"` on the root element (the toggle overrides the system setting and is remembered in localStorage).

Suggested palette (refine for contrast; all text must meet WCAG AA):

| Token | Light | Dark | Use |
|---|---|---|---|
| `--rail` | #1E3448 | #0F1C27 | App rail background |
| `--surface` | #F6F7F9 | #16212B | App background |
| `--panel` | #FFFFFF | #1D2A36 | Thread, cards |
| `--text` | #1A2430 | #E6ECF1 | Primary text |
| `--text-muted` | #5B6B7A | #9AAAB8 | Secondary text |
| `--accent` | #1F7A6B | #4FB8A5 | Player messages, primary buttons, focus ring |
| `--warn` | #B7791F | #E3A94A | Strained meter status |
| `--danger` | #B83A33 | #E5736B | Critical meter status, incidents |
| `--insight` | #6B5BB5 | #A99BEA | Notes and insight cards |

### 7.3 Typography

- Primary UI and body: **Atkinson Hyperlegible** (Google Fonts), chosen for legibility and accessibility. Fallback: `system-ui, -apple-system, "Segoe UI", sans-serif`.
- Display (game title, rank reveal, day transition titles): **Bricolage Grotesque** (Google Fonts), fallback to the primary stack.
- Type scale based on a 1.25 ratio from a 16px base. Message text 15 to 16px with line height 1.5. Sentence case everywhere. No all-caps labels.
- Line length of message bubbles capped around 65 characters.

### 7.4 Desktop layout (1024px and wider)

```
┌──────┬──────────────────┬──────────────────────────────────────────────┐
│ Rail │ Chats            │ Thread header: stakeholder, title, presence  │
│      │ ┌──────────────┐ │──────────────────────────────────────────────│
│ logo │ │ Priya  (2)   │ │ Meters: Trust ▓▓▓▓░ 72  Bandwidth ▓▓▓░ 58 …  │
│      │ │ Marcus       │ │ Day/time: Wed, 2:14 PM        [Notes (1)]    │
│ chat │ │ Sarah  busy  │ │──────────────────────────────────────────────│
│ act. │ └──────────────┘ │  messages, system lines, typing indicator    │
│ cal. │                  │                                              │
│      │                  │──────────────────────────────────────────────│
│ ⚙    │                  │  Response cards (2×2 grid or stacked)        │
└──────┴──────────────────┴──────────────────────────────────────────────┘
```

The Notes panel opens as a side panel on the right on desktop.

### 7.5 Mobile layout (below 720px)

- The rail and chat list collapse; a top bar shows the app mark, current stakeholder, and a button opening the chat list as a drawer.
- Meters compress into a single row of three compact bars with numbers; tapping opens a sheet with full descriptions.
- Response cards stack vertically and fill the width.
- Notes open as a bottom sheet.
- Respect safe-area insets (`viewport-fit=cover`, `env(safe-area-inset-*)`).

### 7.6 Components

- **Start screen:** game title ("Pushback Quest") with the subtitle "Navigating work demands without burning out," a one-line playful premise that connects the quest framing to the realistic workplace setting (for example "Your quest: survive one week without burning out or burning bridges."), role grid (8 cards, 4×2 desktop, 2 columns tablet, 1 column mobile), name field, difficulty segmented control with one-line descriptions, "Start the week" button, achievements panel (unlocked and locked states), theme toggle. A visitor must be able to start with one click by picking a role (name and difficulty have defaults: blank and Standard).
- **Chat list:** avatars, names, last-message preview, unread badges, presence dots (available, busy, away) with text alternatives.
- **Avatars:** initials on a colored circle, generated from the name. No photos.
- **Thread:** stakeholder messages (left), player messages (right, accent color), system lines (centered, muted: events, people joining, day starts), timestamps, typing indicator shown 600 to 1200ms before each stakeholder message (proportional to message length, skipped under reduced motion).
- **Response cards:** large, button-based, full text visible, keyboard focusable, with a visible focus ring. On selection, the chosen text appears as a sent player message and the other cards are removed.
- **Meter bar:** three meters, each with label, bar, number and status text. On change, the bar animates (0.4s) and a delta chip ("+8", "-15") appears briefly beside it.
- **Notes panel:** pinned insight notes with title and one-line note.
- **Day transition card:** a full-thread overlay showing the day name in the display face, the time, and the event text with its meter effect, plus "Continue".
- **Debrief screen:** section 6.2.
- **Settings:** theme toggle, reduced motion override, reset achievements (with confirmation).

### 7.7 Icons

All icons are original inline SVG with `aria-hidden="true"` where decorative and accessible labels on their buttons. No icon fonts, no external icon libraries.

### 7.8 Motion

- One signature moment: the debrief rank reveal (title builds in, meters settle to final values).
- Responsive motion only otherwise: typing indicator, meter changes, card selection, panels opening.
- No entrance animations on every element, no hover animations on every card.
- `prefers-reduced-motion: reduce` disables all non-essential animation and typing delays. A settings toggle allows the same.

---

## 8. Accessibility requirements (WCAG 2.2 AA)

- Full keyboard play: Tab and Shift+Tab move through cards; Enter or Space selects; Escape closes panels and drawers. Number keys 1 to 4 select the corresponding visible card (shown as a small hint).
- Visible focus indicator on all interactive elements (3:1 contrast against adjacent colors).
- New messages are announced through an `aria-live="polite"` region; events and failure states through `aria-live="assertive"` sparingly.
- Meters use `role="meter"` (or `progressbar` fallback) with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and `aria-valuetext` (for example "72, healthy").
- After a choice, focus moves to the first new response card or, when the stakeholder is typing, to a stable point so keyboard users are not lost.
- Touch targets at least 44 by 44 pixels.
- Text resizes to 200% without loss of content or horizontal page scrolling.
- `lang="en"`, semantic landmarks (`header`, `nav`, `main`), headings in order.
- Color is never the only means of conveying information.

---

## 9. Content writing guidelines

- **Voice:** second person ("you"), plain language, sentence case, realistic workplace tone. Stakeholders sound like real people under pressure, not villains.
- **Length:** stakeholder messages up to 320 characters; response cards up to 220 characters; coaching text up to 200 characters; system lines up to 120 characters. Split long stakeholder messages into two consecutive bubbles rather than one long one.
- **Realism:** passive and aggressive cards must be plausible things a capable professional might say on a bad day. Assertive cards must be specific (name the trade-off, the date, the deliverable), not generic advice.
- **Names and diversity:** use a diverse, international set of first and last names across roles. No stereotypes tied to role, gender, age or culture. Stakeholders are not defined by pronouns in the text where avoidable.
- **Fiction only:** all companies, products, clients and people are fictional. Never mention real brands (for example Microsoft, Teams, Slack, Zoom, Google, Salesforce, Jira). The content linter enforces a banned-terms list.
- **Domain accuracy:** role scenarios must reflect how the work really happens (for example, offer approvals in HR, revenue recognition and audit in Finance, least-privilege access in IT). Avoid specific legal claims; describe policy in general terms ("company policy," "accounting rules").
- **Emoji:** at most one per stakeholder message, and only where a real person would use one. Never in system lines or cards.
- **Coaching text:** every card has `coaching` (why this response works or doesn't). Every passive and aggressive card also has `betterResponse` (an assertive rewrite in the player's voice).
- **Tone variants:** opening messages of Wednesday and Friday beats include at least one variant reacting to state (low trust, high overcommit, or a Monday outcome) so stakeholders feel like they remember.

---

## 10. Worked example: Technology, Monday beat

This is the reference for structure, tone, impact sizes and schema. Write every other beat in every role to the same standard.

```js
// content/roles/tech.js (excerpt)
export default {
  id: "tech",
  title: "Software Engineer",
  qualityMeaning: "Code stability and system reliability",
  teaser: "Launch is Tuesday, and the requests keep coming.",
  stakeholders: {
    priya: { name: "Priya Raman", title: "Product Manager", presence: "available" },
    dana:  { name: "Dana Okafor", title: "Head of Product", presence: "busy" },
    marcus:{ name: "Marcus Lindqvist", title: "Tech Lead", presence: "available" },
    sarah: { name: "Sarah Mensah", title: "Director of Product", presence: "busy" }
  },
  insights: {
    tech_A: { title: "Billing reads that endpoint", note: "The billing export uses the same API endpoint as customer data." },
    tech_B: { title: "Client wants 3 usage views", note: "Halvern Analytics only cares about the three usage views." }
  },
  beats: {
    mon: { start: "tech_mon_open", escalation: "tech_mon_escalation" },
    wed: { start: "tech_wed_open", escalation: "tech_wed_escalation",
           mondayFollowUp: { passive: "tech_wed_ping_passive", assertive: "tech_wed_ping_assertive", aggressive: "tech_wed_ping_aggressive" } },
    fri: { start: "tech_fri_open", escalation: "tech_fri_escalation" }
  },
  criticalIncident: { text: "Monitoring alert: error rates on the launch page just spiked after the last deploy." },
  tips: {
    passive: "Before saying yes, name what will move. A yes without a trade-off is a promise you'll pay for later.",
    aggressive: "Process is a good reason, but lead with the outcome you're protecting and offer one path forward.",
    assertive: "Keep asking about dependencies first. It's what turns your pushback into data people can act on."
  },
  nodes: {
    tech_mon_open: {
      id: "tech_mon_open", type: "choice", day: "mon", time: "9:12 AM", chat: "priya",
      messages: [
        { from: "priya", text: "Morning {name|there}! Leadership loved the video hero on a competitor's site." },
        { from: "priya", text: "Can we add a dynamic video module to our launch page? Still good for Tuesday, right? 🙂" }
      ],
      choices: [
        { id: "tech_mon_open_p", tag: "passive",
          text: "Sure, I'll squeeze it in. Tuesday should still work.",
          impact: { trust: 5, bandwidth: -20, quality: -10 },
          next: "tech_mon_after_passive",
          coaching: "Agreeing without checking the cost quietly moves the risk onto you and the launch.",
          betterResponse: "I'd love to add it. Before I commit, what's driving it, and what can move if Tuesday stays fixed?" },
        { id: "tech_mon_open_g", tag: "aggressive",
          text: "Scope was locked at sprint planning. We can't keep adding things.",
          impact: { trust: -18, bandwidth: 0, quality: 0 },
          next: "tech_mon_after_aggressive",
          coaching: "Pointing to the process is fair, but with no alternative it reads as a closed door.",
          betterResponse: "Scope's tight since planning, but let's see what we can do. What would you drop to make room?" },
        { id: "tech_mon_open_a", tag: "assertive", subtype: "clarify",
          text: "Happy to look at it. Who's the launch page mainly for on Tuesday, and what matters most to them?",
          impact: { trust: 6, bandwidth: -5, quality: 6 },
          grantsInsight: "tech_B",
          next: "tech_mon_after_clarify",
          coaching: "Asking what matters most reveals real priorities before you commit to anything." }
      ]
    },

    tech_mon_after_clarify: {
      id: "tech_mon_after_clarify", type: "choice", day: "mon", time: "9:20 AM", chat: "priya",
      messages: [
        { from: "priya", text: "Good question. Mostly the Halvern Analytics team, they're on the launch call. Honestly they only care about the three usage views." },
        { from: "priya", text: "The video is more of a nice-to-have for leadership. Can we fit it in?" }
      ],
      choices: [
        { id: "tech_mon_clar_a", tag: "assertive", subtype: "tradeoff",
          text: "Then let's protect what Halvern cares about. I can add the video if we drop the custom icon pack, or ship it in next week's update. Which do you prefer?",
          impact: { trust: 8, bandwidth: -5, quality: 8 }, next: "$endBeat",
          coaching: "A clear either-or keeps the date and gives Priya the decision that's hers to make." },
        { id: "tech_mon_clar_p", tag: "passive",
          text: "I'll do the video and keep everything else. It'll be tight, but fine.",
          impact: { trust: 4, bandwidth: -18, quality: -8 }, next: "$endBeat",
          coaching: "You learned it was a nice-to-have, then committed to it anyway at your own cost.",
          betterResponse: "Since it's a nice-to-have, could it go in next week's update so Tuesday stays solid?" },
        { id: "tech_mon_clar_g", tag: "aggressive",
          text: "If it's a nice-to-have, then it's a no from me.",
          impact: { trust: -15, bandwidth: 0, quality: 0 }, next: "$endBeat",
          coaching: "Right conclusion, wrong delivery. A flat no ignores that leadership asked for it.",
          betterResponse: "Since it's a nice-to-have, how about we plan it for next week's update and tell leadership it's coming?" }
      ]
    },

    tech_mon_after_passive: {
      id: "tech_mon_after_passive", type: "choice", day: "mon", time: "11:05 AM", chat: "priya",
      messages: [
        { from: "priya", text: "You're a lifesaver! While you're in there, could the sign-up button animate on hover too?" }
      ],
      choices: [
        { id: "tech_mon_pas_p", tag: "passive", text: "Sure, that's an easy one.",
          impact: { trust: 3, bandwidth: -12, quality: -6 }, next: "$endBeat",
          coaching: "Each small yes stacks up. This is how scope creep happens one request at a time.",
          betterResponse: "I'll add it to next week's list. The video used up the room we had for Tuesday." },
        { id: "tech_mon_pas_a", tag: "assertive", subtype: "repair",
          text: "I'll be honest, the video used up the slack we had. Can we put the button animation in next week's update so Tuesday stays solid?",
          impact: { trust: 5, bandwidth: 0, quality: 8 }, next: "$endBeat",
          coaching: "It's never too late to name the limit. You protected the launch without going back on your word." },
        { id: "tech_mon_pas_g", tag: "aggressive", text: "I just added a whole video. No more changes, please.",
          impact: { trust: -15, bandwidth: 0, quality: 0 }, next: "$endBeat",
          coaching: "The frustration is fair, but it lands on Priya for a problem your earlier yes created.",
          betterResponse: "I'd like to keep Tuesday safe, so let's add the animation to next week's update." }
      ]
    },

    tech_mon_after_aggressive: {
      id: "tech_mon_after_aggressive", type: "choice", day: "mon", time: "9:18 AM", chat: "priya",
      messages: [
        { from: "priya", text: "Wow, okay. I was only asking. I'll tell leadership it isn't possible." }
      ],
      choices: [
        { id: "tech_mon_agg_a", tag: "assertive", subtype: "repair",
          text: "That came out sharper than I meant. If the video's a must, we could swap it for the icon pack and keep Tuesday. Want me to scope it?",
          impact: { trust: 12, bandwidth: -5, quality: 5 }, next: "$endBeat",
          coaching: "Owning the tone and offering a path forward repairs most of the damage." },
        { id: "tech_mon_agg_g", tag: "aggressive", text: "Go ahead. Scope is scope.",
          impact: { trust: -12, bandwidth: 0, quality: 0 }, next: "$endBeat",
          coaching: "Doubling down turns a request into a standoff and invites escalation.",
          betterResponse: "Before you do, let me check whether a swap could make it work for Tuesday." },
        { id: "tech_mon_agg_p", tag: "passive", text: "Wait, fine. I'll add it.",
          impact: { trust: 3, bandwidth: -20, quality: -10 }, next: "$endBeat",
          coaching: "Flipping from no to yes under pressure teaches people that pushing works.",
          betterResponse: "Let me rethink that. If we swap out the icon pack, I can fit the video and keep Tuesday." }
      ]
    },

    tech_mon_escalation: {
      id: "tech_mon_escalation", type: "choice", day: "mon", time: "2:40 PM", chat: "priya",
      joins: "dana",
      messages: [
        { from: "dana", text: "Hi {name|there}, Priya looped me in. I want Tuesday to go well and I'd like the video if we can get it. Help me understand the trade-off.",
          variants: [ { when: { beatHadTag: "aggressive" },
            text: "Hi {name|there}, Priya looped me in after this morning. I want us on the same side here. Help me understand the trade-off on the video." } ] }
      ],
      choices: [
        { id: "tech_mon_esc_a", tag: "assertive", subtype: "impact",
          text: "Thanks, Dana. Adding the video without dropping something puts mobile testing at risk for Tuesday. If we swap out the icon pack, I can ship both on time.",
          impact: { trust: 12, bandwidth: -5, quality: 8 }, next: "$endBeat",
          coaching: "Framing it as launch risk, with a concrete swap, gives a senior leader something to decide." },
        { id: "tech_mon_esc_p", tag: "passive", text: "Understood. I'll find a way to make it all happen.",
          impact: { trust: 4, bandwidth: -20, quality: -10 }, next: "$endBeat",
          coaching: "A senior voice in the chat isn't a reason to drop the trade-off. It's the moment to state it.",
          betterResponse: "I can make the video happen if we swap out the icon pack. Otherwise mobile testing is at risk." },
        { id: "tech_mon_esc_g", tag: "aggressive", text: "I already explained to Priya that we're out of capacity.",
          impact: { trust: -15, bandwidth: 0, quality: 0 }, next: "$endBeat",
          coaching: "Repeating the no to a more senior person, with no new option, escalates the conflict.",
          betterResponse: "We're at capacity for Tuesday, but a swap with the icon pack would make room for the video." }
      ]
    }
  }
};
```

Special `next` values: `$endBeat` ends the current beat (the engine then checks escalation, then moves to the day transition). `$return` is used only by Monday follow-up nodes during Wednesday triage and returns to the Wednesday flow.

---

## 11. Technical architecture

### 11.1 Repository structure

```
pushback-quest/
├── index.html
├── assets/
│   ├── favicon.svg
│   ├── logo.svg
│   └── og-image.png            # 1200×630 social preview (also used as portfolio thumbnail)
├── css/
│   ├── tokens.css              # colors, type scale, spacing, radii (light + dark)
│   ├── base.css                # reset, typography, focus styles, reduced motion
│   ├── layout.css              # app shell, responsive breakpoints
│   └── components.css          # cards, bubbles, meters, panels, debrief
├── js/
│   ├── main.js                 # bootstrap, routing between start / game / debrief
│   ├── storage.js              # safe localStorage wrapper
│   ├── engine/                 # pure logic, no DOM access
│   │   ├── game.js             # createGame(), choose(), state transitions
│   │   ├── rng.js              # seeded PRNG + shuffle
│   │   ├── conditions.js       # evaluates `when` objects
│   │   ├── text.js             # {name|fallback} and {role} tokens
│   │   ├── events.js           # event selection
│   │   ├── endings.js          # ending evaluation
│   │   └── achievements.js     # achievement checks
│   └── ui/
│       ├── startScreen.js
│       ├── shell.js            # rail, chat list, header
│       ├── thread.js           # messages, typing indicator, system lines
│       ├── cards.js
│       ├── meters.js
│       ├── notes.js
│       ├── transition.js
│       ├── debrief.js
│       └── a11y.js             # live regions, focus management
├── content/
│   ├── config.js               # difficulty settings (section 5.2)
│   ├── events.js               # event pool (section 5.9)
│   ├── endings.js
│   ├── achievements.js
│   ├── strings.js              # all UI copy
│   └── roles/
│       ├── hr.js  tech.js  sales.js  marketing.js
│       └── ops.js servicedesk.js support.js finance.js
├── tools/
│   ├── simulate.mjs            # path simulator and balance report
│   └── lint-content.mjs        # content and schema linter
├── tests/                      # node:test unit tests
├── docs/
│   ├── DESIGN.md               # instructional design rationale
│   ├── ARCHITECTURE.md         # diagrams and engine explanation
│   └── CONTENT-GUIDE.md        # how to add or edit a role
├── .github/workflows/
│   ├── ci.yml                  # lint, tests, quick simulation
│   └── pages.yml               # deploy to GitHub Pages
├── package.json                # scripts only, "type": "module", no dependencies
├── LICENSE                     # MIT
└── README.md
```

### 11.2 Engine design

- The engine is pure JavaScript with no DOM access, so it runs both in the browser and in Node (for tests and the simulator).
- API:
  - `createGame({ roleId, difficulty, name, seed })` returns a game object.
  - `game.current()` returns the current view: node info, messages to display (tokens resolved, variants chosen), shuffled cards (with insight cards included when unlocked), meters, notes, day and time.
  - `game.choose(choiceId)` applies the choice and returns an ordered list of **effects** for the UI to play: `playerMessage`, `meterChange` (with deltas), `insightAdded`, `systemLine`, `participantJoined`, `stakeholderMessage`, `dayTransition` (with event), `criticalIncident`, `triage`, `gameOver` (with ending).
  - `game.log()` returns the full decision history for the debrief.
- The UI plays effects sequentially (with typing delays) and never mutates game state.
- Role content files are loaded with dynamic `import()` only after a role is selected.

### 11.3 State shape

```js
{
  roleId, difficulty, name, seed,
  meters: { trust, bandwidth, quality },
  startMeters: { trust, bandwidth, quality },
  day: "mon" | "wed" | "fri",
  beat: { id, nodeId, tagsChosen: [], escalated: false },
  overcommit: 0,
  insights: [],                  // insight ids
  flags: { criticalIncident: false },
  outcomes: { mon: null },       // last tag of Monday beat, used for Wednesday follow-up
  firedEvents: [],
  history: [ { nodeId, choiceId, tag, subtype, impact, appliedImpact, day } ],
  minMeters: { trust, bandwidth, quality },  // lowest values reached
  ended: null                    // ending id
}
```

### 11.4 Conditions (`when` objects)

Supported keys, all optional and combined with AND: `trustLt`, `trustGte`, `bandwidthLt`, `bandwidthGte`, `qualityLt`, `qualityGte`, `overcommitGte`, `overcommitEq`, `hasInsight`, `flag`, `mondayOutcome` (`passive` | `assertive` | `aggressive`), `beatHadTag`, `difficulty`. The first matching variant wins; if none match, the default text is used.

### 11.5 Persistence

- localStorage key `pushbackQuest.v1` stores `{ achievements: [], endingsSeen: [], rolesCompleted: [], settings: { theme, reducedMotion } }`.
- Every read and write is wrapped in try/catch with an in-memory fallback, so the game works when storage is unavailable.
- No game-in-progress saving (a run is short). Nothing is ever sent off the device.

### 11.6 Achievements

| ID | Title | Condition |
|---|---|---|
| `zero_overtime` | Zero overtime week | Finish a run with overcommit = 0 |
| `turnaround` | Turned it around | Choose an assertive card in an escalation node |
| `insightful` | Did your homework | Use an insight card |
| `curious` | Ask first | Earn both insights in one run |
| `boundary_keeper` | Held the line | Choose the assertive card in every boundary node of a run |
| `triage_pro` | Triage pro | Choose the holding message in competing messages |
| `master` | Master Negotiator | Reach the Master Negotiator ending |
| `crunch_survivor` | Survived crunch | Finish Crunch week without Burnout or The Wall |
| `all_endings` | Seen it all | See every ending at least once (cumulative) |
| `all_roles` | Walked in their shoes | Complete a run in all eight roles (cumulative) |

Unlocking shows a small, non-blocking toast (announced politely to screen readers) and appears in the debrief.

### 11.7 Security and privacy (static site)

- Content Security Policy via meta tag: `default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'none'`.
- No inline scripts or inline event handlers.
- All dynamic text inserted with `textContent` or created elements. Never use `innerHTML` with content or user input.
- No third-party scripts, analytics or trackers. State this in the README.

### 11.8 Performance

- Total JavaScript and CSS under 250 KB unminified (role content excluded); each role file under 60 KB.
- Fonts loaded with `display=swap` and `preconnect`; only the weights actually used.
- No images besides SVG icons and the social preview image.
- Target: interactive in under 2 seconds on a mid-range phone over 4G.

### 11.9 SEO and sharing

`<title>`, meta description, Open Graph and Twitter card tags pointing at `assets/og-image.png`, canonical URL placeholder, `favicon.svg`. Generate the social preview image from an SVG design (via a small script or by hand); if PNG generation isn't possible in the environment, provide the SVG and note the export step in the README.

---

## 12. Testing and quality tools

### 12.1 Unit tests (`node --test`)

Cover at minimum: seeded RNG reproducibility and shuffle; meter clamping and difficulty multipliers; condition evaluation; token replacement including fallbacks and name sanitization; insight unlocking; escalation triggering and the one-per-beat limit; triage penalties; delayed consequence thresholds; critical incident firing once; every ending condition and priority order; achievement conditions.

### 12.2 Content linter (`tools/lint-content.mjs`)

Fails the build if any of the following is true:

- A node or choice is missing a required field, or a `next` points to a missing node.
- A node is unreachable from its beat start.
- A choice node (excluding insight cards) doesn't have exactly one passive, one aggressive and one assertive card.
- A passive or aggressive card lacks `betterResponse`, or any card lacks `coaching`.
- A boundary node's compromise card isn't tagged passive.
- An insight is never granted, or never used on Friday.
- Text exceeds the length limits in section 9.
- Text contains an unknown token or a banned real-brand term.
- A role lacks any required field (teaser, quality meaning, tips, critical incident, Monday follow-ups for all three outcomes).

### 12.3 Path simulator (`tools/simulate.mjs`)

- For each role and difficulty, enumerate every choice path (depth-first) across a set of seeds (default 5; `--seeds` flag to change).
- Report per role and difficulty: ending distribution, unreachable endings, unreachable nodes, minimum and maximum meter values, average and maximum decisions per run, insight card usage.
- **Balance targets (Standard week):**
  - Every ending is reachable in every role.
  - Always choosing the best assertive card (insight cards when available) reaches Master Negotiator for at least 90% of seeds.
  - Always choosing passive reaches Burnout, Quiet Fixer or Running on Fumes, never Master Negotiator.
  - Always choosing aggressive reaches The Wall.
  - A typical run has 7 to 11 decisions.
- The simulator exits with an error if any target fails. CI runs it with 3 seeds.

### 12.4 Manual checks before release

Keyboard-only full playthrough; screen reader pass (VoiceOver and NVDA); 200% zoom; reduced motion; light and dark themes; mobile Safari and Chrome on Android; Lighthouse on the deployed URL.

---

## 13. Documentation, deployment and portfolio

### 13.1 README.md

1. Title, one-line description, "Play it" link (GitHub Pages URL placeholder), screenshot or GIF placeholder.
2. What it is and who it's for (short).
3. Features: eight roles, three meters, the mechanics list, accessibility, no tracking.
4. How it works: a Mermaid diagram of the week flow and of the engine-to-UI effect loop.
5. Run locally: `python3 -m http.server` from the repo root (ES modules need a server), then open the local URL.
6. Scripts: `npm test`, `npm run lint:content`, `npm run simulate`.
7. Project structure (short tree).
8. Adding or editing a role: link to `docs/CONTENT-GUIDE.md`.
9. Design rationale: link to `docs/DESIGN.md`.
10. Credits (fonts with licenses) and MIT license.

### 13.2 docs/DESIGN.md (instructional design rationale)

Written as a portfolio case study: the performance problem; target behaviors; the Assertive Alignment techniques, presented as the project's own synthesis of established assertiveness and negotiation practice; why scenario-based practice (with a reference to Cathy Moore's action mapping as the design approach); the hybrid content structure; how each mechanic maps to a learning goal (insights teach clarifying, escalations teach repair and impact framing, triage teaches prioritization, delayed consequences teach the hidden cost of over-committing, boundary nodes teach that compromise isn't always right); feedback design (consequences shown in-world, coaching saved for the debrief); accessibility decisions; limitations and ideas for future evaluation.

### 13.3 docs/ARCHITECTURE.md

Engine and UI separation, the effect list pattern, state shape, node schema, special `next` values, conditions, seeded randomness, and the testing tools, with Mermaid diagrams.

### 13.4 Deployment

- `pages.yml` deploys the repository root to GitHub Pages using GitHub's official Pages actions, pinned to specific versions.
- `ci.yml` runs on push and pull request: content lint, unit tests, simulator with 3 seeds.
- The site must work at `https://<username>.github.io/pushback-quest/`.

### 13.5 Portfolio listing (for the creator's "Gamified projects" section)

Provide in the README a short block the creator can copy:

- **Title:** Pushback Quest
- **One-liner:** A workplace simulator where you practice saying no, negotiating trade-offs and holding boundaries across eight professional roles.
- **Tags:** Scenario-based learning, Game design, Vanilla JavaScript, Accessibility
- **Links:** Play, Design case study (DESIGN.md), Source code
- **Thumbnail:** `assets/og-image.png`

---

## 14. Build plan (phases)

Work through these phases in order. At the end of each phase, run all available checks and commit with a descriptive message.

1. **Foundation:** scaffold the repository, design tokens, base CSS, engine core (state, RNG, conditions, tokens), content schema, and the complete Technology role. Unit tests for the engine core.
2. **Interface:** start screen, app shell, thread, cards, meters, notes panel, responsive layouts, light and dark themes. Technology playable end to end with basic endings.
3. **Mechanics:** random events, delayed consequences, critical incident, escalation, competing messages, insight cards, all endings, full debrief, achievements, difficulty levels, persistence.
4. **Tools:** content linter and path simulator; balance the Technology role until all targets in 12.3 pass.
5. **Content:** write the remaining seven roles in this order: Finance, Service Desk, Sales, HR, Marketing, Operations, Customer Support. Each role must pass the linter and simulator before starting the next.
6. **Accessibility and polish:** keyboard flow, focus management, screen reader announcements, reduced motion, cross-browser fixes, performance budget, Lighthouse.
7. **Docs and deployment:** README, DESIGN.md, ARCHITECTURE.md, CONTENT-GUIDE.md, social preview image, CI and Pages workflows.

---

## 15. Acceptance criteria

- [ ] All eight roles playable from role selection to debrief on all three difficulties.
- [ ] Start screen allows starting a run with one click after choosing a role.
- [ ] Meters, tags, impacts, thresholds and endings behave exactly as specified in sections 5 and 6.
- [ ] Random events, shuffled cards, insights, escalations, competing messages and achievements all work and are covered by tests.
- [ ] Same seed and same choices always produce the same run.
- [ ] Content linter passes with zero errors.
- [ ] Simulator passes all balance targets for every role.
- [ ] No real brand names, no copied Teams or Slack visual elements.
- [ ] No `innerHTML` with content or user input; CSP in place; no network requests other than Google Fonts.
- [ ] Keyboard-only and screen reader playthroughs succeed; WCAG 2.2 AA contrast in both themes.
- [ ] Reduced motion fully respected.
- [ ] Lighthouse 95 or higher in all four categories on the deployed site.
- [ ] Works from a GitHub Pages project subpath.
- [ ] README, DESIGN.md, ARCHITECTURE.md and CONTENT-GUIDE.md complete.

---

## 16. Defaults chosen in this PRD (change before building if needed)

- Game name: "Pushback Quest", subtitle "Navigating work demands without burning out."
- Repository and URL name: `pushback-quest`.
- Fictional chat app working name: "Threadline" (check it doesn't clash with a well-known product; rename if it does).
- Palette and fonts: as in sections 7.2 and 7.3.
- License: MIT.
- Content order and stakeholder names: chosen by Claude Code within the guidelines, except where the worked example defines them.
