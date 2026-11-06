import type { Transaction } from 'sequelize';
import { auditedTransaction } from '@/shared/audit/audited-command.js';

export function inTransaction<T>(
  transaction: Transaction | undefined,
  work: (transaction: Transaction) => Promise<T>,
) {
  return transaction ? work(transaction) : auditedTransaction(work);
}
