# P4 Constitution

## I. Contract First

Use the existing OpenAPI contract and generated SDK types. Keep HTTP calls and resource hooks in the SDK. Backend contract changes require a specific reason and synchronized OpenAPI and SDK generation.

## II. Preserve Ownership and State

Use the signed-in account as the scope for private data. Respect server versions and idempotency keys. Preserve existing callers when extending a contract.

## III. Reuse the Product UI

Use @itclabs/react-ui and existing P4 blocks. Keep screen interactions in the feature and shared behavior in existing packages.

## IV. Verify User Outcomes

Every feature has observable acceptance scenarios. Check success, empty, loading and recovery states where relevant. Verify integrations against the local API and record results before marking a task done.

## Governance

The existing frontend backlog owns scheduling and status. Feature specs refine the linked task. Update the spec and plan when an accepted behavior changes. Review any exception in the feature plan.

**Version**: 1.0.0 | **Ratified**: 2026-11-07 | **Last Amended**: 2026-11-07
