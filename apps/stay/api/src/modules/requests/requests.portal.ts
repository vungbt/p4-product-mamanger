/**
 * ST-25 part B, tenant side (`/api/portal/*`): "Tôi đã chuyển khoản", báo hỏng and requests.
 * Everything starts from the portal session's contract (CASL `tenant` ability); tenants only
 * propose: contract and ledger changes happen when staff accept (requests.inbox.ts).
 */
import { createHash } from 'node:crypto';
import { BaseError, NotFound } from '@p4/server-core';
import {
  isoDateInTimeZone,
  type PaymentClaimInput,
  type PortalMaintenance,
  type PortalMaintenanceInput,
  type PortalOpenRequests,
  type PortalPaymentClaim,
  type PortalTenantRequest,
  type TenantRequestInput,
} from '@stay/shared';
import { Op, type Transaction } from 'sequelize';
import { canAccessRecord } from '@/middlewares/ability.middleware.js';
import {
  ContractModel,
  InvoiceModel,
  MaintenanceRequestModel,
  PaymentClaimModel,
  TenantRequestModel,
} from '@/sequelize/models/index.js';
import { auditedTransaction, recordAudit } from '@/shared/audit.js';
import type { PortalPrincipal } from '@/types/express.js';
import { contractFactsAt } from '../contracts/contracts.resolvers.js';
import { isTenantVisible } from '../invoices/invoices.share.js';
import {
  notifyMaintenanceCreated,
  notifyPaymentClaimCreated,
  notifyTenantRequestCreated,
} from '../notifications/notifications.events.js';
import { portalReferenceDate } from '../portal/portal.access.js';
import { attachablePortalFile } from '../uploads/uploads.service.js';
import {
  conflict,
  invalid,
  OPEN_MAINTENANCE_STATUSES,
  photoMap,
  photosOf,
} from './requests.shared.js';

const today = () => isoDateInTimeZone(new Date());

/** The session's contract; `Contract` read checked with the tenant ability (else 404). */
async function sessionContract(portal: PortalPrincipal, transaction?: Transaction) {
  const contract = await ContractModel.findByPk(portal.contractId, { transaction });

  if (
    !contract ||
    !canAccessRecord(portal.ability, 'read', 'Contract', {
      buildingId: contract.buildingId,
      contractId: contract.id,
    })
  )
    throw new NotFound();
  return contract;
}

/** Tenant writes: `actorId: null`, link/tenant ids, never free text or amounts beyond money. */
async function auditPortal(
  portal: PortalPrincipal,
  action: string,
  resourceType: string,
  resourceId: string,
  facts: Record<string, string | number | boolean | null>,
  transaction: Transaction,
) {
  await recordAudit(
    {
      actorId: null,
      action,
      resourceType,
      resourceId,
      changes: {
        buildingId: portal.buildingId,
        contractId: portal.contractId,
        linkId: portal.linkId,
        tenantId: portal.tenantId,
        ...facts,
      },
    },
    transaction,
  );
}

/* -------------------------------------------------------------------------- */
/* Payment claims                                                              */
/* -------------------------------------------------------------------------- */

export function portalClaimDto(row: PaymentClaimModel, tenantId: string): PortalPaymentClaim {
  return {
    id: row.id,
    invoiceId: row.invoiceId,
    amount: row.amount,
    paidOn: row.paidOn,
    status: row.status,
    rejectReason: row.rejectReason,
    isOwn: row.tenantId === tenantId,
    createdAt: row.createdAt.toISOString(),
    handledAt: row.handledAt?.toISOString() ?? null,
  };
}

/** Claims of one invoice of the session's contract, newest first (T-05). */
export async function portalInvoiceClaims(
  portal: PortalPrincipal,
  invoiceId: string,
): Promise<PortalPaymentClaim[]> {
  const rows = await PaymentClaimModel.findAll({
    where: { invoiceId, contractId: portal.contractId },
    order: [['createdAt', 'DESC']],
  });

  return rows.map((row) => portalClaimDto(row, portal.tenantId));
}

const claimHash = (input: PaymentClaimInput, invoiceId: string) =>
  createHash('sha256')
    .update(
      JSON.stringify([
        invoiceId,
        input.amount,
        input.paidOn,
        input.receiptFileId ?? null,
        input.reference ?? null,
        input.note ?? null,
      ]),
    )
    .digest('hex');

/**
 * `POST /portal/invoices/:id/payment-claims`: a claim for an issued invoice of the contract with
 * something left to pay; amount ≤ remaining, one pending claim per invoice. The same
 * `Idempotency-Key` returns the same claim (another body → 409 `idempotency_conflict`).
 */
export async function createPaymentClaim(
  portal: PortalPrincipal,
  invoiceId: string,
  input: PaymentClaimInput,
  key: string | null,
): Promise<PortalPaymentClaim> {
  return auditedTransaction(async (transaction) => {
    await sessionContract(portal, transaction);
    const invoice = await InvoiceModel.findOne({
      where: { id: invoiceId, contractId: portal.contractId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (
      !isTenantVisible(invoice) ||
      !canAccessRecord(portal.ability, 'read', 'Invoice', {
        buildingId: invoice.buildingId,
        contractId: invoice.contractId,
      })
    )
      throw new NotFound();
    const hash = claimHash(input, invoice.id);

    if (key) {
      const previous = await PaymentClaimModel.findOne({
        where: { tenantId: portal.tenantId, idempotencyKey: key },
        transaction,
      });

      if (previous) {
        if (previous.idempotencyHash !== hash) conflict('idempotency_conflict');
        return portalClaimDto(previous, portal.tenantId);
      }
    }
    const remaining = invoice.total - invoice.paidTotal;

    if (remaining <= 0) conflict('invoice_already_paid');
    if (input.amount > remaining)
      throw new BaseError('payment_exceeds_remaining', 422, 'payment_exceeds_remaining', {
        remaining,
      });
    const pending = await PaymentClaimModel.count({
      where: { invoiceId: invoice.id, status: 'pending' },
      transaction,
    });

    if (pending > 0) conflict('payment_claim_pending');
    if (
      input.receiptFileId &&
      !(await attachablePortalFile(portal, input.receiptFileId, 'payment_receipt', transaction))
    )
      invalid('receiptFileId', 'Ảnh biên lai không hợp lệ. Vui lòng tải lại ảnh.');
    const row = await PaymentClaimModel.create(
      {
        buildingId: invoice.buildingId,
        contractId: invoice.contractId,
        invoiceId: invoice.id,
        tenantId: portal.tenantId,
        portalLinkId: portal.linkId,
        amount: input.amount,
        paidOn: input.paidOn,
        receiptFileId: input.receiptFileId ?? null,
        reference: input.reference ?? null,
        note: input.note ?? null,
        idempotencyKey: key,
        idempotencyHash: key ? hash : null,
      },
      { transaction },
    );

    await auditPortal(
      portal,
      'payment_claim.created',
      'payment_claim',
      row.id,
      {
        claimId: row.id,
        invoiceId: invoice.id,
        amount: row.amount,
        paidOn: row.paidOn,
        hasReceipt: Boolean(row.receiptFileId),
      },
      transaction,
    );
    await notifyPaymentClaimCreated(row, invoice, transaction);
    return portalClaimDto(row, portal.tenantId);
  });
}

/** `POST /portal/payment-claims/:id/cancel`: the sender withdraws a pending claim. */
export async function cancelPaymentClaim(
  portal: PortalPrincipal,
  id: string,
): Promise<PortalPaymentClaim> {
  return auditedTransaction(async (transaction) => {
    await sessionContract(portal, transaction);
    const row = await PaymentClaimModel.findOne({
      where: { id, contractId: portal.contractId, tenantId: portal.tenantId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!row) throw new NotFound();
    if (row.status !== 'pending') conflict('request_not_pending');
    await row.update({ status: 'cancelled' }, { transaction });
    await auditPortal(
      portal,
      'payment_claim.cancelled',
      'payment_claim',
      row.id,
      { claimId: row.id, invoiceId: row.invoiceId },
      transaction,
    );
    return portalClaimDto(row, portal.tenantId);
  });
}

/* -------------------------------------------------------------------------- */
/* Maintenance (báo hỏng)                                                      */
/* -------------------------------------------------------------------------- */

async function maintenanceDtos(
  rows: MaintenanceRequestModel[],
  tenantId: string,
): Promise<PortalMaintenance[]> {
  const photos = await photoMap(rows.flatMap((row) => row.photos));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    severity: row.severity,
    status: row.status,
    reply: row.reply,
    repliedAt: row.repliedAt?.toISOString() ?? null,
    photos: photosOf(row.photos, photos),
    isOwn: row.tenantId === tenantId,
    createdAt: row.createdAt.toISOString(),
  }));
}

/** `GET /portal/maintenance` (T-08): reports of the contract's room, newest first. */
export async function listPortalMaintenance(portal: PortalPrincipal): Promise<PortalMaintenance[]> {
  const contract = await sessionContract(portal);
  const rows = await MaintenanceRequestModel.findAll({
    where: { contractId: contract.id, source: 'tenant' },
    order: [['createdAt', 'DESC']],
    limit: 100,
  });

  return maintenanceDtos(rows, portal.tenantId);
}

/** `POST /portal/maintenance`: photos must be the link's own `maintenance_photo` uploads. */
export async function createPortalMaintenance(
  portal: PortalPrincipal,
  input: PortalMaintenanceInput,
): Promise<PortalMaintenance> {
  return auditedTransaction(async (transaction) => {
    const contract = await sessionContract(portal, transaction);

    if (!['active', 'ending'].includes(contract.status)) conflict('contract_not_active');
    const photoIds = input.photoFileIds ?? [];

    for (const fileId of photoIds)
      if (!(await attachablePortalFile(portal, fileId, 'maintenance_photo', transaction)))
        invalid('photoFileIds', 'Ảnh không hợp lệ. Vui lòng tải lại ảnh.');
    const facts = await contractFactsAt(contract.id, portalReferenceDate(contract), transaction);
    const row = await MaintenanceRequestModel.create(
      {
        buildingId: contract.buildingId,
        roomId: facts.roomId,
        contractId: contract.id,
        tenantId: portal.tenantId,
        portalLinkId: portal.linkId,
        source: 'tenant',
        category: input.category,
        severity: input.severity,
        title: input.title,
        description: input.description,
        photos: photoIds,
      },
      { transaction },
    );

    await auditPortal(
      portal,
      'maintenance_request.created',
      'maintenance_request',
      row.id,
      {
        maintenanceId: row.id,
        roomId: row.roomId,
        category: row.category,
        severity: row.severity,
        photoCount: photoIds.length,
      },
      transaction,
    );
    await notifyMaintenanceCreated(row, transaction);
    const [dto] = await maintenanceDtos([row], portal.tenantId);

    if (!dto) throw new NotFound();
    return dto;
  });
}

/** `POST /portal/maintenance/:id/cancel`: the reporter withdraws a report staff did not take. */
export async function cancelPortalMaintenance(
  portal: PortalPrincipal,
  id: string,
): Promise<PortalMaintenance> {
  return auditedTransaction(async (transaction) => {
    await sessionContract(portal, transaction);
    const row = await MaintenanceRequestModel.findOne({
      where: { id, contractId: portal.contractId, tenantId: portal.tenantId, source: 'tenant' },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!row) throw new NotFound();
    if (row.status !== 'new') conflict('request_not_pending');
    await row.update({ status: 'cancelled' }, { transaction });
    await auditPortal(
      portal,
      'maintenance_request.cancelled',
      'maintenance_request',
      row.id,
      { maintenanceId: row.id },
      transaction,
    );
    const [dto] = await maintenanceDtos([row], portal.tenantId);

    if (!dto) throw new NotFound();
    return dto;
  });
}

/* -------------------------------------------------------------------------- */
/* Requests (T-09)                                                             */
/* -------------------------------------------------------------------------- */

function requestDto(row: TenantRequestModel): PortalTenantRequest {
  return {
    id: row.id,
    type: row.type,
    payload: row.payload,
    status: row.status,
    reply: row.reply,
    createdAt: row.createdAt.toISOString(),
    handledAt: row.handledAt?.toISOString() ?? null,
  };
}

/** `GET /portal/requests`: the signed-in occupant's own requests, newest first. */
export async function listPortalRequests(portal: PortalPrincipal): Promise<PortalTenantRequest[]> {
  const contract = await sessionContract(portal);
  const rows = await TenantRequestModel.findAll({
    where: { contractId: contract.id, tenantId: portal.tenantId },
    order: [['createdAt', 'DESC']],
    limit: 100,
  });

  return rows.map(requestDto);
}

/** The date of a request payload that must fall inside the contract term. */
function termDate(input: TenantRequestInput): [field: string, date: string] | null {
  const { payload } = input;

  if ('fromDate' in payload) return ['fromDate', payload.fromDate];
  if ('toDate' in payload) return ['toDate', payload.toDate];
  if ('expectedMoveOutDate' in payload) return ['expectedMoveOutDate', payload.expectedMoveOutDate];
  return null;
}

/**
 * `POST /portal/requests`: a proposal only. The contract must be active/ending; dates must be
 * inside the term (a move-out date not before today). Staff validate again when accepting.
 */
export async function createPortalRequest(
  portal: PortalPrincipal,
  input: TenantRequestInput,
): Promise<PortalTenantRequest> {
  return auditedTransaction(async (transaction) => {
    const contract = await sessionContract(portal, transaction);

    if (!['active', 'ending'].includes(contract.status)) conflict('contract_not_active');
    const dated = termDate(input);

    if (dated) {
      const [field, date] = dated;

      if (date < contract.startDate || (contract.endDate && date > contract.endDate))
        invalid(`payload.${field}`, 'Ngày phải nằm trong thời hạn hợp đồng.');
      if (input.type === 'move_out' && date < today())
        invalid(`payload.${field}`, 'Ngày dự kiến không được trước hôm nay.');
    }
    const facts = await contractFactsAt(contract.id, portalReferenceDate(contract), transaction);
    const row = await TenantRequestModel.create(
      {
        buildingId: contract.buildingId,
        contractId: contract.id,
        roomId: facts.roomId,
        tenantId: portal.tenantId,
        portalLinkId: portal.linkId,
        type: input.type,
        payload: input.payload,
      },
      { transaction },
    );

    await auditPortal(
      portal,
      'tenant_request.created',
      'tenant_request',
      row.id,
      { requestId: row.id, type: row.type },
      transaction,
    );
    await notifyTenantRequestCreated(row, transaction);
    return requestDto(row);
  });
}

/** `POST /portal/requests/:id/cancel`: withdraw an own request still `new`. */
export async function cancelPortalRequest(
  portal: PortalPrincipal,
  id: string,
): Promise<PortalTenantRequest> {
  return auditedTransaction(async (transaction) => {
    await sessionContract(portal, transaction);
    const row = await TenantRequestModel.findOne({
      where: { id, contractId: portal.contractId, tenantId: portal.tenantId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!row) throw new NotFound();
    if (row.status !== 'new') conflict('request_not_pending');
    await row.update({ status: 'cancelled' }, { transaction });
    await auditPortal(
      portal,
      'tenant_request.cancelled',
      'tenant_request',
      row.id,
      { requestId: row.id, type: row.type },
      transaction,
    );
    return requestDto(row);
  });
}

/** Open items for the portal home (T-03). */
export async function portalOpenRequests(portal: PortalPrincipal): Promise<PortalOpenRequests> {
  const [maintenance, requests, paymentClaims] = await Promise.all([
    MaintenanceRequestModel.count({
      where: {
        contractId: portal.contractId,
        source: 'tenant',
        status: { [Op.in]: OPEN_MAINTENANCE_STATUSES },
      },
    }),
    TenantRequestModel.count({
      where: { contractId: portal.contractId, tenantId: portal.tenantId, status: 'new' },
    }),
    PaymentClaimModel.count({ where: { contractId: portal.contractId, status: 'pending' } }),
  ]);

  return { maintenance, requests, paymentClaims };
}
