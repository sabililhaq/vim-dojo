# Vim Dojo

Practice Vim. Don't learn Vim.

A browser playground for building muscle memory on ordinary editing tasks. It is not a beginner tutorial. New to Vim? Start with [VimHero Basic Movement](https://www.vim-hero.com/lessons/basic-movement).

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

The host can theme it with `--accent`, `--black`, `--gray`, `--gray-light`, and `--gray-dark`.

```json
"vim-dojo": "github:sabililhaq/vim-dojo#v0.1.0"
```
