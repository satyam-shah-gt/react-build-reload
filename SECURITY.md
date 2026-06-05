# Security

The `react-build-reload` maintainers take security reports seriously.

## Supported versions

Only the most recent minor version of `react-build-reload` receives
security fixes. Please upgrade before reporting an issue if you are
on an older version.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for suspected security
problems.

Report privately by email to the maintainer:

- GitHub: [@satyam-shah-gt](https://github.com/satyam-shah-gt)
- Repository: <https://github.com/satyam-shah-gt/react-build-reload>

Include:

- A clear description of the issue and its impact.
- Steps to reproduce, including a minimal sample if possible.
- The version of `react-build-reload` affected.
- Any relevant environment details (React version, bundler, browser).

You can expect an acknowledgement within a few days. A fix and an
advisory will be coordinated privately before any public disclosure.

## What this library does and does not do

`react-build-reload` polls a build version URL and reloads the page or
fires a callback when a new build is detected. It does not:

- Make network requests to anywhere other than the configured
  `versionUrl`.
- Execute remote code.
- Store or transmit user data.
- Modify the DOM outside the optional refresh prompt.
- Run in service workers or background contexts.

The only data the library writes to `localStorage` / `sessionStorage`
is the chunk-error reload marker (key
`react-build-reload:chunk-error-reloaded`) used to prevent reload
loops. This key is cleared when the page is reloaded by other means.
