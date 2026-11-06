import { randomUUID } from 'node:crypto';
import type { ListQuery } from '@p4/shared';
import { Router } from 'express';
import { authRequired } from '@/middlewares/auth.middleware.js';
import {
  ProductModel,
  ProductVariantModel,
  StockAlertSubscriptionModel,
  sequelize,
  WishlistItemModel,
} from '@/sequelize/models/index.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { auditedTransaction } from '@/shared/audit/audited-command.js';
import { applyAuditPolicies } from '@/shared/audit/route-policy.js';
import { currentUser, requestBody, routeId, uuidRouteId } from '@/shared/http-input.js';
import { validateListQuery } from '@/shared/list-query.js';
import { listSearch } from '@/shared/list-search.js';
import { BaseError } from '@/utils/errors/base-error.js';
import { NotFound } from '@/utils/errors/index.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import { selectFields } from '@/utils/select-fields.js';
import { getCatalogProduct } from '../catalog/catalog.service.js';
import { auditPolicies } from './wishlist.audit.js';

const router = Router();
const list = validateListQuery({
  sortFields: ['createdAt'],
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  rules: () => ({}),
  normalize: (_query, base) => base,
});
router.get(
  '/wishlist',
  authRequired,
  list,
  listHandler(async (req, query: ListQuery<'createdAt'>) => {
    const result = await WishlistItemModel.findAndCountAll({
      ...(query.q
        ? {
            include: [
              {
                model: ProductModel,
                as: 'product',
                attributes: [],
                required: true,
                where: {
                  status: 'active',
                  ...listSearch(ProductModel, query.q, ['name', 'slug'], 'product'),
                },
              },
            ],
          }
        : {}),
      where: { userId: currentUser(req).id },
      order: [
        ['createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
        ['id', 'ASC'],
      ],
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
    const data = [];
    for (const row of result.rows) {
      const product = await ProductModel.findByPk(row.productId);
      data.push({
        id: row.id,
        productId: row.productId,
        product: product?.status === 'active' ? await getCatalogProduct(row.productId) : null,
      });
    }
    return { data, meta: buildPaginationMeta(query.page, query.pageSize, result.count) };
  }),
);
router.put(
  '/wishlist/items/:productId',
  authRequired,
  apiHandler(async (req) => {
    const productId = routeId(req, 'productId');
    await getCatalogProduct(productId);
    const userId = currentUser(req).id;
    const [row] = await WishlistItemModel.findOrCreate({
      where: { userId, productId },
      defaults: { id: randomUUID(), userId, productId },
    });
    return selectFields(row, ['id', 'productId']);
  }),
);
router.delete(
  '/wishlist/items/:productId',
  authRequired,
  apiHandler(async (req) => {
    await WishlistItemModel.destroy({
      where: { userId: currentUser(req).id, productId: routeId(req, 'productId') },
    });
    return { removed: true };
  }),
);
router.post(
  '/stock-alert-subscriptions',
  authRequired,
  apiHandler(async (req) => {
    const user = currentUser(req);
    if (!user.emailVerified)
      throw new BaseError('verified_contact_required', 403, 'verified_contact_required');
    const body = requestBody(req);
    const variantId = body.text('variantId', 36);
    if (!/^[a-f0-9-]{36}$/i.test(variantId)) return body.invalid('variantId');
    return auditedTransaction(async (transaction) => {
      const variant = await ProductVariantModel.findByPk(variantId, { transaction });
      if (variant?.status !== 'active') throw new NotFound();
      await getCatalogProduct(variant.productId);
      if (variant.onHand > variant.reserved)
        throw new BaseError('variant_already_available', 409, 'variant_already_available');
      await sequelize.query('SELECT pg_advisory_xact_lock(hashtext(:key))', {
        replacements: { key: `stock-alert:${user.id}:${variantId}` },
        transaction,
      });
      let row = await StockAlertSubscriptionModel.findOne({
        where: { userId: user.id, variantId },
        transaction,
      });
      if (row) await row.update({ status: 'active' }, { transaction });
      else
        row = await StockAlertSubscriptionModel.create(
          { id: randomUUID(), userId: user.id, variantId, status: 'active' },
          { transaction },
        );
      return selectFields(row, ['id', 'variantId', 'status']);
    });
  }, 201),
);
router.get(
  '/stock-alert-subscriptions/mine',
  authRequired,
  list,
  listHandler(async (req, query: ListQuery<'createdAt'>) => {
    const result = await StockAlertSubscriptionModel.findAndCountAll({
      where: {
        userId: currentUser(req).id,
        ...listSearch(StockAlertSubscriptionModel, query.q, ['variantId', 'status']),
      },
      order: [
        ['createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
        ['id', 'ASC'],
      ],
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
    return {
      data: result.rows.map((row) => selectFields(row, ['id', 'variantId', 'status'])),
      meta: buildPaginationMeta(query.page, query.pageSize, result.count),
    };
  }),
);
router.delete(
  '/stock-alert-subscriptions/:id',
  authRequired,
  apiHandler(async (req) => {
    const row = await StockAlertSubscriptionModel.findOne({
      where: { id: uuidRouteId(req), userId: currentUser(req).id },
    });
    if (!row) throw new NotFound();
    await row.update({ status: 'cancelled' });
    return { cancelled: true };
  }),
);
export default applyAuditPolicies(router, auditPolicies);
