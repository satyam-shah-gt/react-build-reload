# Roadmap

These items are intentionally outside the MVP.

## Future Features

- Multi-tab synchronization with `BroadcastChannel` or storage events.
- Custom prompt render prop or component slot.
- Toast notification integrations.
- Next.js-specific guidance and compatibility helpers.
- Service worker update coordination.
- Vite or Webpack plugin wrappers around the existing generator.
- Deployment metadata display.
- Environment-specific behavior.
- Pause checks while users are typing.
- Check immediately when a tab becomes active again.

## Non-MVP Boundaries

The MVP remains focused on React runtime behavior:

- Poll a version URL.
- Compare build IDs.
- Prompt, reload, or call a callback.
- Recover once from chunk load failures.
- Avoid breaking the app when version checks fail.
