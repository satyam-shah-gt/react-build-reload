# Version File

The library needs a URL that returns the latest deployed build ID. You can create this file with the included CLI.

## Generate the File

```bash
react-build-reload generate
```

Default output:

```txt
public/build-version.json
```

Recommended app setup:

```json
{
  "scripts": {
    "prebuild": "react-build-reload generate",
    "build": "vite build"
  }
}
```

## Required Shape

```json
{
  "buildId": "abc123"
}
```

`buildId` must be a non-empty string. It should change on every frontend deployment.

## Optional Metadata

```json
{
  "buildId": "abc123",
  "version": "1.0.0",
  "builtAt": "2026-05-30T12:30:00Z",
  "environment": "production"
}
```

Optional fields are preserved in `latestBuildInfo` and passed to `onNewBuild`.

## Cache Safety

Every version check adds a timestamp query param:

```txt
/build-version.json?t=123456789
```

The request also uses `cache: "no-store"`. This reduces the chance of comparing against stale browser-cached metadata.

## Deployment Responsibility

The consuming app owns when the file is generated and deployed. The included CLI writes the file, but your app build or CI pipeline must run it before publishing assets.
