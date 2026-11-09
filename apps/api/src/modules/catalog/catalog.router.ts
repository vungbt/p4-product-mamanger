import { randomUUID } from 'node:crypto';
import type { InventoryListQuery, ListQuery, ProductListQuery } from '@p4/shared';
import { Router } from 'express';
import { Op } from 'sequelize';
import { requireAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { listInventory } from '@/modules/inventory/inventory.service.js';
import { listProducts } from '@/modules/products/products.service.js';
import { validateProductsListQuery } from '@/modules/products/products.validation.js';
import { SizeGuideModel } from '@/sequelize/models/index.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { auditedTransaction } from '@/shared/audit/audited-command.js';
import { recordAudit } from '@/shared/audit/record.js';
import { applyAuditPolicies } from '@/shared/audit/route-policy.js';
import { assertVersion } from '@/shared/commerce/transitions.js';
import { currentUser, requestBody, routeId, uuidRouteId } from '@/shared/http-input.js';
import { searchPattern } from '@/shared/list-filters.js';
import { queryText, validateListQuery } from '@/shared/list-query.js';
import { NotFound } from '@/utils/errors/index.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import { auditPolicies } from './catalog.audit.js';
import * as catalog from './catalog.service.js';

const router = Router();
const read = [authRequired, requireAbility('read', 'Catalog')];
const write = [authRequired, requireAbility('write', 'Catalog')];

export const validateVariantList = validateListQuery({
  sortFields: ['sku', 'price', 'onHand', 'reserved', 'createdAt'] satisfies NonNullable<
    InventoryListQuery['sortBy']
  >[],
  defaultSort: 'sku',
  rules: () => ({ productId: 'string|max:128', status: 'sometimes|required|in:active,inactive' }),
  normalize: (query, base): InventoryListQuery => ({
    ...base,
    productId: queryText(query, 'productId'),
    status:
      queryText(query, 'status') === 'active'
        ? 'active'
        : queryText(query, 'status') === 'inactive'
          ? 'inactive'
          : undefined,
  }),
});
router.get(
  '/admin/products',
  ...read,
  validateProductsListQuery,
  listHandler(async (_req, query: ProductListQuery) => listProducts(query, true)),
);
router.get(
  '/admin/products/:id',
  ...read,
  apiHandler(async (req) => catalog.getCatalogProduct(routeId(req), true)),
);
router.get(
  '/products/by-slug/:slug',
  apiHandler(async (req) => catalog.getProductBySlug(routeId(req, 'slug'))),
);
router.patch(
  '/products/:id/publication',
  ...write,
  apiHandler(async (req) => {
    const body = requestBody(req);
    return catalog.publishProduct(
      currentUser(req).id,
      routeId(req),
      body.enum('status', ['draft', 'active', 'inactive', 'archived']),
      body.integer('expectedVersion', 1),
    );
  }),
);
router.get(
  '/products/:id/variants',
  apiHandler(async (req) => catalog.listVariants(routeId(req))),
);
router.get(
  '/admin/products/:id/variants',
  ...read,
  apiHandler(async (req) => catalog.listVariants(routeId(req), true)),
);
router.get(
  '/admin/variants',
  ...read,
  validateVariantList,
  listHandler(async (_req, query: InventoryListQuery) => listInventory(query)),
);
router.post(
  '/products/:id/variants',
  ...write,
  apiHandler(async (req) => {
    const body = requestBody(req);
    return catalog.createVariant(currentUser(req).id, routeId(req), {
      sku: body.text('sku', 120),
      barcode: body.optionalText('barcode', 120) ?? null,
      size: body.text('size', 80),
      color: body.text('color', 80),
      price: body.integer('price'),
      status:
        body.data.status === undefined ? 'active' : body.enum('status', ['active', 'inactive']),
      isDefault: body.data.isDefault === undefined ? false : body.boolean('isDefault'),
    });
  }, 201),
);
router.patch(
  '/products/:id/variants/:variantId',
  ...write,
  apiHandler(async (req) => {
    const body = requestBody(req);
    if (
      body.data.stock !== undefined ||
      body.data.onHand !== undefined ||
      body.data.reserved !== undefined
    )
      return body.invalid('stock');
    return catalog.updateVariant(
      currentUser(req).id,
      routeId(req),
      uuidRouteId(req, 'variantId'),
      body.integer('expectedVersion', 1),
      {
        sku: body.optionalText('sku', 120),
        barcode: body.data.barcode === null ? null : body.optionalText('barcode', 120),
        size: body.optionalText('size', 80),
        color: body.optionalText('color', 80),
        price: body.data.price === undefined ? undefined : body.integer('price'),
        status:
          body.data.status === undefined ? undefined : body.enum('status', ['active', 'inactive']),
        isDefault: body.data.isDefault === undefined ? undefined : body.boolean('isDefault'),
      },
    );
  }),
);
router.patch(
  '/products/:id/variants/:variantId/images',
  ...write,
  apiHandler(async (req) => {
    const body = requestBody(req);
    const ids = body.strings('imageIds', 20, 36);
    if (ids.some((id) => !/^[a-f0-9-]{36}$/i.test(id))) return body.invalid('imageIds');
    return catalog.setVariantImages(
      currentUser(req).id,
      routeId(req),
      uuidRouteId(req, 'variantId'),
      body.integer('expectedVersion', 1),
      ids,
    );
  }),
);
const sizeList = validateListQuery({
  sortFields: ['name', 'createdAt'],
  defaultSort: 'name',
  rules: () => ({}),
  normalize: (_query, base) => base,
});
router.get(
  '/admin/size-guides',
  ...read,
  sizeList,
  listHandler(async (_req, query: ListQuery<'name' | 'createdAt'>) => {
    const result = await SizeGuideModel.findAndCountAll({
      where: query.q ? { name: { [Op.iLike]: searchPattern(query.q) } } : {},
      order: [
        [query.sortBy ?? 'name', query.sortOrder === 'desc' ? 'DESC' : 'ASC'],
        ['id', 'ASC'],
      ],
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
    return {
      data: result.rows.map(catalog.sizeGuideDto),
      meta: buildPaginationMeta(query.page, query.pageSize, result.count),
    };
  }),
);
router.get(
  '/admin/size-guides/:id',
  ...read,
  apiHandler(async (req) => {
    const row = await SizeGuideModel.findByPk(uuidRouteId(req));
    if (!row) throw new NotFound();
    return catalog.sizeGuideDto(row);
  }),
);
function measurements(req: Parameters<typeof requestBody>[0]) {
  const body = requestBody(req);
  const value = body.json('measurements');
  if (
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > 100 ||
    JSON.stringify(value).length > 50000
  )
    return body.invalid('measurements');
  for (const line of value) {
    if (
      !line ||
      Array.isArray(line) ||
      typeof line !== 'object' ||
      typeof line.size !== 'string' ||
      line.size.length > 80
    )
      return body.invalid('measurements');
    for (const [key, measurement] of Object.entries(line))
      if (
        key !== 'size' &&
        (typeof measurement !== 'number' || measurement <= 0 || measurement > 1000)
      )
        return body.invalid('measurements');
  }
  return value;
}
router.post(
  '/admin/size-guides',
  ...write,
  apiHandler(
    async (req) =>
      auditedTransaction(async (transaction) => {
        const body = requestBody(req);
        const row = await SizeGuideModel.create(
          {
            id: randomUUID(),
            name: body.text('name'),
            measurements: measurements(req),
            version: 1,
          },
          { transaction },
        );
        await recordAudit(
          {
            actorId: currentUser(req).id,
            action: 'size_guide.created',
            resourceType: 'size_guide',
            resourceId: row.id,
          },
          transaction,
        );
        return catalog.sizeGuideDto(row);
      }),
    201,
  ),
);
router.patch(
  '/admin/size-guides/:id',
  ...write,
  apiHandler(async (req) =>
    auditedTransaction(async (transaction) => {
      const body = requestBody(req);
      const row = await SizeGuideModel.findByPk(uuidRouteId(req), {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!row) throw new NotFound();
      assertVersion(row.version, body.integer('expectedVersion', 1));
      await row.update(
        { name: body.text('name'), measurements: measurements(req), version: row.version + 1 },
        { transaction },
      );
      await recordAudit(
        {
          actorId: currentUser(req).id,
          action: 'size_guide.updated',
          resourceType: 'size_guide',
          resourceId: row.id,
        },
        transaction,
      );
      return catalog.sizeGuideDto(row);
    }),
  ),
);
export default applyAuditPolicies(router, auditPolicies);
