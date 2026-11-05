import { randomUUID } from 'node:crypto';
import type { ListQuery } from '@p4/shared';
import { Router } from 'express';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { requirePermission } from '@/middlewares/permission.middleware.js';
import {
  ProductModel,
  ProductVariantModel,
  ShippingMethodModel,
  sequelize,
} from '@/sequelize/models/index.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { cartLines } from '@/shared/commerce/input.js';
import { recordAudit } from '@/shared/commerce/persistence.js';
import { assertVersion } from '@/shared/commerce/transitions.js';
import { currentUser, requestBody, uuidRouteId } from '@/shared/http-input.js';
import { validateListQuery } from '@/shared/list-query.js';
import { InputValidError, NotFound } from '@/utils/errors/index.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import * as service from './settings.service.js';

const router = Router();
const manage = [authRequired, requirePermission('settings:manage')];
router.get(
  '/shop/config',
  apiHandler(async () => service.shopDto(await service.settings())),
);
router.get(
  '/admin/settings/shop',
  ...manage,
  apiHandler(async () => service.shopDto(await service.settings())),
);
router.get(
  '/admin/settings/commerce',
  ...manage,
  apiHandler(async () => service.commerceDto(await service.settings())),
);
router.patch(
  '/admin/settings/shop',
  ...manage,
  apiHandler(async (req) => {
    const body = requestBody(req);
    const email = body.text('supportEmail');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return body.invalid('supportEmail');
    const timezone = body.text('timezone', 80);
    try {
      new Intl.DateTimeFormat('en', { timeZone: timezone });
    } catch {
      return body.invalid('timezone');
    }
    return sequelize.transaction(async (transaction) =>
      service.shopDto(
        await service.patchSettings(
          currentUser(req).id,
          body.integer('expectedVersion', 1),
          {
            name: body.text('name', 120),
            supportEmail: email,
            supportPhone: body.text('supportPhone', 30),
            defaultLocale: body.enum('defaultLocale', ['vi', 'en']),
            timezone,
            logoFileId: body.data.logoFileId === null ? null : body.optionalText('logoFileId', 36),
          },
          transaction,
        ),
      ),
    );
  }),
);
router.patch(
  '/admin/settings/commerce',
  ...manage,
  apiHandler(async (req) => {
    const body = requestBody(req);
    return sequelize.transaction(async (transaction) =>
      service.commerceDto(
        await service.patchSettings(
          currentUser(req).id,
          body.integer('expectedVersion', 1),
          {
            quoteTtlSeconds: body.integer('quoteTtlSeconds', 60, 3600),
            reservationTtlSeconds: body.integer('reservationTtlSeconds', 60, 86400),
            returnWindowDays: body.integer('returnWindowDays', 1, 90),
          },
          transaction,
        ),
      ),
    );
  }),
);
const list = validateListQuery({
  sortFields: ['name', 'fee', 'createdAt'],
  defaultSort: 'name',
  rules: () => ({}),
  normalize: (_query, base) => base,
});
router.get(
  '/admin/shipping-methods',
  ...manage,
  list,
  listHandler(async (_req, query: ListQuery<'name' | 'fee' | 'createdAt'>) => {
    const result = await ShippingMethodModel.findAndCountAll({
      order: [
        [query.sortBy ?? 'name', query.sortOrder === 'desc' ? 'DESC' : 'ASC'],
        ['id', 'ASC'],
      ],
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
    return {
      data: result.rows.map(service.shippingDto),
      meta: buildPaginationMeta(query.page, query.pageSize, result.count),
    };
  }),
);
router.get(
  '/admin/shipping-methods/:id',
  ...manage,
  apiHandler(async (req) => {
    const row = await ShippingMethodModel.findByPk(uuidRouteId(req));
    if (!row) throw new NotFound();
    return service.shippingDto(row);
  }),
);
for (const method of ['post', 'patch'] as const) {
  router[method](
    method === 'post' ? '/admin/shipping-methods' : '/admin/shipping-methods/:id',
    ...manage,
    apiHandler(
      async (req) => {
        const body = requestBody(req);
        const cities = [
          ...new Set(body.strings('cities', 100, 120).map((city) => city.trim().toLowerCase())),
        ];
        if (!cities.length) return body.invalid('cities');
        const input = {
          name: body.text('name', 120),
          cities,
          active: body.boolean('active'),
          codEnabled: body.boolean('codEnabled'),
          fee: body.integer('fee'),
          freeAbove: body.data.freeAbove === null ? null : body.integer('freeAbove'),
          estimatedDays: body.integer('estimatedDays', 1, 90),
        };
        return sequelize.transaction(async (transaction) => {
          let row: ShippingMethodModel | null;
          if (method === 'post')
            row = await ShippingMethodModel.create(
              { id: randomUUID(), ...input, version: 1 },
              { transaction },
            );
          else {
            row = await ShippingMethodModel.findByPk(uuidRouteId(req), {
              transaction,
              lock: transaction.LOCK.UPDATE,
            });
            if (!row) throw new NotFound();
            assertVersion(row.version, body.integer('expectedVersion', 1));
            await row.update({ ...input, version: row.version + 1 }, { transaction });
          }
          await recordAudit(
            {
              actorId: currentUser(req).id,
              action: `shipping_method.${method === 'post' ? 'created' : 'updated'}`,
              resourceType: 'shipping_method',
              resourceId: row.id,
            },
            transaction,
          );
          return service.shippingDto(row);
        });
      },
      method === 'post' ? 201 : 200,
    ),
  );
}
router.post(
  '/shipping/quotes',
  apiHandler(async (req) => {
    const body = requestBody(req);
    const raw = cartLines(body.data.items);
    if (!Array.isArray(raw) || raw.length < 1 || raw.length > 100) return body.invalid('items');
    let subtotal = 0;
    for (const item of raw) {
      const variant = await ProductVariantModel.findOne({
        where: { id: item.variantId, status: 'active' },
      });
      if (
        !variant ||
        !(await ProductModel.findOne({ where: { id: variant.productId, status: 'active' } }))
      )
        throw new NotFound('variant_unavailable');
      subtotal += variant.price * item.quantity;
    }
    if (!Number.isSafeInteger(subtotal) || subtotal > 2_147_483_647)
      throw new InputValidError('amount_too_large');
    return service.quoteShipping(
      body.text('city', 120),
      subtotal,
      body.optionalText('shippingMethodId', 36),
    );
  }),
);
export default router;
