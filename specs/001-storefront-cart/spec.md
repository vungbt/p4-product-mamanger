# Feature Specification: Storefront cart

**Status**: Draft
**Date**: 2026-11-07
**Backlog**: [FE-12](../../documents/p4/frontend/fe-12.md)

## User Scenarios & Testing

### US1 — Manage a signed-in cart (P1)

A shopper can view, add, change and remove SKU quantities and clear the cart.

- Given a signed-in shopper and an available SKU, adding it displays the quantity and server-returned totals.
- Given a stale cart version, an attempted edit refreshes the cart and lets the shopper review the current values before retrying.
- Given an empty cart, the shopper sees an empty state and a route back to the catalog.

### US2 — Carry a guest cart through sign-in (P2)

A guest can keep SKU quantities across reloads and bring them into their own account.

- Given a nonempty guest cart, signing in merges its lines with the account cart.
- Given a network failure after the server commits the merge, retrying the same merge does not add the quantities twice.
- Given a failed merge, guest lines remain recoverable. Given a successful merge or replay, the merged guest lines are cleared.

### US3 — Review changes before checkout (P3)

The shopper sees price or availability changes reflected in the server snapshot and can resolve invalid quantities.

## Requirements

- **FR-001**: Identify sellable items by variant ID and keep quantities within the API limits.
- **FR-002**: Use the server cart snapshot for signed-in totals and availability. Adding items does not reserve inventory.
- **FR-003**: Recover from conflicts by refreshing and requiring review before another edit.
- **FR-004**: Persist guest lines locally. Retry a pending merge with the same payload and idempotency key, scoped to the same account.
- **FR-005**: Clear the acknowledged guest snapshot after successful merge. Preserve any guest changes made while the merge was pending.
- **FR-006**: Keep account carts separate on logout and account switch.

## Success Criteria

- **SC-001**: Add, update, remove and clear show the server-confirmed cart after each successful operation.
- **SC-002**: Retrying a committed merge leaves each quantity unchanged from the first successful merge.
- **SC-003**: Failed merge, stale version and insufficient stock each leave the shopper with a usable recovery action.

## Scope

Pilot elaborates FE-12 after FE-44 and FE-45. Checkout, payment and reservation are covered by later tasks.

## Phạm vi bàn giao

Task sở hữu 6 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
