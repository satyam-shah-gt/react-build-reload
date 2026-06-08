# Deployment: GitHub Actions

Generate `public/build-version.json` on every CI run so the deployed
build has a fresh `buildId` for the runtime watcher to detect.

The default CLI flags already cover GitHub Actions: `GITHUB_SHA` is
picked up automatically as the build ID, and the environment defaults
to `production` (or whatever `NODE_ENV` you set).

## Vite + React

Add the generator to your build job before the frontend build:

```yaml
name: Build
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # required so the CLI can read git metadata

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Generate build version
        run: npx react-build-reload generate --environment production

      - run: npm run build
```

The `--environment production` flag is optional. The CLI defaults to
`NODE_ENV` or `production`.

## Pull request previews

For preview deployments, expose the same `buildId` shape so the
runtime watcher can detect preview-specific changes:

```yaml
- name: Generate build version
  run: npx react-build-reload generate --environment preview
```

## Custom build IDs

If you compose the ID from workflow metadata:

```yaml
- name: Generate build version
  run: npx react-build-reload generate --build-id "${{ github.run_id }}-${{ github.run_attempt }}"
```

## Why `fetch-depth: 0`?

`react-build-reload generate` reads `git rev-parse HEAD`,
`--short HEAD`, and `abbrev-ref HEAD` to enrich the JSON with branch
and commit metadata. A shallow checkout returns empty values for
those fields, which is fine functionally — the watcher only needs
`buildId` — but the metadata is useful for debugging.
