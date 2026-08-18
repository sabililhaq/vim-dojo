# Contribute a challenge

Most contributions should be a new practice case. You do not need to touch the editor or scoring.

## 1. Pick a category

| File | For |
| --- | --- |
| `src/challenges/motion.ts` | Getting the cursor to the right place (`0`, `$`, `w`, `f`, …) |
| `src/challenges/operator.ts` | Operator + motion (`dw`, `dd`, `cw`, `yt)`, …) |
| `src/challenges/text-object.ts` | `iw`, `i"`, `i(`, `it`, … |
| `src/challenges/visual.ts` | `v` / `V` / `Ctrl-v` then an operator |
| `src/challenges/search.ts` | `/`, `n`, `*` |
| `src/challenges/replace.ts` | `:s`, `:%s` |

Need counts or macros? Add a new file next to those, export an array, register it in `src/challenges/index.ts`, and add the category to `src/challenges/types.ts`.

## 2. Append one object

Copy the last case in the file and change the fields:

```ts
{
  id: 'motion-03',
  title: 'Find the flag',
  description: 'Jump to enabled and change it to disabled.',
  category: 'motion',
  difficulty: 'easy',
  initialContent: 'const enabled = flags.beta;',
  targetContent: 'const disabled = flags.beta;',
  initialCursor: { line: 0, column: 26 },
  concepts: ['f', 'cw'],
  hints: [
    'The word you need is later on the same line.',
    'Find the start of `enabled`, then change it.',
    'Try `fe` then `cwdisabled`.',
  ],
  intendedMove: 'fecw',
}
```

Rules:

- `id` is unique and starts with `<category>-`, then the next number in that file.
- The task should look like real editing. Prefer "delete this log line" over "move 17 characters right".
- `initialContent` and `targetContent` must differ. Use `'\n'` for multiple lines. Keep most buffers short (about 1–5 lines). A viewport case may be longer (about 13–20 lines) when the edit starts off-screen and the first move is a jump such as `G`, `/`, or `*`.
- `initialCursor` is 0-indexed. Place it so the intended Vim move is the natural one.
- `intendedMove` is the keys you want people to practice, without the replacement text.
- Give at least one hint. The last hint may show the intended keys.

## 3. Check it

```sh
npm test
npm run dev
```

Open the new case with `?challenge=motion-03` and solve it with the intended move.

## 4. Open a PR

One challenge per PR is easiest to review. Use the pull request checklist.

Engine or UI changes are welcome after a challenge contribution, or in a separate PR. Keep the dojo a practice tool: no accounts, leaderboards, or skill trees. See [ROADMAP.md](ROADMAP.md) before adding modes (category, random, daily) or interactive hints.
