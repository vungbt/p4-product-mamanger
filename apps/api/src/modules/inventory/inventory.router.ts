import type { InventoryListQuery, ListQuery } from '@p4/shared';
import { Router } from 'express';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { requirePermission } from '@/middlewares/permission.middleware.js';
import { validateVariantList } from '@/modules/catalog/catalog.router.js';
import { InventoryMovementModel } from '@/sequelize/models/index.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { applyAuditPolicies } from '@/shared/audit/route-policy.js';
import { currentUser, requestBody } from '@/shared/http-input.js';
import { queryText, uuidQueryRule, validateListQuery } from '@/shared/list-query.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import { selectFields } from '@/utils/select-fields.js';
import { auditPolicies } from './inventory.audit.js';
import * as inventory from './inventory.service.js';

const router = Router();
const read = [authRequired, requirePermission('inventory:read')];
router.get(
  '/admin/inventory',
  ...read,
  validateVariantList,
  listHandler(async (_req, query: InventoryListQuery) => inventory.listInventory(query)),
);
const movements = validateListQuery({
  sortFields: ['createdAt', 'quantity'],
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  rules: () => ({ variantId: uuidQueryRule }),
  normalize: (_query, base) => base,
});
router.get(
  '/admin/inventory/movements',
  ...read,
  movements,
  listHandler(async (req, query: ListQuery<'createdAt' | 'quantity'>) => {
    const variantId = queryText(req.query, 'variantId');
    const result = await InventoryMovementModel.findAndCountAll({
      where: variantId ? { variantId } : {},
      order: [
        [query.sortBy ?? 'createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
        ['id', 'ASC'],
      ],
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
    return {
      data: result.rows.map((row) => ({
        ...selectFields(row, [
          'id',
          'variantId',
          'kind',
          'quantity',
          'onHandDelta',
          'reservedDelta',
          'onHandAfter',
          'reservedAfter',
          'actorId',
          'reason',
          'reference',
        ]),
        createdAt: row.createdAt.toISOString(),
      })),
      meta: buildPaginationMeta(query.page, query.pageSize, result.count),
    };
  }),
);
for (const [path, kind] of [
  ['receipts', 'receipt'],
  ['adjustments', 'adjust'],
] as const) {
  router.post(
    `/admin/inventory/${path}`,
    authRequired,
    requirePermission('inventory:write'),
    apiHandler(async (req) => {
      const body = requestBody(req);
      const variantId = body.text('variantId', 36);
      if (!/^[a-f0-9-]{36}$/i.test(variantId)) return body.invalid('variantId');
      return inventory.adjustInventory({
        actorId: currentUser(req).id,
        key: req.header('Idempotency-Key') ?? '',
        variantId,
        quantity: body.integer('quantity', kind === 'receipt' ? 1 : -2_147_483_647),
        reason: body.text('reason', 1000),
        kind,
      });
    }, 201),
  );
}
router.get(
  '/admin/inventory/reconciliation',
  authRequired,
  requirePermission('inventory:read'),
  apiHandler(async () => inventory.reconcileInventory()),
);
export default applyAuditPolicies(router, auditPolicies);
