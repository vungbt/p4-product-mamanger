import { createApiHandlers } from '@p4/server-core';
import { auditedTransaction } from './audit/audited-command.js';

export const { apiHandler, listHandler, optionalListHandler } =
  createApiHandlers(auditedTransaction);
