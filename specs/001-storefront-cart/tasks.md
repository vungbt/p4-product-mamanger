# Tasks: Storefront cart

## Foundation

- [ ] T001 Verify FE-44 and FE-45 dependencies and review the generated cart contract, including the merge response.
- [ ] T002 Add typed cart hooks and account-scoped query keys in libs/api-sdk. Invalidate the account cart after mutations.

## US1 — Signed-in cart

- [ ] T003 [US1] Connect apps/web/src/modules/storefront/cart to the account snapshot and render loading, empty and error states.
- [ ] T004 [US1] Wire add, quantity edits, remove and clear to server versioned mutations. Refresh on conflict and let the shopper review before retrying.

## US2 — Guest handoff

- [ ] T005 [US2] Persist guest variant IDs and quantities and retain edits across reload.
- [ ] T006 [US2] Merge after sign-in using a stable account-scoped key and immutable payload. Handle retry, acknowledgement and edits made while pending.
- [ ] T007 [US2] Verify reload, lost response and account isolation against the local API.

## US3 — Before checkout

- [ ] T008 [US3] Display current server prices and availability and guide the shopper to resolve invalid quantities.
- [ ] T009 [US3] Execute the acceptance walkthrough and update FE-12 with results.

T001 precedes T002. Complete T002 before wiring server mutations. T005 can proceed alongside the signed-in screen once the SKU input contract is agreed. T006 depends on T002 and T005. T009 follows the three user stories.

## Việc tích hợp theo contract

- [ ] T010 Nối query/SDK cho `GET /api/cart`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T011 Nối form hoặc action cho `POST /api/cart/items`, `DELETE /api/cart/items`, `PATCH /api/cart/items/{id}`, `DELETE /api/cart/items/{id}`, `POST /api/cart/merge`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
