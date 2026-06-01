# Usage Examples

## Generate Before Vite Build

```json
{
  "scripts": {
    "prebuild": "react-build-reload generate",
    "build": "vite build"
  }
}
```

Vite copies `public/build-version.json` to `/build-version.json` during build.

## Generate with CI Build ID

```bash
react-build-reload generate --build-id "$GITHUB_SHA" --environment production
```

## Prompt Mode

```tsx
<BuildReloadWatcher reloadMode="prompt" />
```

Shows a small refresh prompt when a new build is detected. This is the default and safest mode for user-facing apps.

## Auto Reload

```tsx
<BuildReloadWatcher reloadMode="auto" reloadDelay={3000} />
```

Reloads after a new build is detected. Use this for dashboards, internal tools, or monitoring screens where showing the latest version is more important than preserving unsaved input.

## Manual Callback

```tsx
<BuildReloadWatcher
  reloadMode="manual"
  onNewBuild={({ latestBuildId }) => {
    showToast(`New build available: ${latestBuildId}`);
  }}
/>
```

Use this when the application already has its own modal, toast, or unsaved-work flow.

## Custom Version URL

```tsx
<BuildReloadWatcher versionUrl="/api/version" />
```

The endpoint must return JSON with `buildId`.

## Disabled in Development

```tsx
<BuildReloadWatcher enabled={import.meta.env.PROD} />
```

This avoids noisy local errors when `/build-version.json` is not available during development.

## Hook with Custom UI

```tsx
function ReloadToast() {
  const { isNewBuildAvailable, reloadApp, dismissPrompt } = useBuildReload({
    reloadMode: "manual"
  });

  if (!isNewBuildAvailable) return null;

  return (
    <div>
      <span>A new version is available.</span>
      <button onClick={dismissPrompt}>Later</button>
      <button onClick={reloadApp}>Refresh</button>
    </div>
  );
}
```
