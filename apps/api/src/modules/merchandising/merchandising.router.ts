import type { MerchandisingListQuery, MerchandisingPayload } from '@p4/shared';
import { Router } from 'express';
import { Op } from 'sequelize';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { requirePermission } from '@/middlewares/permission.middleware.js';
import { MerchandisingEntryModel } from '@/sequelize/models/index.js';
import { apiHandler, listHandler, optionalListHandler } from '@/shared/api-handler.js';
import { applyAuditPolicies } from '@/shared/audit/route-policy.js';
import { currentUser, requestBody, routeId, uuidRouteId } from '@/shared/http-input.js';
import { queryText, validateListQuery } from '@/shared/list-query.js';
import { listSearch } from '@/shared/list-search.js';
import { NotFound } from '@/utils/errors/index.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import { normalizedSlug } from '../catalog/catalog.service.js';
import { auditPolicies } from './merchandising.audit.js';
import * as merch from './merchandising.service.js';
import { merchandisingInput } from './merchandising.validation.js';

const router = Router();
const read = [authRequired, requirePermission('content:read')];
const write = [authRequired, requirePermission('content:write')];
const list = validateListQuery({
  sortFields: ['key', 'active', 'createdAt'],
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  rules: () => ({ active: 'sometimes|required|in:true,false' }),
  normalize: (query, base): MerchandisingListQuery => ({
    ...base,
    active:
      queryText(query, 'active') === undefined ? undefined : queryText(query, 'active') === 'true',
  }),
});
for (const [path, kind] of [
  ['collections', 'collection'],
  ['banners', 'banner'],
] satisfies [string, MerchandisingPayload['kind']][]) {
  router.get(
    `/admin/${path}`,
    ...read,
    list,
    listHandler(async (_req, query: MerchandisingListQuery) => {
      const result = await MerchandisingEntryModel.findAndCountAll({
        where: {
          kind,
          ...(query.active === undefined ? {} : { active: query.active }),
          ...listSearch(MerchandisingEntryModel, query.q, ['key', 'payload']),
        },
        order: [
          [query.sortBy ?? 'createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
          ['id', 'ASC'],
        ],
        limit: query.pageSize,
        offset: (query.page - 1) * query.pageSize,
      });
      return {
        data: result.rows.map(merch.merchandisingDto),
        meta: buildPaginationMeta(query.page, query.pageSize, result.count),
      };
    }),
  );
  router.get(
    `/admin/${path}/:id`,
    ...read,
    apiHandler(async (req) => {
      const row = await MerchandisingEntryModel.findOne({ where: { id: uuidRouteId(req), kind } });
      if (!row) throw new NotFound();
      return merch.merchandisingDto(row);
    }),
  );
  for (const method of ['post', 'patch'] as const)
    router[method](
      method === 'post' ? `/admin/${path}` : `/admin/${path}/:id`,
      ...write,
      apiHandler(
        async (req) => {
          const body = requestBody(req);
          const date = (key: string) => {
            const raw = body.optionalText(key, 30);
            if (!raw) return null;
            const value = new Date(raw);
            if (Number.isNaN(value.getTime())) return body.invalid(key);
            return value;
          };
          return merch.saveMerchandising(
            currentUser(req).id,
            normalizedSlug(body.text('key', 160)),
            merchandisingInput(req, kind),
            body.boolean('active'),
            date('startsAt'),
            date('endsAt'),
            method === 'patch' ? uuidRouteId(req) : undefined,
            method === 'patch' ? body.integer('expectedVersion', 1) : undefined,
          );
        },
        method === 'post' ? 201 : 200,
      ),
    );
}
const publicCollections = validateListQuery({
  sortFields: ['key', 'createdAt'],
  defaultSort: 'key',
  legacy: true,
  rules: () => ({}),
  normalize: (_query, base) => base,
});
router.get(
  '/collections',
  publicCollections,
  optionalListHandler(
    async (_req, query: import('@p4/shared').ListQuery<'key' | 'createdAt'> | undefined) => {
      const now = new Date();
      const result = await MerchandisingEntryModel.findAndCountAll({
        where: {
          kind: 'collection',
          active: true,
          ...listSearch(MerchandisingEntryModel, query?.q, ['key', 'payload']),
          [Op.and]: [
            { [Op.or]: [{ startsAt: null }, { startsAt: { [Op.lte]: now } }] },
            { [Op.or]: [{ endsAt: null }, { endsAt: { [Op.gt]: now } }] },
          ],
        },
        order: [
          [query?.sortBy ?? 'key', query?.sortOrder === 'desc' ? 'DESC' : 'ASC'],
          ['id', 'ASC'],
        ],
        limit: query?.pageSize ?? 100,
        ...(query ? { offset: (query.page - 1) * query.pageSize } : {}),
      });
      return {
        data: await Promise.all(result.rows.map((row) => merch.publicMerchandising(row))),
        ...(query ? { meta: buildPaginationMeta(query.page, query.pageSize, result.count) } : {}),
      };
    },
  ),
);
router.get(
  '/collections/:slug',
  apiHandler(async (req) => {
    const row = await MerchandisingEntryModel.findOne({
      where: { kind: 'collection', key: routeId(req, 'slug') },
    });
    if (!row) throw new NotFound();
    return merch.publicMerchandising(row);
  }),
);
for (const [kind, path] of [
  ['navigation', 'navigation/:placement'],
  ['home', 'home-layout'],
] as const) {
  router.get(
    `/admin/${path}`,
    ...read,
    apiHandler(async (req) => {
      const row = await MerchandisingEntryModel.findOne({
        where: { kind, key: kind === 'home' ? 'home' : routeId(req, 'placement') },
      });
      if (!row) throw new NotFound();
      return merch.merchandisingDto(row);
    }),
  );
  router.patch(
    `/admin/${path}`,
    ...write,
    apiHandler(async (req) => {
      const body = requestBody(req);
      const key = kind === 'home' ? 'home' : routeId(req, 'placement');
      const row = await MerchandisingEntryModel.findOne({ where: { kind, key } });
      return merch.saveMerchandising(
        currentUser(req).id,
        key,
        merchandisingInput(req, kind),
        true,
        null,
        null,
        row?.id,
        row ? body.integer('expectedVersion', 1) : undefined,
      );
    }),
  );
}
router.get(
  '/navigation/:placement',
  apiHandler(async (req) => {
    const row = await MerchandisingEntryModel.findOne({
      where: { kind: 'navigation', key: routeId(req, 'placement') },
    });
    return row ? merch.publicMerchandising(row) : { items: [] };
  }),
);
router.get(
  '/storefront/home',
  apiHandler(async () => {
    const layout = await MerchandisingEntryModel.findOne({ where: { kind: 'home', key: 'home' } });
    if (!layout || !merch.visible(layout) || layout.payload.kind !== 'home')
      return { sections: [] };
    const sections = [];
    for (const section of layout.payload.sections) {
      const row = await MerchandisingEntryModel.findByPk(section.entryId);
      if (row && merch.visible(row))
        sections.push({
          id: section.id,
          type: section.type,
          data: await merch.publicMerchandising(row),
        });
    }
    return { sections };
  }),
);
export default applyAuditPolicies(router, auditPolicies);
