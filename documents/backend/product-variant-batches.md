# Product variant batches

`POST /api/products` and `PATCH /api/products/{id}` (also PUT) accept an optional
`variants` object. The product and its SKU writes share the product's audited
transaction. PATCH increments the product version once, including when the batch
contains opening inventory movements. Supply `expectedVersion` on the product to
protect the whole form snapshot, and optionally on each updated variant.

```json
{
  "expectedVersion": 3,
  "variants": {
    "delete": ["existing-variant-uuid"],
    "update": [{ "id": "another-variant-uuid", "expectedVersion": 2, "price": 150000 }],
    "create": [{ "sku": "SHIRT-M-RED", "size": "M", "color": "red", "price": 150000, "stock": 5 }]
  }
}
```

Create rows require `sku` (1–120 characters), `size`, `color` and an integer
nonnegative `price`. Optional fields are `barcode`, `status`, `isDefault`,
`imageStorageIds`, legacy `imageIds`, and `stock`. Updates accept partial rows plus `id`; stock is rejected
on updates. Initial stock uses `moveInventory(kind: 'opening')`, its ledger and
transactional inventory event. Product stock and minimum active SKU price are
recalculated from active variants. A create request without `variants.create`
retains the legacy default SKU; an explicit create list produces exactly that
list, including an empty list.

Batches apply delete → update → create. Delete deactivates the SKU and clears its
default flag, retaining identity, inventory and order history; admin variant
queries continue to show inactive SKUs. A reserved SKU cannot be deleted or
deactivated. Sold SKU identity (SKU code, size and colour) is immutable. Active
variants have exactly one default; no active variants means no default. The
existing unique indexes remain in force. Barcode may be cleared with null.

Errors include row/cell paths such as `variants.create.1.sku`,
`variants.update.2.size`, and `variants.delete.0`. Uniqueness and business conflicts
return 409; malformed nested input returns 422. Any failure rolls back the entire
product save, including inventory and audit entries.

SKU `imageStorageIds` is an ordered list of up to 20 storage IDs. It resolves to
file IDs after the product thumbnail/gallery writes in the same transaction.
Only current product attachments are accepted, including newly uploaded files
attached in that request. Unknown, foreign and detached storage IDs return 422
at `variants.create.N.imageStorageIds` or `variants.update.N.imageStorageIds`.
An empty list clears the selection; omission preserves it. Detaching product
images prunes their file IDs from every SKU in the transaction, preserving order.
Variant responses retain `imageIds` and add `images: { fileId, url, storageId }[]`.

The admin form uses kit 0.31 multi OptionGroups: chips for sizes and swatches for
colours, with selected labels and extra ColorPicker colours. Its client DataTable
shows read-only Size/Colour, Input SKU/numeric barcode, NumberInput price/initial
stock, Select status, Switch default, image swatch OptionGroup and remove/undo
IconButtons. Removed rows remain struck through until Save. Image options include
the thumbnail, gallery and unsaved upload previews. Stable gallery keys keep
selections while uploads complete, then convert to storage IDs for the request.
Matching combinations retain edits. Unchanged variants omit the entire batch;
updates carry only changed fields plus ID/version. Row errors appear in the
corresponding cell. Saves invalidate product, variant, storefront and SKU queries.
The detail page is read-only with a link to the form; the SKU list remains available.

The old variant dialog and hook were removed. Standalone variant write routes
remain compatible with the exported SDK and checkout integration consumers;
imports also continue using their catalog service functions. Product screens use
only product POST/PATCH for SKU writes. Standalone catalog writes also repair the
active default invariant.

Verification: API service and form diff unit tests run without a database.
Catalog integration coverage checks opening movements, atomic rollback,
update/delete/create, defaults and reservations. Checkout integration coverage
checks sold identity through product PATCH. Set P4_TEST_API_URL to the existing
local API to run those database-backed suites. This task environment cannot
connect to PostgreSQL or Docker (EPERM); no new containers were created.
