import {
  applyAuditPolicies,
  currentUser,
  InputValidError,
  queryText,
  uuidRouteId,
  validateListQuery,
} from '@p4/server-core';
import {
  TENANT_IMPORT_COLUMNS,
  TENANT_IMPORT_MAX_ROWS,
  TENANT_STATUS_FILTERS,
  type TenantImportCommitRow,
} from '@stay/shared';
import { type NextFunction, type Request, type Response, Router } from 'express';
import multer from 'multer';
import { requireAbility, requireScopedAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { rateLimit } from '@/middlewares/rate-limit.middleware.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { type FormBody, formBody } from '@/shared/input.js';
import { emailTenantCredentials, issueTenantCredentials } from './tenant-accounts.service.js';
import { auditPolicies } from './tenants.audit.js';
import { commitImport, IMPORT_MAX_BYTES, importTemplate, previewImport } from './tenants.import.js';
import { readDocumentInput, readTenantInput, readVehicleInput } from './tenants.input.js';
import {
  addVehicle,
  archiveTenant,
  attachDocument,
  createTenant,
  findAccessibleTenant,
  getTenant,
  listTenants,
  removeVehicle,
  revealIdNumber,
  type TenantListQuery,
  type TenantSortField,
  tenantTargetBuilding,
  updateTenant,
  updateVehicle,
} from './tenants.service.js';

const router = Router();
const sortFields: TenantSortField[] = ['fullName', 'createdAt'];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IMPORT_COLUMN_KEYS: readonly string[] = TENANT_IMPORT_COLUMNS.map((column) => column.key);

const validateTenantListQuery = validateListQuery({
  sortFields,
  defaultSort: 'fullName',
  rules: () => ({
    status: `sometimes|required|in:${TENANT_STATUS_FILTERS.join(',')}`,
    buildingId: 'sometimes|required|string|regex:/^[0-9a-fA-F-]{36}$/',
  }),
  normalize: (query, base): TenantListQuery => ({
    ...base,
    status: TENANT_STATUS_FILTERS.find((value) => value === queryText(query, 'status')) ?? 'all',
    buildingId: queryText(query, 'buildingId'),
  }),
});

const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: IMPORT_MAX_BYTES, files: 1, fields: 2, parts: 3 },
}).single('file');

function receiveImportFile(req: Request, res: Response, next: NextFunction) {
  importUpload(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError)
      return next(
        new InputValidError('input_valid_error', {
          file: [req.t('error:import_file_too_large')],
        }),
      );
    next(error);
  });
}

/** `?buildingId=` of the import routes: a building the owner can see. */
function importBuildingId(req: Request) {
  const buildingId = queryText(req.query, 'buildingId') ?? '';

  if (!UUID_PATTERN.test(buildingId))
    throw new InputValidError('input_valid_error', {
      buildingId: [req.t('error:building_not_found')],
    });
  return buildingId;
}

/** Body of `POST /api/tenants/import`: the previewed rows, checked again on commit. */
function readImportCommitInput(body: FormBody) {
  const buildingId = body.text('buildingId', 36);
  const raw = body.data.rows;
  const rows: TenantImportCommitRow[] = [];

  if (!body.errors.buildingId) body.check('buildingId', UUID_PATTERN.test(buildingId));
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > TENANT_IMPORT_MAX_ROWS)
    body.invalid('rows', 'import_rows', { max: TENANT_IMPORT_MAX_ROWS });
  else
    for (const item of raw) {
      const line: unknown = item?.line;
      const values: unknown = item?.values;

      if (
        typeof line !== 'number' ||
        !Number.isSafeInteger(line) ||
        line < 2 ||
        !values ||
        typeof values !== 'object' ||
        Array.isArray(values) ||
        Object.entries(values).some(
          ([key, value]) =>
            !IMPORT_COLUMN_KEYS.includes(key) || typeof value !== 'string' || value.length > 5000,
        )
      ) {
        body.invalid('rows', 'import_rows', { max: TENANT_IMPORT_MAX_ROWS });
        break;
      }
      rows.push({ line, values: Object.fromEntries(Object.entries(values)) });
    }
  body.assertValid();
  return { buildingId, rows };
}

router.post(
  '/tenants/:id/credentials',
  authRequired,
  requireScopedAbility('issue', 'Tenant'),
  rateLimit('stay-tenant-credentials', 20),
  apiHandler((req) => {
    req.res?.setHeader('Cache-Control', 'no-store');
    return issueTenantCredentials(currentUser(req), uuidRouteId(req));
  }),
);
router.post(
  '/tenants/:id/credentials/email',
  authRequired,
  requireScopedAbility('issue', 'Tenant'),
  rateLimit('stay-tenant-credentials-email', 10),
  apiHandler((req) => {
    const body = formBody(req);
    const password = body.text('password', 128);

    body.assertValid();
    return emailTenantCredentials(currentUser(req), uuidRouteId(req), password);
  }),
);

router.get(
  '/tenants',
  authRequired,
  requireScopedAbility('read', 'Tenant'),
  validateTenantListQuery,
  listHandler((req, query: TenantListQuery) => listTenants(currentUser(req), query)),
);
router.post(
  '/tenants',
  authRequired,
  requireScopedAbility('create', 'Tenant'),
  apiHandler(async (req) => {
    const user = currentUser(req);
    const body = formBody(req);
    const buildingId = await tenantTargetBuilding(user, body, 'create');

    return createTenant(buildingId, await readTenantInput(body, user));
  }, 201),
);
router.get(
  '/tenants/import/template',
  authRequired,
  requireAbility('manage', 'Tenant'),
  (req, res, next) => {
    const format = queryText(req.query, 'format') === 'csv' ? 'csv' : 'xlsx';

    importTemplate(format)
      .then((file) => {
        res.attachment(`mau-nguoi-thue.${format}`);
        res.type(format === 'csv' ? 'text/csv; charset=utf-8' : format);
        res.send(file);
      })
      .catch(next);
  },
);
router.post(
  '/tenants/import/preview',
  authRequired,
  requireAbility('manage', 'Tenant'),
  rateLimit('stay-tenant-import', 30),
  receiveImportFile,
  apiHandler(async (req) => {
    if (!req.file)
      throw new InputValidError('input_valid_error', {
        file: [req.t('error:import_file_required')],
      });
    return previewImport(
      currentUser(req),
      importBuildingId(req),
      { name: req.file.originalname, buffer: req.file.buffer },
      req.t,
    );
  }),
);
router.post(
  '/tenants/import',
  authRequired,
  requireAbility('manage', 'Tenant'),
  apiHandler(async (req) => {
    const input = readImportCommitInput(formBody(req));

    return commitImport(currentUser(req), input, req.header('Idempotency-Key') ?? '', req.t);
  }, 201),
);
router.get(
  '/tenants/:id',
  authRequired,
  requireScopedAbility('read', 'Tenant'),
  apiHandler((req) => getTenant(currentUser(req), uuidRouteId(req))),
);
router.put(
  '/tenants/:id',
  authRequired,
  requireScopedAbility('update', 'Tenant'),
  apiHandler(async (req) => {
    const user = currentUser(req);
    const tenant = await findAccessibleTenant(user, uuidRouteId(req), 'update');
    const body = formBody(req);
    const version = body.integer('version', 1);
    const input = await readTenantInput(body, user, tenant);

    return updateTenant(user, tenant.id, input, version);
  }),
);
router.post(
  '/tenants/:id/reveal-id',
  authRequired,
  requireScopedAbility('read', 'Tenant'),
  apiHandler((req) => revealIdNumber(currentUser(req), uuidRouteId(req))),
);
router.post(
  '/tenants/:id/archive',
  authRequired,
  requireScopedAbility('delete', 'Tenant'),
  apiHandler((req) => archiveTenant(currentUser(req), uuidRouteId(req))),
);
router.post(
  '/tenants/:id/documents',
  authRequired,
  requireScopedAbility('update', 'Tenant'),
  apiHandler(async (req) => {
    const body = formBody(req);

    return attachDocument(currentUser(req), uuidRouteId(req), readDocumentInput(body), body);
  }, 201),
);
router.post(
  '/tenants/:id/vehicles',
  authRequired,
  requireScopedAbility('update', 'Tenant'),
  apiHandler(async (req) => {
    const body = formBody(req);

    return addVehicle(currentUser(req), uuidRouteId(req), readVehicleInput(body), body);
  }, 201),
);
router.put(
  '/tenants/:id/vehicles/:vehicleId',
  authRequired,
  requireScopedAbility('update', 'Tenant'),
  apiHandler(async (req) => {
    const body = formBody(req);

    return updateVehicle(
      currentUser(req),
      uuidRouteId(req),
      uuidRouteId(req, 'vehicleId'),
      readVehicleInput(body),
      body,
    );
  }),
);
router.delete(
  '/tenants/:id/vehicles/:vehicleId',
  authRequired,
  requireScopedAbility('update', 'Tenant'),
  apiHandler((req) =>
    removeVehicle(currentUser(req), uuidRouteId(req), uuidRouteId(req, 'vehicleId')),
  ),
);

export default applyAuditPolicies(router, auditPolicies);
