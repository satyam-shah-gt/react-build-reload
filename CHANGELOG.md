# Changelog

All notable changes to this project will be documented in this file.

This project follows semantic versioning where possible.

## 0.3.0 
### Added

- Added `pauseWhenOffline` option (default `true`) to skip version checks while the browser is offline and run an immediate check when it regains connectivity.

## 0.2.0 
### Added

- Added `checkOnWindowFocus` option (default `true`) to re-run the version check when the document becomes visible or the window regains focus.

## 0.1.2 
### Added

- Added `CHANGELOG.md` file .

## 0.1.1

### Added

- Added `.npmignore` for cleaner npm package publishing.
- Added package metadata for author and issue tracking.
- Added README sections for website, author, free use, no warranty, and contributing.
- Added `react-build-reload generate` CLI for creating `public/build-version.json`.
- Added generated build metadata fields: `buildId`, `version`, `builtAt`, `environment`, `name`, and optional git metadata.
- Added CLI tests, including npm `.bin` symlink invocation coverage.
- Added docs for generator usage and build integration.

### Fixed

- Fixed CLI execution when invoked through `node_modules/.bin/react-build-reload`.

## 0.1.0

### Added

- Added `BuildReloadWatcher` React component.
- Added `useBuildReload` hook.
- Added build version polling with cache-safe fetch URLs.
- Added prompt, auto, and manual reload modes.
- Added chunk load error detection and one-time reload recovery.
- Added TypeScript types and package exports.
- Added README and initial documentation pages.
- Added unit and component tests for core behavior.
