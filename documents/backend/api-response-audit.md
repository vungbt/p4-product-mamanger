# API responses and SDK coverage

The server DTO is the source of truth. OpenAPI is inferred from routes, validators
and TypeScript return types, then the SDK types, operation helpers and hooks are
regenerated from that document. This change covers all 291 documented operations;
it does not add frontend screens or a tenant database model.

## Resource review

The review compares explicit response projections with persisted business fields,
related endpoint responses, media references and versioned mutation requirements.
A list may deliberately return a smaller projection than a detail, but navigation,
identity and concurrency fields must not be replaced by client defaults.

| Resource | Result |
| --- | --- |
| Products/catalog | Unified list, detail, create/update and dashboard projection: slug, status, version, brand, material, care instructions, SEO, size guide reference, category, cover, ordered gallery, created/updated dates. `CatalogProduct` aliases the same contract. |
| Product variants/inventory | SKU, barcode, product reference, attributes, price, image references, publication/default state, available quantity and version retained. Inventory adds onHand/reserved; storefront excludes inactive variants. Stock writes remain inventory commands. |
| Cart | Added productSlug and imageUrl; prefers public SKU image, falls back to public cover. Variant/product/media reads are batched. Availability, price warnings, totals and version remain server calculated. |
| Wishlist/collections | Product expansion reuses the complete product DTO, with existing active/public filters. |
| Search/facets | Intentional compact suggestions and aggregate projections retained, not expanded into complete product objects. |
| Categories/addresses | Existing DTOs already retain their editable fields and identity; address endpoints remain owner scoped. |
| Coupons/promotions | Existing eligibility, usage, scheduling, amount and version fields retained. |
| Orders/fulfillment | Existing item snapshots, quantities, financial totals and shipping address retained. Embedded shipment now also includes fulfillmentStatus and version. Dedicated fulfillment endpoints retain per-item allocation. |
| Cancellation/returns/exchanges | Added userId to identify the requesting account; existing order/return references, lines, reason, state and version retained. |
| Refunds | Unified list/detail/command response to include paymentId, attemptId, returnId, provider/manual references, processingStatus, attemptNumber and version. |
| Payments | Existing attempts retain order, amount, currency, state, reconciliation, checkout URL, expiry/paid dates and version. Provider secrets/webhook signatures are not response fields. |
| Content/taxonomies | Existing slug/body/SEO/taxonomy/publication snapshots retained. Published post/page/policy responses now resolve coverUrl and a compact media id/url list in a batch. Private file URLs and metadata are excluded; draft content does not enter published responses. |
| Support | Tickets now include userId; messages include ticketId and authorId. Internal-message filtering remains enforced by the service. |
| Settings/shipping | Existing business configuration, shipping rules and version retained; shop response now includes public logoUrl alongside logoFileId. |
| Merchandising | Existing collection expansion, banner URL, navigation children and schedule rules retained. Raw configuration and resolved public views remain separate operations. |
| Accounts/staff/auth | Existing profile, role, capability, status and version projections retained. Password hashes, tokens, authVersion, provider IDs and invitation payloads are not added to business DTOs. |
| Files/uploads/processes/reports | Existing owner/status/progress/result/expiry and download controls retained. Fixed OpenAPI misclassification of `/files/{id}/download`: this endpoint returns a JSON signed-URL envelope, while process/report exports return bytes. |
| Notifications/jobs/audit/system | Existing endpoint-specific event, delivery, progress, audit and permission projections retained. Internal payloads are not copied into public DTOs. |

## SDK behavior

Every operation has a method-specific helper/input, React Query hook and query or
mutation options factory. POST and PUT inputs are separate. Multipart import uses
FormData, byte downloads return Blob, signed URLs remain JSON, HTML remains text,
and empty responses return undefined. API error codes/field errors are preserved;
mutations are not automatically retried and idempotency keys remain caller owned.

Product resource hooks additionally provide short names for admin/storefront,
publication, variants and gallery. They share operation cache keys with generated
hooks and reject stock on resource updates, matching the service's inventory rule.

## Context and intentional boundaries

Tenant/domain-dependent display requires server-side context resolution and record
scoping before serialization. It is not implemented by allowing a client to request
arbitrary model fields. This change preserves current permissions/ownership/public
visibility. SDK callers can pass context headers and a scoped queryKey; when a
future tenant/header/locale changes the response, its scope must be part of the key.
Clear the QueryClient on account changes. A common API contract does not mean that
all callers can read all records.

Relations remain explicit: sizeGuideId references a size guide; a product does not
embed every SKU, a shipment does not replace the shipment-items endpoint, and an
upload storage ID is not an image URL. Specialized query/aggregate responses remain
purpose-specific. Database rows are never serialized wholesale to fill gaps.

## Verification

- Generated coverage test executes all 291 helpers against an injected fetch,
  verifies method/path/output mode, multipart boundaries and exported hooks.
- Type tests check required parameters/headers, per-method inputs, filters, enums,
  publication versions and the product update stock restriction.
- API regression tests check product/catalog media fields, support/aftersales
  identity, consistent refund projections, cart batch hydration, published media,
  public logo and signed-URL versus binary OpenAPI schemas.
- Existing local catalog, content/support/notification and list integration suites
  exercise real permissions, snapshots, transitions and pagination.
