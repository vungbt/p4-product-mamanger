# Data Model

- **Guest line**. Variant ID and quantity in browser storage.
- **Pending merge**. Account ID, immutable line snapshot and idempotency key. Keep until server acknowledgement. Serialize attempts for the same snapshot.
- **Account cart**. Cart snapshot and version from the generated API contract. Item mutations use item ID where required.
- **Account switch**. Drop the old private snapshot from view. Never replay a pending merge belonging to another account.
