# Acceptance Walkthrough

1. Start the local API and web using the P4 README. Use a local test account and an available seeded SKU.
2. Verify add, edit, remove and clear against the returned snapshot.
3. Change the cart in another tab and submit a stale edit. Verify a refresh and explicit retry.
4. Add guest lines and reload. Sign in and verify they merge once. Simulate a lost response and retry with the same account, payload and key.
5. Verify failed merge retains guest lines. Switch accounts and verify private cart data does not cross accounts.
6. Run lint and web build, then record the observed results in FE-12.
