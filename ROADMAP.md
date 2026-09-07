# Roadmap

Vim Dojo is a learning tool that builds muscle memory. It is not a beginner tutorial. You should already know Normal mode. The dojo then makes that knowledge automatic: short, realistic edits, scored on whether you used Vim.

No accounts. No leaderboards. No skill trees.

## Next

### Guided replay

After the last hint, optionally play the intended keys as a replay you can retry against.

Wrong-key nudge (optional): if the first key is not a prefix of `intendedMove` and not `Esc` / undo, flash the target again. Never auto-type the solution.

## Shipped

### Interactive hints

Text hints stay. They are the first layer.

| Layer | What it does |
| --- | --- |
| 1. Text | Direction, then intended keys. |
| 2. Target | Highlight the span that must change. No keys revealed on the first Hint. |
| 3. Next key | Ghost the next character of `intendedMove` after another Hint press. Advance one key at a time. |

Interactive hints work from the existing `hints`, `intendedMove`, `initialCursor`, and `targetContent` fields. Challenge authors do not write a second hint format.

### Par

A Vim solve is scored against `intendedMove`. The toast shows `N keys · par P`. Insert-mode typing, Enter, and Escape do not count. Paste and mouse solves still complete the buffer, but they do not get a ✓.

### Counts

Counted motions and operators (`3w`, `2dd`, `2dw`) are in the set.

### Play by category

Pick a category and stay in it. `?category=motion` loads only that set. Next / Previous stay inside the filter. Difficulty can be a second filter once there are enough hard cases.

### Randomized practice

A shuffle of remaining unsolved cases, optionally inside a category. `?mode=random`.

Rules:

- Prefer cases not in `vim-dojo:completed`.
- Do not reshuffle on every retry of the same case.
- A new shuffle is a separate action from Previous; it does not rewind to motion-01.

Random is for review. Category order stays the default for first-time play.

### Daily kata

One deterministic case per UTC day. `?mode=daily` or `/vim?daily`.

The day's id is `hash(YYYY-MM-DD) % challengeCount`, so everyone gets the same case and a link stays stable until midnight UTC. Completing it is stored as `vim-dojo:daily:<date>`. No streak counter, no share card.

A daily URL that includes `?challenge=` keeps that case after midnight. Open `?mode=daily` with no challenge to start today's.

## Later

- Harder cases. Most of the set is easy on purpose.
- Concept review: "practice `daw` again" from the cases that already list it in `concepts`.
- Host options for the site embed: default mode, hide the intro, start on today's daily.

## Not doing

- Accounts, cloud progress, or login.
- Leaderboards, ratings, or public streaks.
- A beginner tutorial that replaces [VimHero](https://www.vim-hero.com/lessons/basic-movement).
- AI-generated hints or challenges. Cases stay hand-written.

## Suggested order

1. Guided replay of `intendedMove`, then a wrong-key nudge that flashes the target.
