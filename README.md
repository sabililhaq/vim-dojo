# Vim Dojo

Practice Vim. Don't learn Vim.

A browser playground for building muscle memory on ordinary editing tasks. It is not a beginner tutorial. New to Vim? Start with [VimHero Basic Movement](https://www.vim-hero.com/lessons/basic-movement).

[ROADMAP.md](ROADMAP.md) is the learning plan. Category play, random review, and a daily kata are in the dojo. Interactive hints are next.

## Add a challenge

This project grows when people add realistic cases.

1. Fork the repo.
2. Append a case to the matching file in [`src/challenges/`](src/challenges).
3. Run `npm test` and `npm run dev`.
4. Open a pull request.

[CONTRIBUTING.md](CONTRIBUTING.md) has the template, field rules, and how to add a new category.

## Play locally

```sh
npm install
npm test
npm run dev
```

## Embed

```ts
import { mountVimDojo } from 'vim-dojo';

mountVimDojo(document.querySelector('#dojo'), {
  basePath: '/vim',
});
```

Query params: `?category=motion`, `?mode=random`, `?mode=daily` (or `?daily`). Combine category with random. Deep-link a case with `?challenge=motion-01`.

The host can theme it with `--accent`, `--black`, `--gray`, `--gray-light`, `--gray-dark`, `--bg`, and `--surface`. Invert the RGB triples for dark mode.

```json
"vim-dojo": "github:sabililhaq/vim-dojo#v0.1.8"
```
