# @p4/realtime

Typed Socket.IO transport for persisted per-user notifications and process progress.

- `@p4/realtime/shared`: authentication schema and event contracts.
- `@p4/realtime/server`: server factory with injected authentication, replay, acknowledgement and wake-up adapters. No application models are imported here.
- `@p4/realtime/browser`: `createRealtimeClient`; supply a current-token getter, event handler, resync callback and session-expired callback.

P4's API adapter persists events and uses PostgreSQL notifications to wake connected clients. Polling also catches missed wake-ups. Reconnect sends an offset and replays only that authenticated user's events. Event IDs are strings because PostgreSQL sequences can exceed JavaScript's safe integer range.

Reset/disconnect on account changes. Refresh expired access tokens through the existing auth module and reconnect. UI consumers should merge notifications by ID and process snapshots by version. The socket is a delivery signal; persisted HTTP resources remain the source of truth.

Build with `pnpm --filter @p4/realtime build`; typecheck with `pnpm --filter @p4/realtime typecheck`.
