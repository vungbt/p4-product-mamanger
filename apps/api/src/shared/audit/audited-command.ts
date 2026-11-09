import { createAuditRuntime } from '@p4/server-core';
import { AuditLogModel, sequelize } from '@/sequelize/models/index.js';

/** P4's audited transactions and audit rows, bound to its database. */
export const { auditedTransaction, auditedCommand, inTransaction, recordAudit } =
  createAuditRuntime({
    sequelize,
    writeAuditLog: (row, transaction) => AuditLogModel.create(row, { transaction }),
  });

export { setAuditChanges } from '@p4/server-core';
