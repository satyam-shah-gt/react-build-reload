# Deployment: Netlify

Generate `public/build-version.json` on Netlify so the runtime
watcher can detect new deploys.

The CLI does not read Netlify-specific env vars by default, so pass
`--build-id` and `--environment` explicitly when you need them.

## Vite + React (recommended)

Use a `prebuild` script in `package.json`:

```json
{
  "scripts": {
    "prebuild": "react-build-reload generate",
    "build": "vite build"
  }
}
```

Netlify runs `npm run build` for Vite projects. The `prebuild`
script fires before the Vite build, and Vite copies
`public/build-version.json` to the deployment root, served at
`/build-version.json`.

No `netlify.toml` change is required.

## Using the commit SHA as the build ID

Netlify exposes the commit SHA in the `COMMIT_REF` env var. The CLI
does not pick it up automatically, so pass it explicitly:

```json
{
  "scripts": {
    "prebuild": "react-build-reload generate --build-id \"$COMMIT_REF\""
  }
}
```

## Per-deploy IDs

For a unique build ID per deploy, combine the commit SHA and the
deploy ID:

```json
{
  "scripts": {
    "prebuild": "react-build-reload generate --build-id \"$COMMIT_REF-$DEPLOY_ID\""
  }
}
```

`DEPLOY_ID` is set by Netlify for every build.

## Tagging the environment

```json
{
  "scripts": {
    "prebuild": "react-build-reload generate --environment netlify"
  }
}
```

For branch deploys, Netlify sets `CONTEXT` to `branch-deploy`,
`deploy-preview`, or `production`. The CLI does not read it, but
you can:

```json
{
  "scripts": {
    "prebuild": "react-build-reload generate --environment \"$CONTEXT\""
  }
}
```

## Build plugins

The library does not ship a Netlify build plugin. The `prebuild`
script approach is equivalent and does not require additional
configuration. If you want the generator in a Netlify Build Plugin
later, the `createBuildInfo` and `writeBuildInfo` helpers in
`bin/react-build-reload.js` are exported and reusable.
