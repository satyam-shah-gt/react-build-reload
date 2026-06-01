# react-build-reload

React library for detecting when a new frontend build is available and helping the app refresh safely.

## Website

Homepage: [react-refresh-website.satyamshah.workers.dev](https://react-refresh-website.satyamshah.workers.dev)

## Install

```bash
npm install react-build-reload
```

React is a peer dependency. The consuming app must provide React and React DOM.

## Quick Start

Generate the version file before building your app:

```bash
npx react-build-reload generate
```

This creates `public/build-version.json`.

Add the watcher near the root of your app:

```tsx
import { BuildReloadWatcher } from "react-build-reload";

export function App() {
  return (
    <>
      <BuildReloadWatcher
        versionUrl="/build-version.json"
        checkInterval={60_000}
        reloadMode="prompt"
      />
      <MainApp />
    </>
  );
}
```

The generated version file looks like this:

```json
{
  "buildId": "abc123-20260530123000",
  "version": "1.0.0",
  "builtAt": "2026-05-30T12:30:00.000Z",
  "environment": "production"
}
```

When `buildId` changes, the library can show a prompt, reload automatically, or call your callback.

## Defaults

```tsx
<BuildReloadWatcher
  versionUrl="/build-version.json"
  checkInterval={60000}
  reloadMode="prompt"
  reloadOnChunkError={true}
/>
```

## Hook Usage

```tsx
import { useBuildReload } from "react-build-reload";

function CustomReloadNotice() {
  const { isNewBuildAvailable, reloadApp } = useBuildReload({
    reloadMode: "manual"
  });

  if (!isNewBuildAvailable) return null;

  return <button onClick={reloadApp}>Refresh now</button>;
}
```

## Documentation

- [Getting started](docs/getting-started.md)
- [API reference](docs/api-reference.md)
- [Version file](docs/version-file.md)
- [Usage examples](docs/usage-examples.md)
- [Roadmap](docs/roadmap.md)

## Scope

This package handles runtime build checks in React apps and includes a small CLI to create `build-version.json`. It does not provide Vite/Webpack/Next.js plugins or manage service workers.

## Author

Created by [Satyam Shah](https://github.com/satyam-shah-gt).

## Free to Use

`react-build-reload` is free to use under the MIT license.

## No Warranty

This package is provided as-is, without any warranty. The author is not liable for any damages, data loss, downtime, or other issues caused by using this package. Review and test it in your own environment before using it in production.

## Contributing

Contributions are welcome. Please open an issue or pull request on the repository:

[github.com/satyam-shah-gt/react-build-reload](https://github.com/satyam-shah-gt/react-build-reload)

Before submitting changes, run:

```bash
npm run typecheck
npm test
npm run build
```
