# Deployment: Vercel

Generate `public/build-version.json` on Vercel so the runtime
watcher can detect new deployments.

`VERCEL_GIT_COMMIT_SHA` is picked up automatically by the CLI as the
build ID, so no custom flag is required for the common case.

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

Vercel runs `npm run build` for Vite projects. The `prebuild` script
fires before the Vite build, and Vite copies
`public/build-version.json` to the deployment root, served at
`/build-version.json`.

That is the entire setup. No `vercel.json` change is required.

## Custom environment

To tag the build with a Vercel-specific environment name:

```json
{
  "scripts": {
    "prebuild": "react-build-reload generate --environment vercel"
  }
}
```

For preview deployments, you can pass the branch name:

```json
{
  "scripts": {
    "prebuild": "react-build-reload generate --environment preview"
  }
}
```

## Pinning the build ID

The CLI uses `VERCEL_GIT_COMMIT_SHA` when no `--build-id` is passed.
If you want a per-deploy ID instead of a per-commit ID:

```json
{
  "scripts": {
    "prebuild": "react-build-reload generate --build-id \"$VERCEL_GIT_COMMIT_SHA-$VERCEL_DEPLOYMENT_ID\""
  }
}
```

Both `VERCEL_GIT_COMMIT_SHA` and `VERCEL_DEPLOYMENT_ID` are set by
Vercel at build time.

## What gets deployed

`public/build-version.json` is served as a static asset. Set
`cache-control` headers on it from your Vite config if you want, but
the runtime watcher always appends a `?t=<timestamp>` query string
and uses `cache: "no-store"` so browser caching is not a problem in
practice.
