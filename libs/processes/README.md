# @p4/processes

Shared contracts and browser helpers for background import, export and media processing.

- `@p4/processes/shared`: runtime schemas, inferred DTOs, supported resources, spreadsheet column schemas and process states.
- `@p4/processes/browser`: `createProcessApi` and `useProcess`. Supply an API origin and token getter from the application's auth provider; the library never stores credentials.
- `useProcess` accepts an optional event subscription and also polls persisted state. Memoize the API client/event adapter so component renders do not restart tracking.
- Imports validate first and require explicit confirmation. A process can finish with row errors; render issues instead of treating the whole file as successful. Inventory quantities are ledger adjustments.
- Upload batches send images directly to signed storage endpoints with concurrency three. Completion verification runs in the worker and returns the same process contract.

Build with `pnpm --filter @p4/processes build`; typecheck with `pnpm --filter @p4/processes typecheck`. Browser/server consumers use explicit subpaths to keep React out of the worker dependency graph.
