import { createApiHandlers } from '@p4/server-core';
import { auditedTransaction } from './audit.js';

// Keep these exact names: the OpenAPI generator recognises them.
export const { apiHandler, listHandler, optionalListHandler } =
  createApiHandlers(auditedTransaction);
