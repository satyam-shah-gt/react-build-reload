# Getting Started

`react-build-reload` watches a build version endpoint and detects when the running app is older than the deployed app.

## 1. Install

```bash
npm install react-build-reload
```

## 2. Generate a Version File

Run this in your app before building:

```bash
npx react-build-reload generate
```

This creates:

```txt
public/build-version.json
```

Example output:

```json
{
  "buildId": "abc123-20260530123000",
  "version": "1.0.0",
  "builtAt": "2026-05-30T12:30:00.000Z",
  "environment": "production",
  "name": "my-app"
}
```

The default URL is:

```txt
/build-version.json
```

The generator uses an explicit build ID, common CI environment variables, git metadata, or a timestamp fallback. The runtime library only requires `buildId`.

Add it to your app build scripts:

```json
{
  "scripts": {
    "prebuild": "react-build-reload generate",
    "build": "vite build"
  }
}
```

## 3. Add the Watcher

```tsx
import { BuildReloadWatcher } from "react-build-reload";

function App() {
  return (
    <>
      <BuildReloadWatcher />
      <MainApp />
    </>
  );
}
```

By default, the watcher checks every 60 seconds and shows a refresh prompt when a new build is detected.

## 4. Use Your Own Endpoint

```tsx
<BuildReloadWatcher versionUrl="/api/version" />
```

The endpoint should return JSON with a non-empty `buildId`.

## 5. Disable in Development

```tsx
<BuildReloadWatcher enabled={import.meta.env.PROD} />
```

This keeps local development from repeatedly checking a file that may not exist.

## 6. Generator Options

```bash
react-build-reload generate --out public/build-version.json
react-build-reload generate --build-id "$GITHUB_SHA"
react-build-reload generate --environment staging
react-build-reload generate --version 2.0.0
react-build-reload generate --no-git
```
