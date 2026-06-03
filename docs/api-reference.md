# API Reference

## `BuildReloadWatcher`

```tsx
<BuildReloadWatcher />
```

Component that starts polling, handles chunk load errors, and renders the default prompt UI when needed.

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `versionUrl` | `string` | `"/build-version.json"` | URL that returns the latest build info. |
| `currentBuildId` | `string` | first fetched `buildId` | Current running app build ID. |
| `checkInterval` | `number` | `60000` | Poll interval in milliseconds. Minimum runtime interval is clamped to 1000 ms. |
| `reloadMode` | `"prompt" \| "auto" \| "manual"` | `"prompt"` | What happens when a new build is detected. |
| `reloadDelay` | `number` | `0` | Delay before automatic reload in `auto` mode. |
| `enabled` | `boolean` | `true` | Enables or disables polling. |
| `reloadOnChunkError` | `boolean` | `true` | Reload once when common dynamic import/chunk failures occur. |
| `checkOnWindowFocus` | `boolean` | `true` | Re-runs the version check when the document becomes visible or the window regains focus. |
| `onNewBuild` | `(payload) => void` | `undefined` | Called once when a new build is detected. |
| `onError` | `(error) => void` | `undefined` | Called when fetching or parsing build info fails. |
| `promptMessage` | `ReactNode` | default message | Prompt text or node. |
| `refreshButtonLabel` | `string` | `"Refresh"` | Refresh button label. |
| `dismissButtonLabel` | `string` | `"Dismiss"` | Dismiss button label. |
| `promptPosition` | `"top" \| "bottom"` | `"bottom"` | Default prompt position. |
| `showDismissButton` | `boolean` | `true` | Whether the prompt includes a dismiss button. |

## `useBuildReload`

```tsx
const state = useBuildReload(options);
```

Hook for custom UI or manual integration.

### Return Value

| Field | Type | Description |
| --- | --- | --- |
| `isNewBuildAvailable` | `boolean` | True after a different latest `buildId` is detected. |
| `currentBuildId` | `string \| null` | Running app build ID. |
| `latestBuildId` | `string \| null` | Latest fetched build ID. |
| `latestBuildInfo` | `BuildInfo \| null` | Full latest response object. |
| `error` | `Error \| null` | Last non-abort error from version checking. |
| `reloadApp` | `() => void` | Reloads the current page. |
| `checkNow` | `() => Promise<void>` | Runs an immediate version check. |
| `dismissPrompt` | `() => void` | Clears the prompt state locally. |

## Types

```ts
type ReloadMode = "prompt" | "auto" | "manual";

interface BuildInfo {
  buildId: string;
  version?: string;
  builtAt?: string;
  environment?: string;
  [key: string]: unknown;
}

interface NewBuildPayload {
  currentBuildId: string;
  latestBuildId: string;
  latestBuildInfo: BuildInfo;
}
```

## CLI

```bash
react-build-reload generate [options]
```

Creates a JSON build metadata file for the runtime watcher.

| Option | Default | Description |
| --- | --- | --- |
| `--out <path>` | `public/build-version.json` | Output file path. Parent folders are created automatically. |
| `--build-id <id>` | env/git/timestamp | Build ID to write. |
| `--version <version>` | app `package.json` version or `0.0.0` | Version value to write. |
| `--environment <name>` | `NODE_ENV` or `production` | Environment value to write. |
| `--no-git` | disabled | Skips git metadata lookup. |

Generated files include `buildId`, `version`, `builtAt`, `environment`, and `name` when available. Git metadata is included when git is available and `--no-git` is not used.
