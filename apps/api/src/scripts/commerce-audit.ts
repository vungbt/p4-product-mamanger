import { QueryTypes } from 'sequelize';
import { reconcileInventory } from '@/modules/inventory/inventory.service.js';
import { sequelize } from '@/sequelize/index.js';

async function main() {
  if (process.argv.slice(2).some((argument) => argument !== '--dry-run'))
    throw new Error('Only --dry-run is supported; this audit never modifies records.');
  try {
    const migrations = await sequelize.query<{ name: string }>(
      'SELECT name FROM "SequelizeMeta" ORDER BY name',
      { type: QueryTypes.SELECT },
    );
    const stock = await reconcileInventory();
    const [checks] = await sequelize.query(`SELECT
      (SELECT COUNT(*)::int FROM products p WHERE NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id=p.id)) AS products_without_variant,
      (SELECT COUNT(*)::int FROM products p WHERE p.stock <> COALESCE((SELECT SUM(v.on_hand-v.reserved) FROM product_variants v WHERE v.product_id=p.id AND v.status='active'),0)) AS product_balance_mismatch,
      (SELECT COUNT(*)::int FROM inventory_reservations r WHERE r.variant_id IS NULL) AS reservations_without_variant,
      (SELECT COUNT(*)::int FROM product_variants v WHERE v.reserved <> COALESCE((SELECT SUM(r.quantity) FROM inventory_reservations r WHERE r.variant_id=v.id AND r.status='reserved'),0)) AS reservation_balance_mismatch,
      (SELECT COUNT(*)::int FROM payments p WHERE p.status='paid' AND NOT EXISTS (SELECT 1 FROM payment_ledger l JOIN payment_attempts a ON a.id=l.attempt_id WHERE a.payment_id=p.id AND l.kind='capture')) AS legacy_paid_without_capture_evidence,
      (SELECT COUNT(*)::int FROM refunds r WHERE r.status='completed' AND NOT EXISTS (SELECT 1 FROM payment_ledger l WHERE l.kind='refund' AND l.reference IN (r.external_id,r.manual_reference,'mock_refund:'||r.id))) AS legacy_refund_without_money_evidence,
      (SELECT COUNT(*)::int FROM domain_events WHERE status='dead_letter') AS dead_letter_events`);
    console.info(
      JSON.stringify(
        {
          mode: 'read_only',
          migrations: migrations.map((row) => row.name),
          inventoryLedgerConsistent: stock.consistent,
          checks,
        },
        null,
        2,
      ),
    );
    if (!stock.consistent) process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.name : 'AuditError');
  process.exitCode = 1;
});
