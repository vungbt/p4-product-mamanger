import { randomUUID } from 'node:crypto';
import {
  applyAuditPolicies,
  BaseError,
  buildPaginationMeta,
  currentUser,
  listSearch,
  NotFound,
  queryText,
  requestBody,
  routeId,
  searchPattern,
  uuidQueryRule,
  uuidRouteId,
  validateListQuery,
} from '@p4/server-core';
import type { ContentKind, ListQuery } from '@p4/shared';
import { CONTENT_STATUS_VALUES, type ContentListQuery, type TaxonomyListQuery } from '@p4/shared';
import { Router } from 'express';
import { Op } from 'sequelize';
import { requireAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import {
  ContentEntryModel,
  ContentRevisionModel,
  ContentTaxonomyModel,
} from '@/sequelize/models/index.js';
import { apiHandler, listHandler, optionalListHandler } from '@/shared/api-handler.js';
import { selectFields } from '@/utils/select-fields.js';
import { normalizedSlug } from '../catalog/catalog.service.js';
import { auditPolicies } from './content.audit.js';
import * as content from './content.service.js';
import { contentInput } from './content.validation.js';

const router = Router();
const read = [authRequired, requireAbility('read', 'Content')];
const write = [authRequired, requireAbility('write', 'Content')];
const publish = [authRequired, requireAbility('publish', 'Content')];
const list = validateListQuery({
  sortFields: ['title', 'createdAt'],
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  rules: () => ({
    taxonomyId: uuidQueryRule,
    status: `sometimes|required|in:${CONTENT_STATUS_VALUES.join(',')}`,
  }),
  normalize: (query, base): ContentListQuery => ({
    ...base,
    status: CONTENT_STATUS_VALUES.find((value) => value === queryText(query, 'status')),
    taxonomyId: queryText(query, 'taxonomyId'),
  }),
});
const revisionList = validateListQuery({
  sortFields: ['version', 'createdAt'],
  defaultSort: 'version',
  defaultOrder: 'desc',
  rules: () => ({}),
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
    listHandler(async (_req, query: ContentListQuery) => {
      const result = await ContentEntryModel.findAndCountAll({
        where: {
          kind,
          ...(query.status ? { status: query.status } : {}),
          ...(query.taxonomyId ? { taxonomyIds: { [Op.contains]: [query.taxonomyId] } } : {}),
          ...(query.q ? { title: { [Op.iLike]: searchPattern(query.q) } } : {}),
        },
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
    revisionList,
    listHandler(async (req, query: ListQuery<'version' | 'createdAt'>) => {
      const id = uuidRouteId(req);
      if (!(await ContentEntryModel.findOne({ where: { id, kind } }))) throw new NotFound();
      const result = await ContentRevisionModel.findAndCountAll({
        where: { entryId: id, ...listSearch(ContentRevisionModel, query.q, ['snapshot']) },
        order: [
          [query.sortBy ?? 'version', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
          ['id', 'ASC'],
        ],
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
const publicList = validateListQuery({
  sortFields: ['title', 'createdAt'],
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  rules: () => ({ taxonomyId: uuidQueryRule }),
  normalize: (_query, base) => base,
});
router.get(
  '/posts',
  publicList,
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
const taxonomyList = validateListQuery({
  sortFields: ['name', 'slug', 'createdAt'],
  defaultSort: 'name',
  legacy: true,
  rules: () => ({}),
  normalize: (_query, base): TaxonomyListQuery => base,
});
for (const [path, kind] of [
  ['post-categories', 'category'],
  ['post-tags', 'tag'],
] as const) {
  router.get(
    `/${path}`,
    taxonomyList,
    optionalListHandler(async (_req, query: TaxonomyListQuery | undefined) => {
      const result = await ContentTaxonomyModel.findAndCountAll({
        where: { kind, ...listSearch(ContentTaxonomyModel, query?.q, ['name', 'slug']) },
        order: [
          [query?.sortBy ?? 'name', query?.sortOrder === 'desc' ? 'DESC' : 'ASC'],
          ['id', 'ASC'],
        ],
        limit: query?.pageSize ?? 100,
        ...(query ? { offset: (query.page - 1) * query.pageSize } : {}),
      });
      return {
        data: result.rows.map((row) => selectFields(row, ['id', 'name', 'slug'])),
        ...(query ? { meta: buildPaginationMeta(query.page, query.pageSize, result.count) } : {}),
      };
    }),
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
