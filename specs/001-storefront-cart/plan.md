# Implementation Plan: Storefront cart

**Branch**: `chore/spec-kit-pilot` | **Date**: 2026-11-07
**Spec**: [spec.md](spec.md)

## Summary

Connect the existing Storefront cart route to the current API and add a guest-to-account handoff. Follow the dependencies in FE-12.

## Technical Context

React, TypeScript, TanStack Query and @p4/api-sdk in the existing pnpm monorepo. Reuse the P4 UI kit. Scope HTTP resource hooks to libs/api-sdk and cart interactions to apps/web/src/modules/storefront/cart.

## Constitution Check

The plan uses the generated contract, scopes cache and retries by account, reuses the UI kit and provides local API acceptance scenarios. No exception is needed.

## Design

- [Research decisions](research.md)
- [Data model](data-model.md)
- [Existing API contract](contracts/cart.md)
- [Acceptance walkthrough](quickstart.md)

## Sequence

Build SDK bindings first. Verify signed-in cart CRUD, then add guest persistence and merge recovery. Integrate SKU actions when FE-44 is available and check version conflicts before handing off to checkout.

## Contract để bàn giao FE

Dấu `*` chỉ input bắt buộc trong schema. Lỗi là các mã được khai báo cho operation; quy tắc nghiệp vụ và giá trị enum đầy đủ đọc từ [OpenAPI](../../apps/api/openapi.yaml) và type sinh trong `@p4/api-sdk`.

| Operation | Quyền / sử dụng | Input | Thành công | Lỗi khai báo |
| --- | --- | --- | --- | --- |
| `GET /api/cart` | Có phiên · Task sở hữu | — | `200` `data Cart` | 401, 403, 429 |
| `POST /api/cart/items` | Có phiên · Task sở hữu | body `variantId*`, `quantity*`, `expectedVersion*` | `201` `data Cart` | 400, 401, 403, 409, 429 |
| `DELETE /api/cart/items` | Có phiên · Task sở hữu | body `expectedVersion*` | `200` `data Cart` | 400, 401, 403, 409, 429 |
| `PATCH /api/cart/items/{id}` | Có phiên · Task sở hữu | path `id*`<br>body `expectedVersion*`, `quantity*` | `200` `data Cart` | 400, 401, 403, 404, 409, 429 |
| `DELETE /api/cart/items/{id}` | Có phiên · Task sở hữu | path `id*`<br>body `expectedVersion*` | `200` `data Cart` | 400, 401, 403, 404, 409, 429 |
| `POST /api/cart/merge` | Có phiên · Task sở hữu | header `Idempotency-Key*`<br>body `items` | `200` `data { result, replayed }` | 400, 401, 403, 409, 429 |
