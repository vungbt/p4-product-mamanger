# Research

- **Server authority**. Reuse the existing cart API for signed-in totals, availability and version checks. A local mirror would allow stale prices and quantities to drift.
- **Guest storage**. Store variant IDs and quantities locally. Keep pending merge payload and key stable for the same account across retries. A fresh key after a lost response could apply the same lines again.
- **Cache isolation**. Use account-scoped cart query keys and the existing shared QueryClient. Clear private cart state at account changes.
- **Pilot boundary**. FE-12 owns the cart. The later checkout task owns reservations and payment.
