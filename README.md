# Vim Dojo

Practice Vim. Don't learn Vim.

A browser playground for building Vim muscle memory. It is not a beginner tutorial.

## Develop

```sh
npm install
npm test
npm run dev
```

`npm run dev` opens the standalone playground.

## Use from another app

```ts
import { mountVimDojo } from 'vim-dojo';

mountVimDojo(document.querySelector('#dojo'), {
  basePath: '/vim',
});
```

The host page can theme the dojo with the same CSS variables as [sabililhaq.com](https://sabililhaq.com): `--accent`, `--black`, `--gray`, `--gray-light`, `--gray-dark`.

## Install

Local, while the lab still lives on this machine:

```json
"vim-dojo": "file:/Users/sabilihaqiphone/Playgrounds/vim-dojo"
```

After the GitHub repo exists, consume it the same way the site consumes `obscenity`:

```json
"vim-dojo": "github:sabililhaq/vim-dojo#v0.1.0"
```

Create the public repo, push `main`, tag a version, then switch the site off the `file:` path so CI can install it.
