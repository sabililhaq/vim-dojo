# Roadmap

Vim Dojo is a learning tool that builds muscle memory. It is not a beginner tutorial. You should already know Normal mode. The dojo then makes that knowledge automatic: short, realistic edits, scored on whether you used Vim.

No accounts. No leaderboards. No skill trees.

## Next

These are the learning modes the dojo is missing.

### Play by category

Pick a category and stay in it. `?category=motion` should load only that set. Next / Previous stay inside the filter. Difficulty can be a second filter once there are enough hard cases.

This is the first gap: the data is already categorized, the UI is not.

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

If you open the dojo with no query, yesterday's daily can stay available until you start today's.

### Interactive hints

Text hints stay. They are the first layer.

Interactive hints are the next layer: they teach *in the buffer*, not in a paragraph.

| Layer | What it does |
| --- | --- |
| 1. Text | Current behavior. Direction, then intended keys. |
| 2. Target | Highlight the span that must change. No keys revealed. |
| 3. Next key | Ghost the next character of `intendedMove` after another Hint press. Advance one key at a time. |
| 4. Guided replay | After the last hint, optionally play the intended keys as a replay you can retry against. |

Wrong-key nudge (optional, later): if the first key is not a prefix of `intendedMove` and not `Esc` / undo, flash the target again. Never auto-type the solution.

Interactive hints must work from the existing `hints`, `intendedMove`, `initialCursor`, and `targetContent` fields. Challenge authors should not have to write a second hint format.

## Later

Only after the modes above exist.

- More categories: search (`/`, `n`, `*`), counts (`3w`, `2dd`), macros, replace (`:s`). Same file-per-category pattern as today.
- Harder cases. Most of the set is easy on purpose.
- Concept review: "practice `daw` again" from the cases that already list it in `concepts`.
- Host options for the site embed: default mode, hide the intro, start on today's daily.

## Not doing

- Accounts, cloud progress, or login.
- Leaderboards, ratings, or public streaks.
- A beginner tutorial that replaces [VimHero](https://www.vim-hero.com/lessons/basic-movement).
- AI-generated hints or challenges. Cases stay hand-written.

## Suggested order

1. Category filter and `?category=`.
2. Random mode over unsolved cases.
3. Daily kata.
4. Interactive hints, starting with target highlight, then next-key ghosts.
