# Vim Dojo — Feature Specification

**URL:** `sabililhaq.com/vim`

## 1. Overview

Vim Dojo is a lightweight browser-based playground for practicing Vim commands and building muscle memory.

It is **not a beginner Vim tutorial**.

Users should already be familiar with basic Vim concepts such as:

* Normal / Insert mode
* Basic motions
* Operators
* Common commands

For beginners, provide a link to [VimHero's Basic Movement lesson](https://www.vim-hero.com/lessons/basic-movement).

The goal of Vim Dojo is not simply to complete editing tasks. It is to encourage users to solve ordinary text-editing problems **using Vim**.

Users are never blocked from using:

* Mouse
* Text selection
* Paste
* Browser editing
* Any other method

However, if they solve a challenge without meaningfully using Vim, the application should gently point out that they missed the practice opportunity.

---

# 2. Design Philosophy

### Simple

The application should look like it belongs to `sabililhaq.com`.

Avoid the visual language of a commercial learning platform.

Do not introduce:

* Dashboard
* Accounts
* Leaderboards
* Skill trees
* Badges
* XP systems
* Complex statistics
* Social features

The primary interaction is simply:

**Read challenge → edit → complete → next challenge.**

### Practice over correctness

A challenge has two separate outcomes:

1. **Did the user achieve the desired final text?**
2. **Did the user practice Vim while doing it?**

A user can therefore successfully complete a challenge while still receiving feedback that they used a non-Vim editing method.

---

# 3. Page Structure

The page should be a single focused experience.

```text
Sabililhaq

projects · blogs · links · labs

────────────────────────────────────

Vim Dojo

Practice Vim. Don't learn Vim.

This is not a beginner Vim tutorial.
You should already know the basics.

New to Vim?
→ VimHero Basic Movement

────────────────────────────────────

Challenge 01

Change "production" to "staging".

┌──────────────────────────────────────┐
│ const environment = "production";    │
│                         ^            │
│                                      │
└──────────────────────────────────────┘

────────────────────────────────────

✓ Completed

9 keystrokes · 1.2s

[ Next → ]

────────────────────────────────────

01 / 20
```

The existing website's typography, spacing, colors, header, and general visual language should be reused wherever practical.

---

# 4. Challenge System

Challenges are the fundamental unit of the application.

```ts
type Position = {
  line: number;   // 0-indexed
  column: number; // 0-indexed
};

type Challenge = {
  id: string;
  title: string;
  description: string;

  category: Category;

  initialContent: string;   // may be multi-line; use "\n"
  targetContent: string;    // may be multi-line; use "\n"

  initialCursor?: Position;

  hints?: Hint[];

  concepts?: string[];

  difficulty: "easy" | "medium" | "hard";
};
```

Example:

```ts
{
  id: "text-object-01",

  title: "Change quoted text",

  description:
    'Change "production" to "staging".',

  category: "text-object",

  initialContent:
    'const environment = "production";',

  targetContent:
    'const environment = "staging";',

  concepts: [
    "change",
    "text-object",
    "quotes"
  ],

  difficulty: "easy"
}
```

---

# 5. Challenge Categories

Initial categories should include:

### Motions

Practice:

* `h`
* `j`
* `k`
* `l`
* `w`
* `b`
* `e`
* `0`
* `$`
* `^`
* `gg`
* `G`
* `f`
* `F`
* `t`
* `T`
* `%`

Example:

> Move the cursor to the beginning of the line.

---

### Operators

Practice Vim's operator + motion grammar:

* `d`
* `c`
* `y`

Examples:

```text
dw
d$
cw
cW
yw
```

Challenges should encourage users to discover combinations rather than simply memorize isolated commands.

---

### Text Objects

Practice:

```text
iw
aw
i"
a"
i'
a'
i(
a(
i[
a[
i{
a{
```

Examples:

> Change the word under the cursor.

> Delete everything inside the parentheses.

> Replace the contents of the quotes.

---

### Search

Practice:

```text
/
/?
n
N
*
#
```

Example:

> Find the next occurrence of `database`.

---

### Editing

Practice:

```text
x
X
r
R
~
J
o
O
u
Ctrl-r
```

---

### Repetition

Practice:

```text
.
;
,
```

Example:

> Apply the same change to the next three occurrences.

---

### Visual Mode

Practice:

```text
v
V
Ctrl-v
```

and operations performed after selection.

**Classification note:** entering Visual mode with `v`/`V`/`Ctrl-v` and then extending the selection with a mouse drag (instead of motions) counts as `mixed`, not `vim`. Vim-mode credit requires the selection itself to be extended via keyboard motions. See §12.

---

### Counts

Practice:

```text
3w
4dd
2dw
5j
```

Example:

> Delete the next three lines.

---

### Search & Replace

Eventually introduce:

```vim
:%s/foo/bar/g
```

Challenges should use realistic text/code rather than artificial examples.

---

### Macros

Advanced challenges can introduce:

```vim
qa
q
@a
@@
```

Example:

> Perform the same transformation on every line.

---

# 6. Challenge Progression

Challenges should gradually increase in complexity.

Suggested progression:

```text
Level 1
Basic motions

Level 2
Word / line motions

Level 3
Operators

Level 4
Operators + motions

Level 5
Text objects

Level 6
Search

Level 7
Counts

Level 8
Visual mode

Level 9
Repetition

Level 10
Search & replace

Level 11
Macros

Level 12
Mixed real-world editing
```

The user should not need to complete every challenge perfectly before moving on.

---

# 7. Realistic Editing Tasks

Challenges should primarily resemble tasks a developer would actually perform.

Avoid:

> Move the cursor 17 characters to the right.

Prefer:

> Delete this logging statement.

Avoid:

> Move down five lines.

Prefer:

> Change `timeout` to `requestTimeout`.

Examples:

### Rename

```js
const user = database.findUser(id);
return user;
```

> Rename `user` to `result`.

---

### Delete

```js
const response = await fetch(url);
console.log(response);
return response;
```

> Delete the `console.log` statement.

---

### Text object

```js
const environment = "production";
```

> Change `production` to `staging`.

---

### Parentheses

```js
calculatePrice(basePrice, tax, discount)
```

> Remove all arguments.

---

### Repetition

```text
user.name
user.email
user.age
user.address
```

> Change `user` to `account` on every line.

---

# 7a. Multi-line Challenges

Several §7 examples (`Rename`, `Delete`, `Repetition`) span multiple lines. This has implications the single-line examples elsewhere in this doc don't surface:

* **`initialContent` / `targetContent`** use `"\n"` as the line separator (see updated type in §4). Trailing newline handling must be consistent between the two — trim or normalize both the same way before comparing in the validator (§10), otherwise a correct multi-line edit can fail validation on a stray newline.
* **`initialCursor`** is still a single `Position` (§4) — the starting line/column. Challenges don't currently support specifying a target *cursor* position, only target *content*; this is intentional and consistent with §10 ("validator cares about the resulting document").
* **Repetition-style challenges** (e.g. "change `user` to `account` on every line") are validated purely on final content — a user who manually edits every line one at a time still passes, and is classified per §12 same as any other challenge. Don't special-case repetition challenges in the validator; let §11 telemetry pick up whether `.` was used.
* Keep multi-line challenge content short (2-5 lines) for MVP. Long multi-line buffers complicate both the visual layout (§3, §25) and the classifier's ability to distinguish "vim" from "mixed" (more surface area for mouse clicks to sneak in). Save longer buffers for post-MVP "mixed real-world editing" (Level 12, §6).

---

# 8. Editor

Use **CodeMirror 6** as the editor.

Use:

**`@replit/codemirror-vim`**

for Vim behavior.

The editor should support Vim modes and commands through the existing library rather than implementing Vim itself.

Required behavior:

* Normal mode
* Insert mode
* Visual mode
* Vim cursor
* Vim motions
* Vim operators
* Vim text objects
* Search
* Undo / redo
* Common Vim commands

The initial implementation should only expose functionality supported reliably by the selected Vim implementation.

Do not attempt to implement a complete Vim clone.

---

# 9. Initial Cursor

Challenges should control the initial cursor position.

This is important because it allows challenges to specifically test Vim commands.

Example:

```text
const environment = "production";
                    ^
```

Challenge:

> Change the contents inside the quotes.

The cursor can begin inside `"production"`.

This allows the expected solution to naturally be:

```text
ci"
```

without explicitly telling the user.

---

# 10. Challenge Validation

A challenge is successful when:

```ts
currentContent === targetContent
```

The validator should primarily care about the resulting document.

Do not require a specific Vim command.

For example, if the intended solution is:

```text
ci"
```

and the user achieves the same result using:

```text
x x x ...
```

the challenge is still considered complete.

This is intentional.

**Note (multi-line):** normalize trailing/leading whitespace and line-ending style on both sides of the comparison before running it — see §7a.

---

# 11. Vim Practice Detection

The application should record how the user interacted with the editor.

Track:

* Keyboard input
* Vim commands where detectable
* Insert-mode typing
* Mouse interaction
* Mouse selection
* Paste
* Direct document changes
* Undo / redo

The goal is **not anti-cheating**.

The goal is to provide useful feedback.

## 11a. Detection Approach

`@replit/codemirror-vim` does not expose a clean "here's the command that just ran" API. Two viable approaches, in order of recommended effort for MVP:

**1. Heuristic telemetry (recommended for MVP).** Don't try to parse the vim command grammar. Instead, log a lightweight event stream per attempt:

```ts
type InteractionEvent =
  | { type: "key"; key: string; mode: "normal" | "insert" | "visual"; t: number }
  | { type: "mode-change"; from: string; to: string; t: number }
  | { type: "mouse-down"; t: number }
  | { type: "mouse-selection"; length: number; t: number }
  | { type: "paste"; length: number; t: number }
  | { type: "undo" | "redo"; t: number };
```

Hook this by listening to CM6's `EditorView.updateListener` plus the vim adapter's mode-change hook (`CodeMirror.on(cm, "vim-mode-change", ...)` in the replit adapter), and a `mousedown`/`selectionchange` listener on the editor DOM node. This captures *enough* signal for classification (§12) without needing to understand vim grammar.

**2. Command-level parsing (post-MVP).** Parse the raw keystroke stream against known vim grammar (operator+motion, text-object patterns) to log the literal command (e.g. `ci"`) for richer feedback like §35's "You used: ciw, f, .". This is meaningfully more work and isn't required for classification — only for nicer post-hoc display. Defer until the heuristic approach is validated against real usage.

For MVP, build only approach 1. It's sufficient to drive §12 classification and §17's keystroke counter.

---

# 12. Editing Method Classification

Classify each completed attempt approximately as:

```ts
type Method =
  | "vim"
  | "mostly-vim"
  | "mixed"
  | "manual"
  | "paste";
```

Classification does not need to be perfect.

## 12a. Classification Heuristic (MVP)

Using the event stream from §11a, compute per attempt:

* `mouseDownCount` — number of `mouse-down` events on the editor
* `mouseSelectionChars` — total characters selected via mouse drag (not keyboard visual-mode extension)
* `pasteChars` — total characters inserted via paste
* `keyEventCount` — number of `key` events
* `finalContentLength` — length of `targetContent`

Rules, evaluated in order:

1. **`paste`** — `pasteChars` accounts for ≥50% of the diff between `initialContent` and `targetContent`.
2. **`manual`** — `mouseSelectionChars` accounts for ≥50% of the diff, or the attempt never entered a non-initial vim mode (i.e. user never left Normal mode via a vim command, only via mouse click + typing).
3. **`mixed`** — some mouse interaction (`mouseDownCount > 0` or `mouseSelectionChars > 0`) occurred, but keyboard/vim activity did most of the work.
4. **`mostly-vim`** — no mouse selection, but includes at least one `mouse-down` (e.g. clicking to focus, or clicking to reposition cursor rather than using a motion).
5. **`vim`** — everything else: no mouse interaction at all, no paste.

**Visual-mode + mouse-drag rule** (referenced in §5): if the user enters Visual mode via keyboard (`v`/`V`/`Ctrl-v`) but then extends the selection via mouse drag rather than motions, that drag counts toward `mouseSelectionChars` in rule 2/3 above — it is not exempted just because Visual mode was entered correctly. The intent is to credit *keyboard-driven* selection, not merely *being in* Visual mode.

This heuristic is intentionally simple and will misclassify edge cases (e.g. a deliberate single mouse click to reposition the cursor before a otherwise-pure-vim solution gets bumped to `mostly-vim` rather than `vim`). That's an acceptable MVP trade-off — tune thresholds after watching real usage rather than trying to perfect this up front.

Example:

### Vim

```text
ciw
result
Esc
```

Result:

```text
Method: Vim
```

### Manual

User:

* Clicks editor
* Selects text with mouse
* Types replacement

Result:

```text
Method: Manual
```

### Mixed

User performs Vim commands but also relies heavily on mouse selection.

Result:

```text
Method: Mixed
```

---

# 13. Manual Editing Feedback

Never punish manual editing.

Never prevent it.

Never mark the challenge as failed because of it.

If the challenge is completed manually:

```text
✓ Completed

You solved it.

But you skipped the Vim practice. 🥋

This challenge was designed to practice `ciw`.

[ Try again ]
[ Next → ]
```

Alternative concise message:

> **You solved the problem, but you didn't train the skill.**

This philosophy should be central to the product.

---

# 14. Paste Detection

If the user pastes content that causes the challenge to complete:

```text
✓ Completed

You pasted the solution.

Nothing wrong with that — but this dojo is
for practicing Vim.

[ Try again ]
[ Next → ]
```

Do not block paste.

---

# 15. Hints

Every challenge may contain up to three hints.

Hints should progressively reveal the solution.

Example:

### Hint 1

> Think about text objects.

### Hint 2

> You want to change the contents inside the quotes.

### Hint 3

> Try `ci"`.

The first hint should not immediately reveal the answer.

Hints should be optional.

---

# 16. Completion Feedback

When completed through Vim:

```text
✓ Completed

Nice.

`ci"` was the intended move.

9 keystrokes · 1.2s

[ Next → ]
```

When completed manually:

```text
✓ Completed

You solved it.

But you missed the Vim practice. 🥋

[ Try again ]
[ Next → ]
```

The feedback should remain compact.

---

# 17. Keystroke Counter

Display the number of meaningful keyboard inputs used during the attempt.

Example:

```text
9 keystrokes · 1.2s
```

The counter should not initially attempt to establish a universal "optimal" score.

Different Vim solutions can legitimately have different lengths.

Later, challenges may optionally specify:

```ts
idealKeystrokes?: number;
```

but this should not be required for MVP.

---

# 18. Timer

Start the timer when the user first interacts with the challenge.

Stop when the challenge is completed.

Display:

```text
1.24s
```

The timer is informational rather than competitive.

Do not pressure users with a countdown.

---

# 19. Challenge Navigation

After completion:

```text
[ Next → ]
```

Allow the user to:

* Go to next challenge
* Retry current challenge
* View hints

Avoid complicated navigation.

A small progress indicator is enough:

```text
7 / 20
```

---

# 20. Randomization

The first version may use a deterministic challenge order.

Later, support:

```text
Random challenge
```

Randomization should still respect difficulty/category progression.

Example:

```text
Practice → Text Objects → Random
```

This can be added after the MVP.

---

# 21. Persistence

No account system.

No backend required for MVP.

Store minimal progress in `localStorage`:

```ts
{
  completedChallenges: [...],
  attempts: [...],
  lastChallenge: "...",
}
```

Optional.

If persistence becomes annoying, it is acceptable for the first version to reset when the page is refreshed.

---

# 22. URL State

Support directly opening a challenge:

```text
/vim?challenge=text-object-01
```

This allows individual challenges to be shared.

Optional future format:

```text
/vim/text-object-01
```

Do not build routing complexity unless it becomes useful.

---

# 23. Keyboard-First UX

Because this is a Vim playground, the UI itself should avoid requiring unnecessary mouse interaction.

After loading a challenge:

* Editor should be focused.
* Vim should start in Normal mode.
* The user should be able to complete the challenge entirely from the keyboard.

The page should not constantly steal focus from the editor.

---

# 24. Accessibility

Basic accessibility requirements:

* Challenge description is readable without relying on color.
* Success/failure feedback is textual.
* Buttons are keyboard accessible.
* Focus state is visible.
* Sufficient contrast.
* Do not rely exclusively on icons.

The editor itself should remain the primary interaction.

---

# 25. Responsive Design

Desktop should be the primary target.

Mobile should remain usable but does not need to be optimized for serious Vim practice.

Desktop layout:

```text
┌──────────────────────────────────────────┐
│ Sabililhaq                               │
│                                          │
│ Vim Dojo                                 │
│ Practice Vim. Don't learn Vim.           │
│                                          │
│ Challenge                                │
│ Change "production" to "staging".        │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ editor                               │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ 7 / 20                    9 keystrokes   │
└──────────────────────────────────────────┘
```

Avoid full-screen IDE aesthetics.

---

# 26. Visual Design

Follow the existing `sabililhaq.com` design language.

Prioritize:

* Typography
* Whitespace
* Simple borders
* Minimal decoration
* Existing site navigation
* Existing color system

Avoid:

* Gradients
* Cards everywhere
* Gamification-heavy UI
* Large hero illustrations
* Animated progress bars
* Excessive icons

The editor should visually feel like a natural part of the personal site.

---

# 27. Technical Architecture

Recommended stack:

```text
Astro
  │
  └── /vim
       │
       └── Client-side Vim Dojo
             │
             ├── CodeMirror 6
             │
             ├── @replit/codemirror-vim
             │
             ├── Challenge engine
             │
             ├── Validator
             │
             └── Interaction telemetry
```

No backend for MVP.

No WebSocket.

No database.

No server-side Vim.

---

# 28. Suggested Code Structure

```text
src/
├── pages/
│   └── vim.astro
│
├── components/
│   └── vim/
│       ├── VimDojo.ts
│       ├── VimEditor.ts
│       ├── ChallengeView.ts
│       ├── ChallengeResult.ts
│       └── Hint.ts
│
├── data/
│   └── vim/
│       ├── challenges.ts
│       ├── motions.ts
│       ├── operators.ts
│       ├── text-objects.ts
│       ├── search.ts
│       └── macros.ts
│
└── lib/
    └── vim/
        ├── validator.ts
        ├── telemetry.ts     # §11a event stream capture
        ├── classifier.ts    # §12a heuristic rules
        └── scoring.ts
```

Keep challenge content separate from the application logic.

---

# 29. Challenge Data Example

```ts
export const challenges = [
  {
    id: "text-object-01",

    title: "Change quoted text",

    description:
      'Change "production" to "staging".',

    category: "text-object",

    difficulty: "easy",

    initialContent:
      'const environment = "production";',

    targetContent:
      'const environment = "staging";',

    initialCursor: {
      line: 0,
      column: 22,
    },

    concepts: [
      "change",
      "text-object",
      "quote",
    ],

    hints: [
      "Think about text objects.",
      "Change the contents inside the quotes.",
      'Try `ci"`.',
    ],
  },
];
```

---

# 30. MVP Challenge Set

Ship in two phases rather than writing all ~20 up front:

**Phase 0 (build + validate classifier): 6-8 challenges**

```text
2  basic motions
2  operators
3  text objects
1  visual mode (to specifically exercise the §12a visual+mouse rule)
```

Use this phase to dogfood the §12a classification heuristic against your own real usage before writing more content. Tune thresholds if the classifier disagrees with what you know you actually did.

**Phase 1 (fill out to MVP): remaining ~12-14 challenges**

```text
1  more basic motion
1  more operator
1  more text object
2  search
2  counts
2  repetition
1  more visual mode
1  search/replace
1  macro
```

~20 challenges total once both phases land. Do not try to cover all of Vim.

The goal is to demonstrate the concept.

---

# 31. Analytics

No external analytics should be required.

If basic anonymous statistics are eventually useful, track only aggregate information such as:

```text
challenge completed
challenge category
completion method
time
keystroke count
```

Do not collect typed document contents unless explicitly needed.

For MVP, no analytics is perfectly fine.

---

# 32. Error Handling

If the Vim editor fails to initialize:

```text
Unable to initialize the Vim editor.

Please refresh the page or try another browser.
```

Do not allow a broken editor to leave the page looking like an empty challenge.

---

# 33. Performance

The application should remain lightweight.

Requirements:

* No backend request required to start a challenge.
* Challenge definitions bundled with the application.
* Lazy-load Vim editor code if practical.
* Avoid unnecessary dependencies.
* Avoid large syntax-highlighting packages unless required.

The page should feel instant.

---

# 34. Non-Goals

The following are explicitly out of scope for the first version:

* Full Vim implementation
* Neovim server
* Multiplayer
* Leaderboards
* Accounts
* Authentication
* Cloud-saved progress
* Social profiles
* Achievements
* XP
* Daily streaks
* AI-generated challenges
* AI hints
* Competitive ranking
* Mobile-first Vim experience
* Complete Vim documentation
* Command-level vim grammar parsing (§11a approach 2) — deferred post-MVP

---

# 35. Future Ideas

Only consider these after the core experience works.

### Daily challenge

```text
Today's challenge
```

### Random practice

```text
Give me another challenge
```

### Skill-specific practice

```text
Text objects
Search
Macros
Operators
```

### Personal statistics

```text
Challenges completed: 47
Vim solutions: 41
Manual solutions: 6
```

### Better Vim telemetry

Show:

```text
You used:
ciw
f
.
```

Requires §11a approach 2 (command-level parsing).

### Challenge quality scoring

Compare:

```text
Your solution: 8 keystrokes
Typical solution: 6
```

But this should be treated as informational rather than competitive.

---

# 36. MVP Definition of Done

The first version is complete when a user can:

1. Open `sabililhaq.com/vim`.
2. Read the short disclaimer.
3. Start a challenge immediately.
4. Edit a CodeMirror buffer using Vim.
5. Complete the challenge.
6. Receive validation based on the final buffer.
7. See basic completion information.
8. Receive different feedback if they relied on manual editing.
9. Request a hint.
10. Retry the challenge.
11. Move to the next challenge.
12. Complete the Phase 0 challenge set (§30) with the classifier validated against real usage before Phase 1 content is written.
13. Complete approximately 20 curated challenges total (Phase 0 + Phase 1).

The application should feel complete **without requiring an account, backend, database, or server**.

---

# 37. Core Product Statement

The simplest description of the product should be:

> **Vim Dojo**
>
> Practice Vim. Don't learn Vim.

And the underlying principle:

> **There are no wrong ways to finish a challenge. But there are ways that teach you more.**
