# Deployment: Cloudflare Pages

Generate `public/build-version.json` on Cloudflare Pages so the
runtime watcher can detect new deploys.

`CF_PAGES_COMMIT_SHA` is picked up automatically by the CLI as the
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

Cloudflare Pages runs `npm run build` for Vite projects. The
`prebuild` script fires before the Vite build, and Vite copies
`public/build-version.json` to the deployment root, served at
`/build-version.json`.

No `wrangler.toml` change is required.

## Custom environment

To tag the build with a Cloudflare-specific environment name:

```json
{
  "scripts": {
    "prebuild": "react-build-reload generate --environment cloudflare-pages"
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

The CLI uses `CF_PAGES_COMMIT_SHA` when no `--build-id` is passed.
If you want a per-deploy ID instead of a per-commit ID:

```json
{
  "scripts": {
    "prebuild": "react-build-reload generate --build-id \"$CF_PAGES_COMMIT_SHA-$CF_PAGES_URL\""
  }
}
```

Both `CF_PAGES_COMMIT_SHA` and `CF_PAGES_URL` are set by Cloudflare
Pages at build time.

## What gets deployed

`public/build-version.json` is served as a static asset. Cloudflare
Pages caches static assets at the edge by default. The runtime
watcher always appends a `?t=<timestamp>` query string and uses
`cache: "no-store"`, so the cache will not serve a stale file to
the watcher. If you want to be extra safe, add a `_headers` rule:

```
/build-version.json
  Cache-Control: no-store
```

This is optional — the cache-busting query string is enough.
