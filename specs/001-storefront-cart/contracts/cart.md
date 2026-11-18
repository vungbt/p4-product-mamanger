# Cart Contract

The [existing OpenAPI specification](../../../apps/api/openapi.yaml) is authoritative.

| Operation | Input |
| --- | --- |
| GET /api/cart | Authenticated account |
| POST /api/cart/items | Variant ID, quantity and expectedVersion |
| PATCH /api/cart/items/{id} | Item ID, quantity and expectedVersion |
| DELETE /api/cart/items/{id} | Item ID and expectedVersion in the request body |
| DELETE /api/cart/items | expectedVersion in the request body |
| POST /api/cart/merge | Items and Idempotency-Key |

Use generated request and response types. Read the merge envelope from the contract and refresh the authoritative snapshot after success or replay.
