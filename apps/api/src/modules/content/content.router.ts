import { randomUUID } from 'node:crypto';
import type { ContentKind, ListQuery } from '@p4/shared';
import { Router } from 'express';
import { Op } from 'sequelize';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { requirePermission } from '@/middlewares/permission.middleware.js';
import {
  ContentEntryModel,
  ContentRevisionModel,
  ContentTaxonomyModel,
} from '@/sequelize/models/index.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { applyAuditPolicies } from '@/shared/audit/route-policy.js';
import { currentUser, requestBody, routeId, uuidRouteId } from '@/shared/http-input.js';
import { searchPattern } from '@/shared/list-filters.js';
import { queryText, validateListQuery } from '@/shared/list-query.js';
import { BaseError } from '@/utils/errors/base-error.js';
import { NotFound } from '@/utils/errors/index.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import { selectFields } from '@/utils/select-fields.js';
import { normalizedSlug } from '../catalog/catalog.service.js';
import { auditPolicies } from './content.audit.js';
import * as content from './content.service.js';
import { contentInput } from './content.validation.js';

const router = Router();
const read = [authRequired, requirePermission('content:read')];
const write = [authRequired, requirePermission('content:write')];
const publish = [authRequired, requirePermission('content:publish')];
const list = validateListQuery({
  sortFields: ['title', 'createdAt'],
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  rules: () => ({ taxonomyId: 'string|max:36' }),
  normalize: (_query, base) => base,
});
for (const [path, kind] of [
  ['posts', 'post'],
  ['pages', 'page'],
] satisfies [string, ContentKind][]) {
  router.get(
    `/${path}/:slug`,
    apiHandler(async (req) => content.publicContent(kind, routeId(req, 'slug'))),
  );
  router.get(
    `/admin/${path}`,
    ...read,
    list,
    listHandler(async (_req, query: ListQuery<'title' | 'createdAt'>) => {
      const result = await ContentEntryModel.findAndCountAll({
        where: { kind, ...(query.q ? { title: { [Op.iLike]: searchPattern(query.q) } } : {}) },
        order: [
          [query.sortBy ?? 'createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
          ['id', 'ASC'],
        ],
        limit: query.pageSize,
        offset: (query.page - 1) * query.pageSize,
      });
      return {
        data: result.rows.map(content.contentDto),
        meta: buildPaginationMeta(query.page, query.pageSize, result.count),
      };
    }),
  );
  router.get(
    `/admin/${path}/:id`,
    ...read,
    apiHandler(async (req) => {
      const row = await ContentEntryModel.findOne({ where: { id: uuidRouteId(req), kind } });
      if (!row) throw new NotFound();
      return content.contentDto(row);
    }),
  );
  router.post(
    `/admin/${path}`,
    ...write,
    apiHandler(
      async (req) => content.saveContent(currentUser(req).id, kind, contentInput(req)),
      201,
    ),
  );
  router.patch(
    `/admin/${path}/:id`,
    ...write,
    apiHandler(async (req) =>
      content.saveContent(
        currentUser(req).id,
        kind,
        contentInput(req),
        uuidRouteId(req),
        requestBody(req).integer('expectedVersion', 1),
      ),
    ),
  );
  router.post(
    `/admin/${path}/:id/publish`,
    ...publish,
    apiHandler(async (req) => {
      const body = requestBody(req);
      const raw = body.optionalText('scheduledAt', 30);
      let scheduledAt: Date | undefined;
      if (raw) {
        scheduledAt = new Date(raw);
        if (!/^\d{4}-\d{2}-\d{2}T/.test(raw) || Number.isNaN(scheduledAt.getTime()))
          return body.invalid('scheduledAt');
      }
      return content.publishContent(
        currentUser(req).id,
        uuidRouteId(req),
        kind,
        body.integer('expectedVersion', 1),
        scheduledAt ? 'scheduled' : 'published',
        scheduledAt,
      );
    }),
  );
  router.post(
    `/admin/${path}/:id/archive`,
    ...publish,
    apiHandler(async (req) =>
      content.publishContent(
        currentUser(req).id,
        uuidRouteId(req),
        kind,
        requestBody(req).integer('expectedVersion', 1),
        'archived',
      ),
    ),
  );
  router.get(
    `/admin/${path}/:id/revisions`,
    ...read,
    list,
    listHandler(async (req, query: ListQuery<'title' | 'createdAt'>) => {
      const id = uuidRouteId(req);
      if (!(await ContentEntryModel.findOne({ where: { id, kind } }))) throw new NotFound();
      const result = await ContentRevisionModel.findAndCountAll({
        where: { entryId: id },
        order: [['version', 'DESC']],
        limit: query.pageSize,
        offset: (query.page - 1) * query.pageSize,
      });
      return {
        data: result.rows.map((row) => ({
          id: row.id,
          version: row.version,
          snapshot: row.snapshot,
          createdAt: row.createdAt.toISOString(),
        })),
        meta: buildPaginationMeta(query.page, query.pageSize, result.count),
      };
    }),
  );
}
router.get(
  '/posts',
  list,
  listHandler(async (req, query: ListQuery<'title' | 'createdAt'>) => {
    const taxonomyId = queryText(req.query, 'taxonomyId');
    if (taxonomyId && !/^[a-f0-9-]{36}$/i.test(taxonomyId)) throw new BaseError('invalid_taxonomy');
    // Query the published JSON projection so changes to draft title/tags never leak.
    const where = {
      kind: 'post',
      status: { [Op.ne]: 'archived' },
      publishedSnapshot: { [Op.ne]: null },
      ...(taxonomyId ? { 'publishedSnapshot.taxonomyIds': { [Op.contains]: [taxonomyId] } } : {}),
      ...(query.q ? { 'publishedSnapshot.title': { [Op.iLike]: searchPattern(query.q) } } : {}),
    };
    const result = await ContentEntryModel.findAndCountAll({
      where,
      order: [
        ['publishedAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
        ['id', 'ASC'],
      ],
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
    return {
      data: result.rows.map((row) => row.publishedSnapshot),
      meta: buildPaginationMeta(query.page, query.pageSize, result.count),
    };
  }),
);
for (const [path, kind] of [
  ['post-categories', 'category'],
  ['post-tags', 'tag'],
] as const) {
  router.get(
    `/${path}`,
    apiHandler(async () =>
      (
        await ContentTaxonomyModel.findAll({
          where: { kind },
          order: [['name', 'ASC']],
          limit: 100,
        })
      ).map((row) => selectFields(row, ['id', 'name', 'slug'])),
    ),
  );
  router.post(
    `/admin/${path}`,
    ...write,
    apiHandler(async (req) => {
      const body = requestBody(req);
      return selectFields(
        await ContentTaxonomyModel.create({
          id: randomUUID(),
          kind,
          name: body.text('name', 120),
          slug: normalizedSlug(body.text('slug', 160)),
        }),
        ['id', 'name', 'slug'],
      );
    }, 201),
  );
  router.patch(
    `/admin/${path}/:id`,
    ...write,
    apiHandler(async (req) => {
      const body = requestBody(req);
      const row = await ContentTaxonomyModel.findOne({ where: { id: uuidRouteId(req), kind } });
      if (!row) throw new NotFound();
      await row.update({
        name: body.text('name', 120),
        slug: normalizedSlug(body.text('slug', 160)),
      });
      return selectFields(row, ['id', 'name', 'slug']);
    }),
  );
}
router.get(
  '/policies/current',
  apiHandler(async () => {
    const rows = await ContentEntryModel.findAll({
      where: {
        kind: 'page',
        status: { [Op.ne]: 'archived' },
        publishedSnapshot: { [Op.ne]: null },
        slug: { [Op.in]: ['shipping', 'returns', 'privacy', 'terms'] },
      },
      order: [['slug', 'ASC']],
    });
    return rows.map((row) => row.publishedSnapshot);
  }),
);
export default applyAuditPolicies(router, auditPolicies);
