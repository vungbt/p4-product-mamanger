import type { Transaction } from 'sequelize';
import { sequelize } from '@/sequelize/index.js';

export function inTransaction<T>(
  transaction: Transaction | undefined,
  work: (transaction: Transaction) => Promise<T>,
) {
  return transaction ? work(transaction) : sequelize.transaction(work);
}
