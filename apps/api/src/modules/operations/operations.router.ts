import { applyAuditPolicies, currentUser } from '@p4/server-core';
import { Router } from 'express';
import { Op, QueryTypes } from 'sequelize';
import { requireAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { DomainEventModel, sequelize } from '@/sequelize/models/index.js';
import { apiHandler } from '@/shared/api-handler.js';
import { auditedTransaction, recordAudit } from '@/shared/audit/audited-command.js';
import { reconcileInventory } from '../inventory/inventory.service.js';
import { auditPolicies } from './operations.audit.js';

const router = Router();
router.get(
  '/internal/metrics',
  authRequired,
  requireAbility('read', 'System'),
  apiHandler(async () => {
    const pending = await DomainEventModel.count({ where: { status: 'pending' } });
    const deadLetter = await DomainEventModel.count({ where: { status: 'dead_letter' } });
    const overdue = await DomainEventModel.count({
      where: { status: 'processing', leaseUntil: { [Op.lt]: new Date() } },
    });
    const rows = await sequelize.query<{ lastSeenAt: Date }>(
      'SELECT MAX(last_seen_at) AS "lastSeenAt" FROM worker_heartbeats',
      { type: QueryTypes.SELECT },
    );
    return {
      outbox: { pending, deadLetter, overdue },
      workerLastSeenAt: rows[0]?.lastSeenAt?.toISOString() ?? null,
    };
  }),
);
router.post(
  '/admin/operations/inventory-reconciliation',
  authRequired,
  requireAbility('manage', 'System'),
  apiHandler(async (req) => {
    const result = await reconcileInventory();
    await auditedTransaction(async (transaction) =>
      recordAudit(
        {
          actorId: currentUser(req).id,
          action: 'operations.inventory_reconciliation',
          resourceType: 'system',
          resourceId: 'inventory',
          changes: { consistent: result.consistent },
        },
        transaction,
      ),
    );
    return result;
  }),
);
export default applyAuditPolicies(router, auditPolicies);
