# Contributing

Thanks for your interest in `react-build-reload`. This document covers the
basics of working on the library locally.

## Repository

- Source of truth: <https://github.com/satyam-shah-gt/react-build-reload>
- Issues and pull requests: <https://github.com/satyam-shah-gt/react-build-reload/issues>
- License: MIT (see [`LICENSE`](./LICENSE))

## Local setup

```bash
git clone https://github.com/satyam-shah-gt/react-build-reload.git
cd react-build-reload
npm install
```

You need a recent Node.js (the project targets ES2020 and the current
Vite/Vitest toolchain).

## Scripts

| Script | What it does |
| --- | --- |
| `npm run typecheck` | Runs `tsc --noEmit` against the source. |
| `npm test` | Runs the Vitest suite once. |
| `npm run test:watch` | Runs Vitest in watch mode. |
| `npm run build` | Builds ESM + CJS into `dist/` and emits `.d.ts` types. |
| `npm run generate:version` | Runs the CLI against the repo for a smoke test. |

Before opening a pull request, all of these must pass locally:

```bash
npm run typecheck
npm test
npm run build
```

## Project layout

```
src/
  components/BuildReloadWatcher.tsx
  hooks/useBuildReload.ts
  utils/
    chunkErrors.ts
    compareBuildId.ts
    fetchBuildInfo.ts
    reloadPage.ts
  types/index.ts
  index.ts
bin/react-build-reload.js
docs/
```

Public API and behavior live in `src/`. The CLI lives in `bin/`.
Documentation lives in `docs/` and is published with the npm package.

## Adding a new option or feature

The `add-watcher-option` skill in `.opencode/skill/` documents the
exact pattern. The short version:

1. Add the option to `BuildReloadConfig` in `src/types/index.ts`.
2. Wire it into `useBuildReload` with a default constant, destructure
   default, and a dedicated `useEffect` if it needs lifecycle work.
3. Add tests in `src/__tests__/useBuildReload.test.tsx` mirroring the
   existing `describe` blocks.
4. Document it in `docs/api-reference.md` and add a bullet to the
   `## Unreleased` section of `CHANGELOG.md`.

## Coding style

- TypeScript strict mode is on. Do not weaken types to make tests pass.
- Do not add comments unless they explain something non-obvious (for
  example, reload-loop prevention or chunk-error detection).
- React 18+ is a peer dependency. Do not bundle React.
- Keep the default export surface small. New public helpers go in
   `src/utils/` and are re-exported from `src/index.ts` only when there
   is a clear consumer need.

## Pull requests

- One logical change per pull request. A new option, a CLI flag, and a
  doc rewrite should be three PRs.
- Include tests for any new behavior. A bug fix should include a
  regression test.
- Update `CHANGELOG.md` under `## Unreleased`.
- Do not bump the version or publish as part of the PR. The maintainer
  cuts releases.
