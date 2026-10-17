# Pushback Quest: instructional design rationale

This is a case study of the design decisions behind Pushback Quest. It explains what problem the game addresses, what it asks players to practice, how each mechanic supports a learning goal, and where the design is weak. It makes no claims about measured learning outcomes: the game has not been evaluated with learners (see [Limitations](#limitations-and-future-evaluation)).

## 1. The performance problem

Professionals regularly receive unrealistic or high-pressure requests from managers, peers, clients and executives. Because of the power gap, most people fall back on one of two weak responses:

- **Passive compliance.** Saying yes to everything. The cost is burnout, missed deadlines, lower quality and quiet resentment, and the cost is usually paid later and by the person who said yes.
- **Aggressive refusal.** Rejecting a request bluntly, with no alternative. The cost is damaged trust, an escalation to a manager, and a reputation for being hard to work with.

The gap is rarely knowledge. Most people know that "set boundaries" is good advice. The gap is *in-the-moment behavior under social pressure*: a specific message from a specific person, a deadline, a small cost to saying no and a large perceived cost. That points to practice with realistic scenarios rather than a slide deck of tips.

## 2. Target behaviors

The game aims to move a player from the two weak responses toward four observable behaviors. "Assertive Alignment" is this project's own label for a synthesis of established assertiveness and negotiation practice; it is a convenient name for the set, not a validated model. The ideas are in the spirit of well-known work on assertive communication (for example Alberti and Emmons, *Your Perfect Right*) and principled negotiation (Fisher, Ury and Patton, *Getting to Yes*), but the game does not claim to implement either framework.

| Behavior | What it looks like in a message |
|---|---|
| **Trade-off framing** | "I can do X. To keep the date, should we drop Y or move Z?" Names the cost and gives the other person a decision that is theirs to make. |
| **Clarify before committing** | Asks what is driving the request, who it is for, what depends on it. Turns a vague demand into facts. |
| **Impact-first language** | Explains pushback as business or customer risk ("a rushed build puts invoicing at risk"), not personal inconvenience ("I'm too busy"). |
| **Firm boundaries** | When a request breaks policy, security, safety or ethics, says a respectful no with a reason and an alternative path. Compromise is not always correct. |

Each behavior is specific enough to write, and recognize in, a single chat message. That is deliberate: it keeps the response cards concrete ("I can add the video if we drop the custom icon pack, or ship it next week. Which do you prefer?") rather than generic advice.

## 3. Why scenario-based practice

The design follows the spirit of Cathy Moore's *action mapping*: start from the behavior that should change on the job, then build practice activities that put the learner in that decision, instead of starting from content to cover. Every scene in the game is a decision a professional could face on a normal week. There is no information delivered before the decision, only the situation and the choice. What a learner needs to know is revealed through the consequences and in the debrief.

Practice here is low-stakes and repeatable. A real conversation with a director cannot be rehearsed and retried; a chat with a fictional one can. The week takes 5 to 8 minutes, so replaying with a different approach is cheap. The same seed and the same choices reproduce the same run, which makes a path easy to discuss.

## 4. Hybrid content structure

The week has three beats, and they are deliberately different:

- **Monday is shared across roles: scope creep.** Someone keeps adding to a request after it was agreed. It is the most common pressure pattern and it is role-independent, so it teaches the core moves (clarify, then trade off) in a familiar form.
- **Wednesday is role-specific: the signature dilemma.** Each role gets the situation that practitioners in that field recognize: an offer letter before compensation approval, a promise about an unreleased feature, a "temporary" admin right, a reclassified expense, an unqualified supplier, a ticket backlog to be "closed", an unsubstantiated claim, and a hidden dependency in an API rename. Seven of the eight are boundary moments. This is where domain accuracy matters most.
- **Friday is shared: executive escalation.** A senior person makes an urgent request late in the day. It tests whether the earlier habits hold when the stakes and the seniority go up.

The hybrid keeps the authoring cost manageable (the Monday and Friday structure is the same in every role) while keeping the scenarios believable (Wednesday and the specifics of every message are role-specific). All content is hand-written. There are no AI features, no free-text input and no generated text.

## 5. How each mechanic maps to a learning goal

| Mechanic | What it teaches |
|---|---|
| **Three meters** (Trust, Bandwidth, Quality) | Every response has costs on several dimensions at once. Passive choices buy Trust and cost Bandwidth and Quality. Aggressive choices cost Trust and protect nothing. Assertive choices cost a little and protect all three. Quality's meaning changes by role (for example "security and resolution quality" for the service desk). |
| **Insights (information as a resource)** | Clarifying is rewarded with something concrete: a pinned note that unlocks the strongest response on Friday. This teaches that asking a question early is an investment, and that the facts you collect are what make your later pushback credible. |
| **Escalation chains** | Blunt refusals and low trust bring in the requester's manager. The only way back is a strong assertive reply (a repair or an impact-first message), so this teaches recovery and impact framing, not just avoidance. Passive choices never trigger escalation directly, which is true to life: the cost of over-committing is quiet. |
| **Competing messages (Wednesday triage)** | When two people need you, the choice is not "who wins" but whether anyone is left guessing. A short holding message ("Saw this, I'll get back to you by 4 PM") is the strongest option. This teaches prioritization and expectation setting. |
| **Delayed consequences** | Over-committing on Monday and Wednesday shows up as a "Running on empty" or "Long week" event before Friday. A week with no over-commitment earns a guaranteed rested start. This teaches the hidden, cumulative cost of small yeses. |
| **Random workplace events** | A little luck (a sick teammate, a cancelled meeting) makes the week feel like work rather than a quiz, and makes replays differ. Impacts are capped so luck cannot decide an outcome. |
| **Boundary nodes** | In non-negotiable situations the assertive card is a firm refusal with a reason and an alternative. The compromise card is *passive* and costs a lot of Quality, and the debrief calls out how each boundary moment was handled. This teaches that compromise is not always the right answer. |
| **Shuffled cards** | Card order is shuffled with a seeded generator so the "right" answer is never in a fixed position. Choices are recorded by id, not position, and the order in the interface is the order read by a screen reader. |
| **Difficulty levels** | Starting meters, the weight of negative outcomes, event luck, the escalation threshold and the cost of keeping someone waiting all scale, so the same scenarios can be practiced with more or less margin for error. |
| **Achievements** | Light recognition for the behaviors the game wants repeated (asking first, holding a line, sending a holding message). They are not points, there are no leaderboards, and nothing is sent anywhere. |

## 6. Feedback design

The game separates two kinds of feedback on purpose.

- **In-world consequences, immediately.** After a choice the player sees the other person's reaction in the chat and the meters moving. A passive yes gets a follow-up request; a blunt no gets a cooler reply or a manager joining the thread. The player draws the conclusion from the story.
- **Coaching, afterwards.** Explanations of *why* a response worked or did not, plus an assertive rewrite of the costliest mistake, are kept for the debrief. Interrupting each decision with a lecture would break the realism and teach players to look for the approved answer. At the end, the debrief shows the strongest moment, the decision that cost the most (with a "try this instead" in the player's own voice), each boundary moment, a role-specific tip chosen by the player's dominant style, and any achievements.

Passive and aggressive cards are written to sound like something a capable person might say on a bad day. There are no cartoonish wrong answers, because a plausible wrong answer is the only kind that teaches anything.

## 7. Accessibility decisions

Accessibility is treated as a design requirement, not a final polish step, and several choices were made for it:

- **No timers.** Countdowns were deliberately left out. A time limit would punish readers who need more time and would reward fast pattern-matching over thinking.
- **Full keyboard play.** Cards are buttons, number keys choose the matching card, Escape closes panels, and focus is moved to a stable point after each choice so keyboard and screen reader users are not lost while messages arrive.
- **Colour is never the only signal.** Meters show a number and a status word (Healthy, Strained, Critical), presence dots have text alternatives, and the debrief breakdown is labelled with counts.
- **Contrast and type.** Text meets WCAG 2.2 AA in both themes (checked by an automated test of the design tokens). The interface uses Atkinson Hyperlegible, designed for legibility, with sentence case throughout and no all-caps labels.
- **Reduced motion.** Honors the system setting and has an in-game override. With it on, typing delays are skipped and animations are disabled.
- **Reflow and targets.** The layout reflows to 320 CSS pixels, works at 200% zoom, and interactive controls are at least 44 by 44 pixels.
- **Live regions.** New messages are announced politely and queued; events and critical incidents are announced assertively and sparingly.

## 8. Limitations and future evaluation

What this design does not do, stated plainly:

- **No evidence of learning or transfer.** The game has not been tested with learners. Whether practice in a chat simulation changes behavior in a real conversation is unknown.
- **The right answer is easy to spot.** Assertive cards tend to be longer and more specific, and an attentive player can learn to recognize the pattern without learning the skill. Shuffling removes position cues, not style cues. The insight cards and the escalation repairs partly offset this, but it is a genuine limitation of a fixed-choice format.
- **A simplified world.** Power dynamics, organizational culture, and national or industry norms vary widely. The scenarios assume a workplace where respectful pushback is safe and is usually rewarded. In some workplaces it is not, and the game does not address that.
- **Limited branching.** Every node has three base responses and a short chain of follow-ups. Real conversations are open-ended.
- **English only.** All text is in content files so localization is possible, but only English exists.
- **Domain accuracy is a design intent, not a review.** The scenarios were written to reflect how the work happens, in general terms, and they avoid specific legal claims. They have not been reviewed by practitioners in each field.

Ideas for evaluating it, none of which have been run:

1. **Expert review.** Ask practitioners in each role to rate the realism of the scenarios and the quality of the assertive responses.
2. **Think-aloud sessions.** Watch a small number of players, note where they hesitate, and check whether they choose by skill or by spotting the pattern.
3. **Pre and post measures.** Measure self-reported confidence and a scenario-based test using *new* scenarios that are not in the game, to look for transfer rather than recall.
4. **Delayed follow-up.** Ask participants weeks later whether they used any of the four behaviors at work. Any such measurement should be opt-in and separate from the game, which collects no data.
5. **Content experiments.** Compare cards with and without a "tell" (such as length), and in-world feedback only versus feedback plus coaching.
