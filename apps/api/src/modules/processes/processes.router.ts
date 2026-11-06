import { randomUUID } from 'node:crypto';
import {
  exportResourceSchema,
  fileFormatSchema,
  IMPORT_COLUMNS,
  importResourceSchema,
} from '@p4/processes/shared';
import type { ListQuery } from '@p4/shared';
import { type NextFunction, type Request, type Response, Router } from 'express';
import multer from 'multer';
import * as v from 'valibot';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { rateLimit } from '@/middlewares/rate-limit.middleware.js';
import { ProcessItemModel, ProcessModel, UploadTicketModel } from '@/sequelize/models/index.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { applyAuditPolicies } from '@/shared/audit/route-policy.js';
import { currentUser, requestBody, routeId, uuidRouteId } from '@/shared/http-input.js';
import { validateListQuery } from '@/shared/list-query.js';
import { listSearch } from '@/shared/list-search.js';
import { InputValidError, NotFound } from '@/utils/errors/index.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import { selectFields } from '@/utils/select-fields.js';
import { createUpload } from '../files/uploads.service.js';
import { auditPolicies } from './processes.audit.js';
import * as processes from './processes.service.js';
import { processStoragePath, removeProcessFile, storeProcessFile } from './storage.service.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10485760, files: 1, fields: 0, parts: 1 },
  fileFilter: (_req, file, callback) => {
    if (!/\.(csv|xlsx)$/i.test(file.originalname))
      return callback(new InputValidError('import_requires_csv_or_xlsx'));
    callback(null, true);
  },
}).single('file');
router.post(
  '/admin/imports/:resource',
  authRequired,
  rateLimit('import-create', 10, 3600000),
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      const resource = v.parse(importResourceSchema, routeId(req, 'resource'));
      processes.authorizeProcess(currentUser(req), {
        kind: 'data.import',
        resource,
        format: 'csv',
        fileName: '',
        storageKey: '',
      });
      next();
    } catch (error) {
      next(error);
    }
  },
  (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (error: unknown) => {
      if (error)
        return next(
          error instanceof multer.MulterError ? new InputValidError('import_upload_limit') : error,
        );
      next();
    });
  },
  apiHandler(async (req) => {
    if (!req.file) throw new InputValidError('file_required');
    const format = /\.xlsx$/i.test(req.file.originalname) ? 'xlsx' : 'csv';
    const key = await storeProcessFile(req.file.buffer, format);
    try {
      const result = await processes.createProcess(
        currentUser(req),
        {
          kind: 'data.import',
          resource: v.parse(importResourceSchema, routeId(req, 'resource')),
          format,
          fileName: req.file.originalname.slice(0, 200),
          storageKey: key,
        },
        req.header('Idempotency-Key') ?? '',
      );
      const stored = await ProcessModel.findByPk(result.id);
      if (stored?.input.kind === 'data.import' && stored.input.storageKey !== key)
        await removeProcessFile(key);
      return result;
    } catch (error) {
      await removeProcessFile(key);
      throw error;
    }
  }, 202),
);
router.get(
  '/admin/import-templates/:resource',
  authRequired,
  apiHandler(async (req) => {
    const resource = v.parse(importResourceSchema, routeId(req, 'resource'));
    processes.authorizeProcess(currentUser(req), {
      kind: 'data.import',
      resource,
      format: 'csv',
      fileName: '',
      storageKey: '',
    });
    return {
      resource,
      columns: IMPORT_COLUMNS[resource],
      format: 'csv',
      notes:
        'Headers are case-sensitive. Preview runs before apply. Inventory quantity is a signed adjustment, not an absolute balance.',
    };
  }),
);
router.post(
  '/admin/exports',
  authRequired,
  rateLimit('export-create', 10, 3600000),
  apiHandler(async (req) => {
    const body = requestBody(req);
    const raw = body.data.query ?? {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return body.invalid('query');
    const query: Record<string, string | number | boolean | null> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (
        key.length > 80 ||
        (typeof value === 'string' && value.length > 255) ||
        (value !== null && !['string', 'number', 'boolean'].includes(typeof value))
      )
        return body.invalid('query');
      if (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      )
        query[key] = value;
    }
    return processes.createProcess(
      currentUser(req),
      {
        kind: 'data.export',
        resource: v.parse(exportResourceSchema, body.data.resource),
        format: v.parse(fileFormatSchema, body.data.format),
        query,
      },
      req.header('Idempotency-Key') ?? '',
    );
  }, 202),
);
router.post(
  '/files/uploads/batch',
  authRequired,
  rateLimit('upload-batch', 10),
  apiHandler(async (req) => {
    const body = requestBody(req);
    const purpose = body.enum('purpose', [
      'avatar',
      'product',
      'review',
      'return',
      'support',
      'blog',
    ]);
    const names = body.strings('names', 20, 200);
    if (!names.length) return body.invalid('names');
    const tickets = [];
    for (const name of names)
      tickets.push({
        name,
        ...(await createUpload(
          currentUser(req),
          purpose,
          body.optionalText('resourceId', 128) ?? null,
        )),
      });
    return { batchId: randomUUID(), tickets };
  }, 201),
);
router.post(
  '/files/uploads/batch/complete',
  authRequired,
  apiHandler(async (req) => {
    const body = requestBody(req);
    const ticketIds = [...new Set(body.strings('ticketIds', 20, 36))];
    if (!ticketIds.length || ticketIds.some((id) => !/^[a-f0-9-]{36}$/i.test(id)))
      return body.invalid('ticketIds');
    if (
      (await UploadTicketModel.count({
        where: { id: ticketIds, ownerId: currentUser(req).id },
      })) !== ticketIds.length
    )
      throw new NotFound();
    return processes.createProcess(
      currentUser(req),
      { kind: 'media.batch', ticketIds },
      req.header('Idempotency-Key') ?? '',
    );
  }, 202),
);
const list = validateListQuery({
  sortFields: ['createdAt'],
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  rules: () => ({}),
  normalize: (_query, base) => base,
});
router.get(
  '/processes',
  authRequired,
  list,
  listHandler(async (req, query: ListQuery<'createdAt'>) => {
    const result = await ProcessModel.findAndCountAll({
      where: {
        userId: currentUser(req).id,
        ...listSearch(ProcessModel, query.q, ['id', 'kind', 'state', 'errorCode']),
      },
      order: [
        ['createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
        ['id', 'ASC'],
      ],
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
    return {
      data: result.rows.map(processes.processDto),
      meta: buildPaginationMeta(query.page, query.pageSize, result.count),
    };
  }),
);
router.get(
  '/processes/:id',
  authRequired,
  apiHandler(async (req) =>
    processes.processDto(await processes.ownedProcess(currentUser(req).id, uuidRouteId(req))),
  ),
);
const itemList = validateListQuery({
  sortFields: ['index', 'state', 'createdAt'],
  defaultSort: 'index',
  rules: () => ({}),
  normalize: (_query, base) => base,
});
router.get(
  '/processes/:id/items',
  authRequired,
  itemList,
  listHandler(async (req, query: ListQuery<'index' | 'state' | 'createdAt'>) => {
    const row = await processes.ownedProcess(currentUser(req).id, uuidRouteId(req));
    const result = await ProcessItemModel.findAndCountAll({
      where: {
        processId: row.id,
        ...listSearch(ProcessItemModel, query.q, ['data', 'issues', 'state']),
      },
      order: [
        [query.sortBy ?? 'index', query.sortOrder === 'desc' ? 'DESC' : 'ASC'],
        ['id', 'ASC'],
      ],
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
    return {
      data: result.rows.map((item) =>
        selectFields(item, ['index', 'state', 'data', 'issues', 'result']),
      ),
      meta: buildPaginationMeta(query.page, query.pageSize, result.count),
    };
  }),
);
router.post(
  '/processes/:id/confirm',
  authRequired,
  apiHandler(
    async (req) =>
      processes.confirmProcess(
        currentUser(req),
        uuidRouteId(req),
        requestBody(req).integer('expectedVersion', 1),
      ),
    202,
  ),
);
router.post(
  '/processes/:id/cancel',
  authRequired,
  apiHandler(async (req) =>
    processes.cancelProcess(
      currentUser(req),
      uuidRouteId(req),
      requestBody(req).integer('expectedVersion', 1),
    ),
  ),
);
router.get(
  '/processes/:id/download',
  authRequired,
  (req: Request, res: Response, next: NextFunction) => {
    void (async () => {
      const row = await processes.ownedProcess(currentUser(req).id, uuidRouteId(req));
      processes.authorizeProcess(currentUser(req), row.input);
      if (
        row.input.kind !== 'data.export' ||
        row.state !== 'completed' ||
        !row.outputKey ||
        row.expiresAt.getTime() <= Date.now()
      )
        throw new NotFound();
      res.setHeader('Cache-Control', 'no-store');
      res.type(
        row.input.format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv',
      );
      res.download(
        processStoragePath(row.outputKey),
        `${row.input.resource}.${row.input.format}`,
        (error) => {
          if (error && !res.headersSent) next(error);
        },
      );
    })().catch(next);
  },
);
export default applyAuditPolicies(router, auditPolicies);
