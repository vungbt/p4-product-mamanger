import {
  BaseError,
  buildPaginationMeta,
  NotFound,
  selectFields,
  setAuditChanges,
} from '@p4/server-core';
import type { ListQuery, PaginationMeta } from '@p4/shared';
import {
  maskIdNumber,
  plateKey,
  type StayAction,
  type StayTenant,
  type StayTenantDetail,
  type StayUser,
  type TenantDocument,
  type TenantDocumentKind,
  type TenantIdReveal,
  type TenantStatusFilter,
  type TenantVehicle,
} from '@stay/shared';
import { cast, col, Op, type Transaction, type WhereOptions, where } from 'sequelize';
import { canAccessRecord, hasAccess } from '@/middlewares/ability.middleware.js';
import { accessibleWhere } from '@/middlewares/accessible-where.js';
import {
  BuildingModel,
  FileModel,
  TenantDocumentModel,
  TenantModel,
  VehicleModel,
} from '@/sequelize/models/index.js';
import type { TenantAttributes } from '@/sequelize/models/tenant.model.js';
import { auditedTransaction, recordAudit } from '@/shared/audit.js';
import { assertVersion, type FormBody } from '@/shared/input.js';
import type { ModelOrder } from '@/types/database.js';
import { attachableFile, signedFileUrl } from '../uploads/uploads.service.js';
import type { TenantFields, VehicleInput } from './tenants.input.js';
import {
  type TenantOccupancy,
  tenantContracts,
  tenantHasActiveContract,
  tenantOccupancy,
  tenantStatusWhere,
} from './tenants.occupancy.js';

export type TenantSortField = 'fullName' | 'createdAt';

export interface TenantListQuery extends ListQuery<TenantSortField> {
  status: TenantStatusFilter;
  buildingId?: string;
}

const NO_OCCUPANCY: TenantOccupancy = { status: 'no_contract', currentRoom: null };

/**
 * Audit facts of a tenant: no personal values (name, phone, CCCD, dates, addresses), only which
 * fields are set, so the log shows what changed without holding the data.
 */
function auditFacts(row: TenantModel) {
  const fields: (keyof TenantFields)[] = [
    'email',
    'idNumber',
    'idIssuedAt',
    'birthDate',
    'gender',
    'hometown',
    'permanentAddress',
    'occupation',
    'note',
  ];

  return {
    ...selectFields(row, ['id', 'buildingId', 'version']),
    archivedAt: row.archivedAt?.toISOString() ?? null,
    filledFields: fields.filter((field) => row[field] !== null),
  };
}

function changedFields(before: TenantModel['dataValues'], after: TenantFields) {
  return (Object.keys(after) as (keyof TenantFields)[]).filter(
    (field) => before[field] !== after[field],
  );
}

function tenantDto(row: TenantModel, occupancy: TenantOccupancy | undefined): StayTenant {
  return {
    ...selectFields(row, ['id', 'buildingId', 'fullName', 'phone', 'version']),
    idNumberMasked: row.idNumber ? maskIdNumber(row.idNumber) : null,
    status: (occupancy ?? NO_OCCUPANCY).status,
    currentRoom: (occupancy ?? NO_OCCUPANCY).currentRoom,
    residenceDeclared: null,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function vehicleDto(row: VehicleModel): TenantVehicle {
  return {
    ...selectFields(row, ['id', 'tenantId', 'plate', 'type', 'note']),
    createdAt: row.createdAt.toISOString(),
  };
}

function documentDto(row: TenantDocumentModel, file: FileModel | undefined): TenantDocument {
  const signed = file ? signedFileUrl(file) : null;

  return {
    ...selectFields(row, ['id', 'kind', 'fileId']),
    url: signed?.url ?? null,
    urlExpiresAt: signed?.expiresAt ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

async function detailDto(row: TenantModel): Promise<StayTenantDetail> {
  const [occupancy, vehicles, documents, contracts] = await Promise.all([
    tenantOccupancy([row.id]),
    VehicleModel.findAll({ where: { tenantId: row.id }, order: [['createdAt', 'ASC']] }),
    TenantDocumentModel.findAll({ where: { tenantId: row.id }, order: [['createdAt', 'ASC']] }),
    tenantContracts(row.id),
  ]);
  const files = await FileModel.findAll({
    where: { id: { [Op.in]: documents.map((document) => document.fileId) } },
  });

  return {
    ...tenantDto(row, occupancy.get(row.id)),
    ...selectFields(row, [
      'email',
      'idIssuedAt',
      'birthDate',
      'gender',
      'hometown',
      'permanentAddress',
      'occupation',
      'note',
    ]),
    vehicles: vehicles.map(vehicleDto),
    documents: documents.map((document) =>
      documentDto(
        document,
        files.find((file) => file.id === document.fileId),
      ),
    ),
    contracts,
    portalLastOpenedAt: null,
  };
}

/** Buildings whose tenants `user` may `action`: `'all'` for owners, else assigned ones. */
export function tenantBuildingScope(user: StayUser, action: StayAction): 'all' | string[] {
  if (hasAccess(user, action, 'Tenant')) return 'all';

  return user.buildingIds.filter((buildingId) =>
    canAccessRecord(user, action, 'Tenant', { buildingId }),
  );
}

/** Name or phone contains `q`; 4 digits also match the last 4 of the CCCD. */
function searchWhere(q: string | undefined): WhereOptions<TenantAttributes> {
  const text = q?.trim();

  if (!text) return {};

  const pattern = `%${text.replace(/[\\%_]/g, (match) => `\\${match}`)}%`;
  const digits = text.replace(/[\s.-]/g, '');
  const conditions: WhereOptions<TenantAttributes>[] = [
    where(cast(col('TenantModel.full_name'), 'text'), { [Op.iLike]: pattern }),
  ];

  if (/^\+?\d{3,}$/.test(digits))
    conditions.push({ phone: { [Op.like]: `%${digits.replace(/^\+?84/, '0')}%` } });
  if (/^\d{4}$/.test(digits)) conditions.push({ idNumber: { [Op.like]: `%${digits}` } });
  return { [Op.or]: conditions };
}

/** `GET /api/tenants`: tenants of the buildings `user` may read. */
export async function listTenants(
  user: StayUser,
  query: TenantListQuery,
): Promise<{ data: StayTenant[]; meta: PaginationMeta }> {
  const scope = tenantBuildingScope(user, 'read');
  const conditions: WhereOptions<TenantAttributes>[] = [
    accessibleWhere(user, 'read', 'Tenant'),
    searchWhere(query.q),
  ];

  if (scope !== 'all') conditions.push({ buildingId: { [Op.in]: scope } });
  if (query.buildingId) conditions.push({ buildingId: query.buildingId });
  if (query.status === 'archived') conditions.push({ archivedAt: { [Op.not]: null } });
  else conditions.push({ archivedAt: { [Op.is]: null } });
  if (query.status !== 'all' && query.status !== 'archived')
    conditions.push(tenantStatusWhere(query.status));

  const order: ModelOrder<TenantAttributes> = [
    [query.sortBy ?? 'fullName', query.sortOrder === 'desc' ? 'DESC' : 'ASC'],
    ['id', 'ASC'],
  ];
  const { rows, count } = await TenantModel.findAndCountAll({
    where: { [Op.and]: conditions },
    order,
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
  });
  const occupancy = await tenantOccupancy(rows.map((row) => row.id));

  return {
    data: rows.map((row) => tenantDto(row, occupancy.get(row.id))),
    meta: buildPaginationMeta(query.page, query.pageSize, count),
  };
}

/** A tenant `user` may `action`; others answer 404 like missing ones (no disclosure). */
export async function findAccessibleTenant(
  user: StayUser,
  id: string,
  action: StayAction,
  transaction?: Transaction,
): Promise<TenantModel> {
  const row = await TenantModel.findOne({
    where: { [Op.and]: [{ id }, accessibleWhere(user, action, 'Tenant')] },
    transaction,
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });

  if (!row || !canAccessRecord(user, action, 'Tenant', { buildingId: row.buildingId }))
    throw new NotFound('tenant_not_found');
  return row;
}

function assertActive(row: TenantModel) {
  if (row.archivedAt) throw new BaseError('tenant_archived', 409, 'tenant_archived');
}

/** The building a new tenant goes to: `user` may create tenants there and it is not archived. */
export async function tenantTargetBuilding(user: StayUser, body: FormBody, action: StayAction) {
  const buildingId = body.text('buildingId', 36);
  const valid =
    !body.errors.buildingId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(buildingId) &&
    canAccessRecord(user, action, 'Tenant', { buildingId });
  const building = valid ? await BuildingModel.findByPk(buildingId) : null;

  if (!body.errors.buildingId)
    body.check('buildingId', Boolean(building && !building.archivedAt), 'building_not_found');
  return buildingId;
}

export async function getTenant(user: StayUser, id: string): Promise<StayTenantDetail> {
  return detailDto(await findAccessibleTenant(user, id, 'read'));
}

export async function createTenant(
  buildingId: string,
  input: TenantFields,
): Promise<StayTenantDetail> {
  return auditedTransaction(async (transaction) => {
    const row = await TenantModel.create({ ...input, buildingId }, { transaction });

    setAuditChanges({ after: auditFacts(row) });
    return detailDto(row);
  });
}

export async function updateTenant(
  user: StayUser,
  id: string,
  input: TenantFields,
  expectedVersion: number,
): Promise<StayTenantDetail> {
  return auditedTransaction(async (transaction) => {
    const row = await findAccessibleTenant(user, id, 'update', transaction);

    assertActive(row);
    assertVersion(row.version, expectedVersion);

    const changed = changedFields(row.dataValues, input);
    const before = auditFacts(row);

    await row.update({ ...input }, { transaction });
    setAuditChanges({ changedFields: changed, before, after: auditFacts(row) });
    return detailDto(row);
  });
}

/** Archive a profile; refused (409) while the tenant lives in a room under an active contract. */
export async function archiveTenant(user: StayUser, id: string): Promise<StayTenantDetail> {
  return auditedTransaction(async (transaction) => {
    const row = await findAccessibleTenant(user, id, 'delete', transaction);

    assertActive(row);
    if (await tenantHasActiveContract(row.id, transaction))
      throw new BaseError('tenant_has_active_contract', 409, 'tenant_has_active_contract');

    await row.update({ archivedAt: new Date() }, { transaction });
    setAuditChanges({ after: auditFacts(row) });
    return detailDto(row);
  });
}

/** The full CCCD; every reveal is audited (without the number). */
export async function revealIdNumber(user: StayUser, id: string): Promise<TenantIdReveal> {
  return auditedTransaction(async (transaction) => {
    const row = await findAccessibleTenant(user, id, 'read');

    await recordAudit(
      {
        action: 'tenant.reveal_id_number',
        resourceType: 'tenant',
        resourceId: row.id,
        changes: { buildingId: row.buildingId, hasIdNumber: row.idNumber !== null },
      },
      transaction,
    );
    return { idNumber: row.idNumber };
  });
}

/** Attach an uploaded CCCD image; a new front/back replaces the previous one. */
export async function attachDocument(
  user: StayUser,
  id: string,
  input: { kind: TenantDocumentKind; fileId: string },
  body: FormBody,
): Promise<TenantDocument> {
  return auditedTransaction(async (transaction) => {
    const tenant = await findAccessibleTenant(user, id, 'update', transaction);

    assertActive(tenant);

    const file = await attachableFile(
      user,
      input.fileId,
      'tenant_document',
      tenant.buildingId,
      transaction,
    );
    const taken = file
      ? await TenantDocumentModel.findOne({ where: { fileId: file.id }, transaction })
      : null;

    body.check(
      'fileId',
      Boolean(file) && (!taken || taken.tenantId === tenant.id),
      'upload_not_attachable',
    );
    body.assertValid();
    if (!file) throw new NotFound();
    if (taken) return documentDto(taken, file);

    // Replaced images stay in storage as unreferenced files (cleanup job: later task).
    const replaced =
      input.kind === 'other'
        ? 0
        : await TenantDocumentModel.destroy({
            where: { tenantId: tenant.id, kind: input.kind },
            transaction,
          });
    const row = await TenantDocumentModel.create(
      { tenantId: tenant.id, fileId: file.id, kind: input.kind },
      { transaction },
    );

    setAuditChanges({ tenantId: tenant.id, kind: input.kind, fileId: file.id, replaced });
    return documentDto(row, file);
  });
}

async function assertPlateFree(
  body: FormBody,
  tenantId: string,
  input: VehicleInput,
  transaction: Transaction,
  excludeId?: string,
) {
  const taken = await VehicleModel.count({
    where: {
      tenantId,
      plateKey: plateKey(input.plate),
      ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
    },
    transaction,
  });

  body.check('plate', taken === 0, 'vehicle_plate_taken');
  body.assertValid();
}

export async function addVehicle(
  user: StayUser,
  tenantId: string,
  input: VehicleInput,
  body: FormBody,
): Promise<TenantVehicle> {
  return auditedTransaction(async (transaction) => {
    const tenant = await findAccessibleTenant(user, tenantId, 'update', transaction);

    assertActive(tenant);
    await assertPlateFree(body, tenant.id, input, transaction);

    const row = await VehicleModel.create(
      { ...input, tenantId: tenant.id, plateKey: plateKey(input.plate) },
      { transaction },
    );

    setAuditChanges({ after: selectFields(row, ['id', 'tenantId', 'plate', 'type']) });
    return vehicleDto(row);
  });
}

async function findVehicle(tenant: TenantModel, vehicleId: string, transaction: Transaction) {
  const row = await VehicleModel.findOne({
    where: { id: vehicleId, tenantId: tenant.id },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!row) throw new NotFound('vehicle_not_found');
  return row;
}

export async function updateVehicle(
  user: StayUser,
  tenantId: string,
  vehicleId: string,
  input: VehicleInput,
  body: FormBody,
): Promise<TenantVehicle> {
  return auditedTransaction(async (transaction) => {
    const tenant = await findAccessibleTenant(user, tenantId, 'update', transaction);

    assertActive(tenant);

    const row = await findVehicle(tenant, vehicleId, transaction);

    await assertPlateFree(body, tenant.id, input, transaction, row.id);

    const before = selectFields(row, ['id', 'tenantId', 'plate', 'type']);

    await row.update({ ...input, plateKey: plateKey(input.plate) }, { transaction });
    setAuditChanges({ before, after: selectFields(row, ['id', 'tenantId', 'plate', 'type']) });
    return vehicleDto(row);
  });
}

export async function removeVehicle(
  user: StayUser,
  tenantId: string,
  vehicleId: string,
): Promise<{ id: string }> {
  return auditedTransaction(async (transaction) => {
    const tenant = await findAccessibleTenant(user, tenantId, 'update', transaction);

    assertActive(tenant);

    const row = await findVehicle(tenant, vehicleId, transaction);

    setAuditChanges({ before: selectFields(row, ['id', 'tenantId', 'plate', 'type']) });
    await row.destroy({ transaction });
    return { id: row.id };
  });
}
