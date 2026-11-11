/**
 * ST-25 part B, staff side: the "Yêu cầu từ người thuê" inbox (O-26). Maintenance reports and
 * tenant requests need `Maintenance` rights, payment claims `Payment` rights (CASL kit; managers
 * in assigned buildings). Inaccessible items and filters are 404.
 */
import { BaseError, buildPaginationMeta, NotFound, searchPattern } from '@p4/server-core';
import type { ListQuery, PaginationMeta } from '@p4/shared';
import {
  INBOX_STATUSES,
  type InboxAcceptInput,
  type InboxItem,
  type InboxKind,
  type InboxRejectInput,
  type InboxReplyInput,
  type InboxStatus,
  type InboxStatusCount,
  type PaymentClaimConfirmInput,
  plateKey,
  type StayAction,
  type StaySubject,
  type StayUser,
} from '@stay/shared';
import { Op, QueryTypes, type Transaction } from 'sequelize';
import { canAccessRecord, hasAccess } from '@/middlewares/ability.middleware.js';
import {
  ContractModel,
  ContractOccupantModel,
  InvoiceModel,
  MaintenanceRequestModel,
  PaymentClaimModel,
  RoomModel,
  sequelize,
  TenantModel,
  TenantRequestModel,
  UserModel,
  VehicleModel,
} from '@/sequelize/models/index.js';
import { auditedTransaction, recordAudit } from '@/shared/audit.js';
import { changeContract } from '../contracts/contracts.changes.js';
import { contractVehiclesAt } from '../contracts/contracts.resolvers.js';
import { giveNotice } from '../contracts/contracts.settlement.js';
import { insertPayment } from '../payments/payments.service.js';
import {
  claimInboxStatus,
  conflict,
  invalid,
  maintenanceInboxStatus,
  OPEN_MAINTENANCE_STATUSES,
  photoMap,
  photosOf,
  requestInboxStatus,
} from './requests.shared.js';

export type InboxSortField = 'createdAt';

export interface InboxListQuery extends ListQuery<InboxSortField> {
  kind?: InboxKind;
  status?: InboxStatus;
  buildingId?: string;
  contractId?: string;
}

/* -------------------------------------------------------------------------- */
/* DTOs                                                                        */
/* -------------------------------------------------------------------------- */

type ItemRef = { kind: InboxKind; id: string };

/** Full inbox items for `refs` (in that order), loading each table and lookup once. */
async function inboxItems(refs: readonly ItemRef[], transaction?: Transaction) {
  const ids = (kind: InboxKind) => refs.filter((ref) => ref.kind === kind).map((ref) => ref.id);
  const [maintenance, requests, claims] = await Promise.all([
    ids('maintenance').length
      ? MaintenanceRequestModel.findAll({
          where: { id: { [Op.in]: ids('maintenance') } },
          transaction,
        })
      : [],
    ids('tenant_request').length
      ? TenantRequestModel.findAll({
          where: { id: { [Op.in]: ids('tenant_request') } },
          transaction,
        })
      : [],
    ids('payment_claim').length
      ? PaymentClaimModel.findAll({ where: { id: { [Op.in]: ids('payment_claim') } }, transaction })
      : [],
  ]);
  const invoices = claims.length
    ? await InvoiceModel.findAll({
        where: { id: { [Op.in]: claims.map((row) => row.invoiceId) } },
        transaction,
      })
    : [];
  const rows = [...maintenance, ...requests, ...claims];
  const roomIds = [
    ...maintenance.map((row) => row.roomId),
    ...requests.map((row) => row.roomId),
    ...invoices.map((row) => row.roomId),
  ].filter((id): id is string => Boolean(id));
  const contractIds = rows.map((row) => row.contractId).filter((id): id is string => Boolean(id));
  const tenantIds = rows.map((row) => row.tenantId).filter((id): id is string => Boolean(id));
  const userIds = rows.map((row) => row.handledBy).filter((id): id is string => Boolean(id));
  const [rooms, contracts, tenants, users, photos] = await Promise.all([
    RoomModel.findAll({
      where: { id: { [Op.in]: [...new Set(roomIds)] } },
      attributes: ['id', 'code'],
      transaction,
    }),
    ContractModel.findAll({
      where: { id: { [Op.in]: [...new Set(contractIds)] } },
      attributes: ['id', 'code'],
      transaction,
    }),
    TenantModel.findAll({
      where: { id: { [Op.in]: [...new Set(tenantIds)] } },
      attributes: ['id', 'fullName'],
      transaction,
    }),
    UserModel.findAll({
      where: { id: { [Op.in]: [...new Set(userIds)] } },
      attributes: ['id', 'displayName'],
      transaction,
    }),
    photoMap(
      [
        ...maintenance.flatMap((row) => row.photos),
        ...claims.flatMap((row) => (row.receiptFileId ? [row.receiptFileId] : [])),
      ],
      transaction,
    ),
  ]);
  const roomCode = new Map(rooms.map((row) => [row.id, row.code]));
  const contractCode = new Map(contracts.map((row) => [row.id, row.code]));
  const tenantName = new Map(tenants.map((row) => [row.id, row.fullName]));
  const userName = new Map(users.map((row) => [row.id, row.displayName]));
  const invoiceOf = new Map(invoices.map((row) => [row.id, row]));
  const base = (
    row: (typeof rows)[number],
    roomId: string | null,
  ): Omit<InboxItem, 'kind' | 'status' | 'reply' | 'maintenance' | 'request' | 'claim'> => ({
    id: row.id,
    buildingId: row.buildingId,
    contractId: row.contractId,
    contractCode: row.contractId ? (contractCode.get(row.contractId) ?? null) : null,
    roomId,
    roomCode: roomId ? (roomCode.get(roomId) ?? null) : null,
    tenantId: row.tenantId,
    tenantName: row.tenantId ? (tenantName.get(row.tenantId) ?? null) : null,
    handledByName: row.handledBy ? (userName.get(row.handledBy) ?? null) : null,
    handledAt: row.handledAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  });
  const items = new Map<string, InboxItem>();

  for (const row of maintenance)
    items.set(`maintenance:${row.id}`, {
      ...base(row, row.roomId),
      kind: 'maintenance',
      status: maintenanceInboxStatus(row.status),
      reply: row.reply,
      maintenance: {
        title: row.title,
        description: row.description,
        category: row.category,
        severity: row.severity,
        status: row.status,
        source: row.source,
        photos: photosOf(row.photos, photos),
      },
      request: null,
      claim: null,
    });
  for (const row of requests)
    items.set(`tenant_request:${row.id}`, {
      ...base(row, row.roomId),
      kind: 'tenant_request',
      status: requestInboxStatus(row.status),
      reply: row.reply,
      maintenance: null,
      request: { type: row.type, payload: row.payload, status: row.status, result: row.result },
      claim: null,
    });
  for (const row of claims) {
    const invoice = invoiceOf.get(row.invoiceId);

    items.set(`payment_claim:${row.id}`, {
      ...base(row, invoice?.roomId ?? null),
      kind: 'payment_claim',
      status: claimInboxStatus(row.status),
      reply: row.rejectReason,
      maintenance: null,
      request: null,
      claim: {
        invoiceId: row.invoiceId,
        invoiceCode: invoice?.code ?? null,
        invoicePeriod: invoice?.period ?? '',
        invoiceRemaining: invoice ? invoice.total - invoice.paidTotal : 0,
        amount: row.amount,
        paidOn: row.paidOn,
        reference: row.reference,
        note: row.note,
        status: row.status,
        receipt: row.receiptFileId ? (photos.get(row.receiptFileId) ?? null) : null,
        paymentId: row.paymentId,
      },
    });
  }

  return refs.flatMap((ref) => {
    const item = items.get(`${ref.kind}:${ref.id}`);

    return item ? [item] : [];
  });
}

async function inboxItem(ref: ItemRef, transaction?: Transaction): Promise<InboxItem> {
  const [item] = await inboxItems([ref], transaction);

  if (!item) throw new NotFound();
  return item;
}

/* -------------------------------------------------------------------------- */
/* List                                                                        */
/* -------------------------------------------------------------------------- */

/** Buildings where `user` may `action` `subject`: `'all'` for an unconditional rule. */
function scopedBuildings(user: StayUser, action: StayAction, subject: StaySubject) {
  if (hasAccess(user, action, subject)) return 'all' as const;
  return user.buildingIds.filter((buildingId) =>
    canAccessRecord(user, action, subject, { buildingId }),
  );
}

/** SQL condition on `items.building_id` for a building scope (bound as `:<name>`). */
function scopeSql(scope: 'all' | string[], name: string, replacements: Record<string, unknown>) {
  if (scope === 'all') return 'TRUE';
  if (!scope.length) return 'FALSE';
  replacements[name] = scope;
  return `items.building_id IN (:${name})`;
}

const ITEMS_SQL = `
  SELECT m.id, 'maintenance' AS kind, m.building_id, m.contract_id, m.room_id, m.tenant_id,
    CASE m.status WHEN 'new' THEN 'pending' WHEN 'open' THEN 'in_progress' ELSE m.status END AS status,
    m.created_at, m.title AS search_text
  FROM maintenance_requests m WHERE m.source = 'tenant'
  UNION ALL
  SELECT r.id, 'tenant_request', r.building_id, r.contract_id, r.room_id, r.tenant_id,
    CASE r.status WHEN 'new' THEN 'pending' WHEN 'accepted' THEN 'done' ELSE r.status END,
    r.created_at, r.type
  FROM tenant_requests r
  UNION ALL
  SELECT c.id, 'payment_claim', c.building_id, c.contract_id, i.room_id, c.tenant_id,
    CASE c.status WHEN 'confirmed' THEN 'done' ELSE c.status END,
    c.created_at, COALESCE(i.code, '')
  FROM payment_claims c JOIN invoices i ON i.id = c.invoice_id`;

/**
 * `GET /api/requests`: maintenance reports, tenant requests and payment claims in one list
 * (newest first). `meta.counts` has every status for the filter without `status` (chips).
 */
export async function listInbox(
  user: StayUser,
  query: InboxListQuery,
): Promise<{ data: InboxItem[]; meta: PaginationMeta & { counts: InboxStatusCount[] } }> {
  if (
    query.buildingId &&
    !canAccessRecord(user, 'read', 'Maintenance', { buildingId: query.buildingId })
  )
    throw new NotFound();
  if (query.contractId) {
    const contract = await ContractModel.findByPk(query.contractId, {
      attributes: ['id', 'buildingId'],
    });

    if (
      !contract ||
      !canAccessRecord(user, 'read', 'Contract', {
        buildingId: contract.buildingId,
        contractId: contract.id,
      })
    )
      throw new NotFound();
  }
  const replacements: Record<string, unknown> = {};
  const scope = `((items.kind <> 'payment_claim' AND ${scopeSql(
    scopedBuildings(user, 'read', 'Maintenance'),
    'maintenanceBuildings',
    replacements,
  )}) OR (items.kind = 'payment_claim' AND ${scopeSql(
    scopedBuildings(user, 'read', 'Payment'),
    'paymentBuildings',
    replacements,
  )}))`;
  const conditions = [scope];

  if (query.buildingId) {
    conditions.push('items.building_id = :buildingId');
    replacements.buildingId = query.buildingId;
  }
  if (query.contractId) {
    conditions.push('items.contract_id = :contractId');
    replacements.contractId = query.contractId;
  }
  if (query.kind) {
    conditions.push('items.kind = :kind');
    replacements.kind = query.kind;
  }
  if (query.q) {
    conditions.push(
      '(ro.code ILIKE :q OR t.full_name ILIKE :q OR co.code ILIKE :q OR items.search_text ILIKE :q)',
    );
    replacements.q = searchPattern(query.q);
  }
  const from = `FROM (${ITEMS_SQL}) items
    LEFT JOIN rooms ro ON ro.id = items.room_id
    LEFT JOIN tenants t ON t.id = items.tenant_id
    LEFT JOIN contracts co ON co.id = items.contract_id`;
  const withoutStatus = conditions.join(' AND ');
  const withStatus = query.status ? `${withoutStatus} AND items.status = :status` : withoutStatus;

  if (query.status) replacements.status = query.status;
  const direction = query.sortOrder === 'asc' ? 'ASC' : 'DESC';
  const [statusRows, pageRows] = await Promise.all([
    sequelize.query<{ status: InboxStatus; count: string }>(
      `SELECT items.status, count(*) AS count ${from} WHERE ${withoutStatus} GROUP BY items.status`,
      { replacements, type: QueryTypes.SELECT },
    ),
    sequelize.query<{ id: string; kind: InboxKind; total: string }>(
      `SELECT items.id, items.kind, count(*) OVER () AS total ${from} WHERE ${withStatus}
       ORDER BY items.created_at ${direction}, items.id ASC
       LIMIT :limit OFFSET :offset`,
      {
        replacements: {
          ...replacements,
          limit: query.pageSize,
          offset: (query.page - 1) * query.pageSize,
        },
        type: QueryTypes.SELECT,
      },
    ),
  ]);
  const counted = new Map(statusRows.map((row) => [row.status, Number(row.count)]));
  const total = pageRows[0]
    ? Number(pageRows[0].total)
    : query.status
      ? (counted.get(query.status) ?? 0)
      : [...counted.values()].reduce((sum, count) => sum + count, 0);

  return {
    data: await inboxItems(pageRows.map((row) => ({ kind: row.kind, id: row.id }))),
    meta: {
      ...buildPaginationMeta(query.page, query.pageSize, total),
      counts: INBOX_STATUSES.map((status) => ({ status, count: counted.get(status) ?? 0 })),
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Maintenance and tenant requests                                             */
/* -------------------------------------------------------------------------- */

type Handled =
  | { kind: 'maintenance'; row: MaintenanceRequestModel }
  | { kind: 'tenant_request'; row: TenantRequestModel };

/** A maintenance report or tenant request by id, locked; out of scope → 404. */
async function findHandled(user: StayUser, id: string, transaction: Transaction): Promise<Handled> {
  const lock = transaction.LOCK.UPDATE;
  const maintenance = await MaintenanceRequestModel.findByPk(id, { transaction, lock });
  const found: Handled | null = maintenance
    ? { kind: 'maintenance', row: maintenance }
    : await TenantRequestModel.findByPk(id, { transaction, lock }).then((row) =>
        row ? { kind: 'tenant_request' as const, row } : null,
      );

  if (
    !found ||
    !canAccessRecord(user, 'update', 'Maintenance', {
      buildingId: found.row.buildingId,
      contractId: found.row.contractId ?? undefined,
    })
  )
    throw new NotFound();
  return found;
}

/** Audit facts: ids, type and statuses only (never the reply, reason, names or phones). */
async function auditHandled(
  action: string,
  handled: Handled,
  statusBefore: string,
  facts: Record<string, string | number | boolean | null>,
  transaction: Transaction,
) {
  // One resource type for the inbox routes (`request`); the action names the table.
  await recordAudit(
    {
      action: `${handled.kind === 'maintenance' ? 'maintenance_request' : 'tenant_request'}.${action}`,
      resourceType: 'request',
      resourceId: handled.row.id,
      changes: {
        kind: handled.kind,
        buildingId: handled.row.buildingId,
        contractId: handled.row.contractId,
        statusBefore,
        statusAfter: handled.row.status,
        ...(handled.kind === 'tenant_request' ? { type: handled.row.type } : {}),
        ...facts,
      },
    },
    transaction,
  );
}

/** Current `version` of a contract (the change services check it). */
async function contractVersion(id: string, transaction: Transaction) {
  const contract = await ContractModel.findByPk(id, { transaction, rejectOnEmpty: true });

  return contract.version;
}

/**
 * Runs the contract change of an accepted request with the ST-12/ST-17 services (same checks,
 * events and audit), inside the caller's transaction. Returns the ids it created/used.
 */
async function applyRequest(
  user: StayUser,
  row: TenantRequestModel,
  input: InboxAcceptInput,
  transaction: Transaction,
): Promise<Record<string, string | number | boolean | null>> {
  const contractId = row.contractId;
  const { payload } = row;

  switch (row.type) {
    case 'move_out': {
      if (!('expectedMoveOutDate' in payload)) break;
      const date = input.effectiveDate ?? payload.expectedMoveOutDate;
      const contract = await giveNotice(user, contractId, {
        version: await contractVersion(contractId, transaction),
        expectedMoveOutDate: date,
        note: payload.reason ?? null,
      });

      return { expectedMoveOutDate: date, contractStatus: contract.status };
    }
    case 'add_occupant': {
      if (!('phone' in payload)) break;
      const date = input.effectiveDate ?? payload.fromDate;

      await changeContract(user, contractId, 'occupants', {
        version: await contractVersion(contractId, transaction),
        effectiveDate: date,
        fullName: payload.fullName,
        phone: payload.phone,
      });
      const added = await ContractOccupantModel.findOne({
        where: { contractId, fromDate: date },
        order: [['createdAt', 'DESC']],
        transaction,
      });

      return { effectiveDate: date, tenantId: added?.tenantId ?? null };
    }
    case 'remove_occupant': {
      if (!('toDate' in payload) || !('fullName' in payload)) break;
      const date = input.effectiveDate ?? payload.toDate;
      let tenantId = input.tenantId ?? null;

      if (!tenantId) {
        // The occupant named in the request, when the name matches exactly one occupant.
        const occupants = await ContractOccupantModel.findAll({
          where: { contractId },
          transaction,
        });
        const tenants = await TenantModel.findAll({
          where: { id: { [Op.in]: occupants.map((o) => o.tenantId) } },
          attributes: ['id', 'fullName'],
          transaction,
        });
        const wanted = payload.fullName.trim().toLocaleLowerCase('vi');
        const matches = tenants.filter((t) => t.fullName.trim().toLocaleLowerCase('vi') === wanted);

        if (matches.length !== 1) invalid('tenantId', 'Chọn người ở rời đi.');
        tenantId = matches[0]?.id ?? null;
      }
      if (!tenantId) invalid('tenantId', 'Chọn người ở rời đi.');
      await changeContract(
        user,
        contractId,
        'leave',
        {
          version: await contractVersion(contractId, transaction),
          effectiveDate: date,
          ...(input.newPrimaryTenantId ? { newPrimaryTenantId: input.newPrimaryTenantId } : {}),
        },
        undefined,
        tenantId,
      );
      return { effectiveDate: date, tenantId };
    }
    case 'add_vehicle': {
      if (!('vehicleType' in payload)) break;
      const date = input.effectiveDate ?? payload.fromDate;
      const key = plateKey(payload.plate);
      const existing = await VehicleModel.findOne({
        where: { tenantId: row.tenantId, plateKey: key },
        transaction,
      });
      // The vehicle belongs to the requesting occupant (tenant vehicle list, ST-09).
      const vehicle =
        existing ??
        (await VehicleModel.create(
          {
            tenantId: row.tenantId,
            plate: payload.plate,
            plateKey: key,
            type: payload.vehicleType,
          },
          { transaction },
        ));

      await changeContract(user, contractId, 'vehicles', {
        version: await contractVersion(contractId, transaction),
        effectiveDate: date,
        vehicleId: vehicle.id,
        enabled: true,
      });
      return { effectiveDate: date, vehicleId: vehicle.id, vehicleCreated: !existing };
    }
    case 'remove_vehicle': {
      if (!('toDate' in payload) || !('plate' in payload)) break;
      const date = input.effectiveDate ?? payload.toDate;
      let vehicleId = input.vehicleId ?? null;

      if (!vehicleId) {
        const links = await contractVehiclesAt(contractId, date, transaction);
        const vehicles = await VehicleModel.findAll({
          where: {
            id: { [Op.in]: links.map((link) => link.vehicleId) },
            plateKey: plateKey(payload.plate),
          },
          transaction,
        });

        if (vehicles.length !== 1) invalid('vehicleId', 'Chọn xe cần bớt.');
        vehicleId = vehicles[0]?.id ?? null;
      }
      if (!vehicleId) invalid('vehicleId', 'Chọn xe cần bớt.');
      await changeContract(user, contractId, 'vehicles', {
        version: await contractVersion(contractId, transaction),
        effectiveDate: date,
        vehicleId,
        enabled: false,
      });
      return { effectiveDate: date, vehicleId };
    }
    case 'other':
      return {};
  }
  throw new BaseError('invalid_request_payload', 422, 'invalid_request_payload');
}

/**
 * `POST /api/requests/:id/accept`. Maintenance: `in_progress` (or `done` with `done: true`).
 * Tenant request (`new` only): runs the contract change in this transaction; any validation
 * error of ST-12/ST-17 rolls everything back and the request stays `new`.
 */
export async function acceptRequest(
  user: StayUser,
  id: string,
  input: InboxAcceptInput,
): Promise<InboxItem> {
  return auditedTransaction(async (transaction) => {
    const handled = await findHandled(user, id, transaction);
    const now = new Date();
    const before = handled.row.status;
    const reply = input.reply
      ? {
          reply: input.reply,
          ...(handled.kind === 'maintenance' ? { repliedAt: now, repliedBy: user.id } : {}),
        }
      : {};

    if (handled.kind === 'maintenance') {
      if (!OPEN_MAINTENANCE_STATUSES.includes(handled.row.status)) conflict('request_not_pending');
      await handled.row.update(
        {
          status: input.done ? 'done' : 'in_progress',
          handledBy: user.id,
          handledAt: now,
          ...reply,
        },
        { transaction },
      );
      await auditHandled(
        'accepted',
        handled,
        before,
        { replied: Boolean(input.reply) },
        transaction,
      );
    } else {
      if (handled.row.status !== 'new') conflict('request_not_pending');
      const result = await applyRequest(user, handled.row, input, transaction);

      await handled.row.update(
        { status: 'accepted', handledBy: user.id, handledAt: now, result, ...reply },
        { transaction },
      );
      await auditHandled('accepted', handled, before, result, transaction);
    }
    return inboxItem({ kind: handled.kind, id: handled.row.id }, transaction);
  });
}

/** `POST /api/requests/:id/reject`: reason required; the tenant sees it as the reply. */
export async function rejectRequest(
  user: StayUser,
  id: string,
  input: InboxRejectInput,
): Promise<InboxItem> {
  return auditedTransaction(async (transaction) => {
    const handled = await findHandled(user, id, transaction);
    const now = new Date();
    const before = handled.row.status;

    if (handled.kind === 'maintenance') {
      if (!OPEN_MAINTENANCE_STATUSES.includes(handled.row.status)) conflict('request_not_pending');
      await handled.row.update(
        {
          status: 'rejected',
          reply: input.reason,
          repliedAt: now,
          repliedBy: user.id,
          handledBy: user.id,
          handledAt: now,
        },
        { transaction },
      );
    } else {
      if (handled.row.status !== 'new') conflict('request_not_pending');
      await handled.row.update(
        { status: 'rejected', reply: input.reason, handledBy: user.id, handledAt: now },
        { transaction },
      );
    }
    await auditHandled('rejected', handled, before, {}, transaction);
    return inboxItem({ kind: handled.kind, id: handled.row.id }, transaction);
  });
}

/** `POST /api/requests/:id/reply`: the latest reply replaces the previous one. */
export async function replyRequest(
  user: StayUser,
  id: string,
  input: InboxReplyInput,
): Promise<InboxItem> {
  return auditedTransaction(async (transaction) => {
    const handled = await findHandled(user, id, transaction);

    if (handled.row.status === 'cancelled') conflict('request_not_pending');
    if (handled.kind === 'maintenance')
      await handled.row.update(
        { reply: input.message, repliedAt: new Date(), repliedBy: user.id },
        { transaction },
      );
    else await handled.row.update({ reply: input.message }, { transaction });
    await auditHandled('replied', handled, handled.row.status, {}, transaction);
    return inboxItem({ kind: handled.kind, id: handled.row.id }, transaction);
  });
}

/* -------------------------------------------------------------------------- */
/* Payment claims                                                              */
/* -------------------------------------------------------------------------- */

async function findClaim(user: StayUser, id: string, transaction: Transaction) {
  const row = await PaymentClaimModel.findByPk(id, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (
    !row ||
    !canAccessRecord(user, 'create', 'Payment', {
      buildingId: row.buildingId,
      contractId: row.contractId,
    })
  )
    throw new NotFound();
  return row;
}

async function auditClaim(
  action: 'confirmed' | 'rejected',
  row: PaymentClaimModel,
  facts: Record<string, string | number | null>,
  transaction: Transaction,
) {
  await recordAudit(
    {
      action: `payment_claim.${action}`,
      resourceType: 'payment_claim',
      resourceId: row.id,
      changes: {
        buildingId: row.buildingId,
        contractId: row.contractId,
        invoiceId: row.invoiceId,
        claimId: row.id,
        status: row.status,
        ...facts,
      },
    },
    transaction,
  );
}

/**
 * `POST /api/payment-claims/:id/confirm`: records the payment (ST-15 `insertPayment`, method
 * `bank_transfer`, reference from the claim) and marks the claim confirmed in one transaction.
 * The claim row is locked first, so a retry or a concurrent confirm returns the same payment.
 */
export async function confirmClaim(
  user: StayUser,
  id: string,
  input: PaymentClaimConfirmInput,
): Promise<InboxItem> {
  return auditedTransaction(async (transaction) => {
    const row = await findClaim(user, id, transaction);

    if (row.status === 'confirmed') return inboxItem({ kind: 'payment_claim', id }, transaction);
    if (row.status !== 'pending') conflict('request_not_pending');
    const payment = await insertPayment(
      user,
      row.invoiceId,
      {
        amount: input.amount ?? row.amount,
        method: 'bank_transfer',
        paidOn: input.paidOn ?? row.paidOn,
        reference: input.reference ?? row.reference ?? null,
        note: null,
      },
      transaction,
    );

    await row.update(
      { status: 'confirmed', paymentId: payment.id, handledBy: user.id, handledAt: new Date() },
      { transaction },
    );
    await auditClaim(
      'confirmed',
      row,
      { paymentId: payment.id, claimedAmount: row.amount, amount: payment.amount },
      transaction,
    );
    return inboxItem({ kind: 'payment_claim', id }, transaction);
  });
}

/** `POST /api/payment-claims/:id/reject`: pending only; the invoice is not touched. */
export async function rejectClaim(
  user: StayUser,
  id: string,
  input: InboxRejectInput,
): Promise<InboxItem> {
  return auditedTransaction(async (transaction) => {
    const row = await findClaim(user, id, transaction);

    if (row.status !== 'pending') conflict('request_not_pending');
    await row.update(
      {
        status: 'rejected',
        rejectReason: input.reason,
        handledBy: user.id,
        handledAt: new Date(),
      },
      { transaction },
    );
    await auditClaim('rejected', row, {}, transaction);
    return inboxItem({ kind: 'payment_claim', id }, transaction);
  });
}
