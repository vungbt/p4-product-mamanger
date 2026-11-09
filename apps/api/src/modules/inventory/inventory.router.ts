import type { InventoryListQuery } from '@p4/shared';
import { INVENTORY_MOVEMENT_KIND_VALUES, type InventoryMovementListQuery } from '@p4/shared';
import { Router } from 'express';
import { requireAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { validateVariantList } from '@/modules/catalog/catalog.router.js';
import { InventoryMovementModel } from '@/sequelize/models/index.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { applyAuditPolicies } from '@/shared/audit/route-policy.js';
import { currentUser, requestBody } from '@/shared/http-input.js';
import { dateRange } from '@/shared/list-filters.js';
import {
  dateFilters,
  dateQueryRule,
  queryText,
  uuidQueryRule,
  validateListQuery,
} from '@/shared/list-query.js';
import { listSearch } from '@/shared/list-search.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import { selectFields } from '@/utils/select-fields.js';
import { auditPolicies } from './inventory.audit.js';
import * as inventory from './inventory.service.js';

const router = Router();
const read = [authRequired, requireAbility('read', 'Inventory')];
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
  rules: () => ({
    variantId: uuidQueryRule,
    kind: `sometimes|required|in:${INVENTORY_MOVEMENT_KIND_VALUES.join(',')}`,
    createdFrom: dateQueryRule,
    createdTo: dateQueryRule,
  }),
  normalize: (query, base, req): InventoryMovementListQuery => ({
    ...base,
    variantId: queryText(query, 'variantId'),
    kind: INVENTORY_MOVEMENT_KIND_VALUES.find((value) => value === queryText(query, 'kind')),
    ...dateFilters(query, req.t),
  }),
});
router.get(
  '/admin/inventory/movements',
  ...read,
  movements,
  listHandler(async (_req, query: InventoryMovementListQuery) => {
    const variantId = query.variantId;
    const result = await InventoryMovementModel.findAndCountAll({
      where: {
        ...(variantId ? { variantId } : {}),
        ...(query.kind ? { kind: query.kind } : {}),
        ...(query.createdFrom || query.createdTo
          ? { createdAt: dateRange(query.createdFrom, query.createdTo) }
          : {}),
        ...listSearch(InventoryMovementModel, query.q, ['id', 'variantId', 'kind', 'reason']),
      },
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
    requireAbility('write', 'Inventory'),
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
  requireAbility('read', 'Inventory'),
  apiHandler(async () => inventory.reconcileInventory()),
);
export default applyAuditPolicies(router, auditPolicies);
