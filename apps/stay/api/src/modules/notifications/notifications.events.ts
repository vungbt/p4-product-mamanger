/**
 * Business events → notifications. Each helper runs inside the caller's audited transaction, so
 * the notification and its outbox delivery commit (or roll back) with the business write.
 */
import type { StayUser, TenantRequestType } from '@stay/shared';
import { Op, QueryTypes, type Transaction } from 'sequelize';
import { emailEnabled } from '@/configs/env.js';
import { canAccessRecord } from '@/middlewares/ability.middleware.js';
import type {
  AnnouncementModel,
  InvoiceModel,
  MaintenanceRequestModel,
  PaymentClaimModel,
  TenantRequestModel,
} from '@/sequelize/models/index.js';
import { ContractModel, sequelize } from '@/sequelize/models/index.js';
import { shareInvoice } from '../invoices/invoices.share.js';
import {
  displayDate,
  formatVnd,
  primaryOccupant,
  publishNotification,
  roomCodeOf,
} from './notifications.publish.js';

const REQUEST_LABELS: Record<TenantRequestType, string> = {
  move_out: 'báo trả phòng',
  add_occupant: 'thêm người ở',
  remove_occupant: 'bớt người ở',
  add_vehicle: 'đăng ký xe',
  remove_vehicle: 'huỷ đăng ký xe',
  other: 'yêu cầu khác',
};

const shorten = (text: string, max = 300) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

async function roomOf(roomId: string | null, contractId: string | null, transaction: Transaction) {
  if (roomId) return roomCodeOf(roomId, transaction);
  if (!contractId) return '';
  const contract = await ContractModel.findByPk(contractId, {
    attributes: ['roomId'],
    transaction,
  });

  return contract ? roomCodeOf(contract.roomId, transaction) : '';
}

/** Tenant → owner/managers: "Phòng X báo đã chuyển Y ₫ cho hoá đơn Z". */
export async function notifyPaymentClaimCreated(
  claim: PaymentClaimModel,
  invoice: InvoiceModel,
  transaction: Transaction,
) {
  const room = await roomCodeOf(invoice.roomId, transaction);

  await publishNotification(
    {
      buildingId: claim.buildingId,
      kind: 'payment_claim.created',
      title: `Phòng ${room} báo đã chuyển khoản`,
      body: `Phòng ${room} báo đã chuyển ${formatVnd(claim.amount)} cho hoá đơn ${invoice.code ?? ''} (ngày ${displayDate(claim.paidOn)}). Kiểm tra tài khoản rồi xác nhận trong mục Yêu cầu.`,
      path: '/requests?kind=payment_claim',
      audience: 'staff',
      invoiceId: invoice.id,
      emailAmount: claim.amount,
    },
    transaction,
  );
}

/** Owner → tenant: payment recorded (manual or confirmed claim), with what is left to pay. */
export async function notifyPaymentRecorded(
  invoice: InvoiceModel,
  amount: number,
  paidOn: string,
  remaining: number,
  transaction: Transaction,
) {
  await publishNotification(
    {
      buildingId: invoice.buildingId,
      kind: 'payment.recorded',
      title:
        remaining > 0
          ? `Đã nhận ${formatVnd(amount)}, còn ${formatVnd(remaining)}`
          : 'Hoá đơn đã thanh toán đủ',
      body: `Chủ trọ đã ghi nhận ${formatVnd(amount)} ngày ${displayDate(paidOn)} cho hoá đơn ${invoice.code ?? ''}. ${
        remaining > 0 ? `Còn lại ${formatVnd(remaining)}.` : 'Cảm ơn bạn!'
      }`,
      path: `/p/invoices/${invoice.id}`,
      audience: 'tenant',
      contractId: invoice.contractId,
      invoiceId: invoice.id,
      emailAmount: amount,
    },
    transaction,
  );
}

/** Owner → the tenant who sent the claim: rejected, with the reason. */
export async function notifyPaymentClaimRejected(
  claim: PaymentClaimModel,
  transaction: Transaction,
) {
  const [invoice] = await sequelize.query<{ code: string | null }>(
    'SELECT code FROM invoices WHERE id=:id',
    { replacements: { id: claim.invoiceId }, transaction, type: QueryTypes.SELECT },
  );

  await publishNotification(
    {
      buildingId: claim.buildingId,
      kind: 'payment_claim.rejected',
      title: 'Báo chuyển khoản chưa được xác nhận',
      body: `Hoá đơn ${invoice?.code ?? ''}: khoản ${formatVnd(claim.amount)} chưa được xác nhận. Lý do: ${claim.rejectReason ?? ''}`,
      path: `/p/invoices/${claim.invoiceId}`,
      audience: 'tenant',
      contractId: claim.contractId,
      tenantId: claim.tenantId,
      invoiceId: claim.invoiceId,
    },
    transaction,
  );
}

/**
 * Invoice issued → tenant: amount, due date and, for the email, a shared invoice link (VietQR)
 * created in the same transaction when the primary occupant has an email and SMTP is on.
 */
export async function notifyInvoiceIssued(
  user: StayUser,
  invoice: InvoiceModel,
  transaction: Transaction,
) {
  const primary = await primaryOccupant(invoice.contractId, transaction);
  const canShare = canAccessRecord(user, 'update', 'Invoice', {
    buildingId: invoice.buildingId,
    contractId: invoice.contractId,
  });
  const link =
    primary?.email && emailEnabled() && canShare
      ? await shareInvoice(user, invoice.id, undefined)
      : null;

  await publishNotification(
    {
      buildingId: invoice.buildingId,
      kind: 'invoice.issued',
      title: `Hoá đơn mới ${invoice.code ?? ''}`,
      body: `Tổng tiền ${formatVnd(invoice.total)}, hạn thanh toán ${displayDate(invoice.dueOn)}. Chuyển khoản theo mã QR trên hoá đơn rồi bấm "Báo đã chuyển khoản".`,
      path: `/p/invoices/${invoice.id}`,
      audience: 'tenant',
      contractId: invoice.contractId,
      invoiceId: invoice.id,
      ...(link ? { emailLink: link.url } : {}),
    },
    transaction,
  );
}

/** Tenant → owner/managers: maintenance report. */
export async function notifyMaintenanceCreated(
  row: MaintenanceRequestModel,
  transaction: Transaction,
) {
  const room = await roomOf(row.roomId, row.contractId, transaction);

  await publishNotification(
    {
      buildingId: row.buildingId,
      kind: 'maintenance.created',
      title: `${row.severity === 'urgent' ? '[Khẩn] ' : ''}Phòng ${room} báo hỏng`,
      body: shorten(`${row.title}${row.description ? ` — ${row.description}` : ''}`),
      path: '/requests?kind=maintenance',
      audience: 'staff',
    },
    transaction,
  );
}

/** Tenant → owner/managers: contract change request. */
export async function notifyTenantRequestCreated(
  row: TenantRequestModel,
  transaction: Transaction,
) {
  const room = await roomOf(row.roomId, row.contractId, transaction);

  await publishNotification(
    {
      buildingId: row.buildingId,
      kind: 'tenant_request.created',
      title: `Phòng ${room}: ${REQUEST_LABELS[row.type]}`,
      body: `Người thuê phòng ${room} gửi yêu cầu ${REQUEST_LABELS[row.type]}. Xem và xử lý trong mục Yêu cầu.`,
      path: '/requests?kind=tenant_request',
      audience: 'staff',
    },
    transaction,
  );
}

export type HandledRequest =
  | { kind: 'maintenance'; row: MaintenanceRequestModel }
  | { kind: 'tenant_request'; row: TenantRequestModel };

/** Owner → the tenant who sent it: accepted, done, rejected (reason) or replied. */
export async function notifyRequestHandled(
  handled: HandledRequest,
  action: 'accepted' | 'rejected' | 'replied',
  message: string | null | undefined,
  transaction: Transaction,
) {
  const { row } = handled;

  if (!row.tenantId || !row.contractId) return;
  const maintenance = handled.kind === 'maintenance';
  const subject = maintenance
    ? `Báo hỏng "${handled.row.title}"`
    : `Yêu cầu ${REQUEST_LABELS[handled.row.type]}`;
  const title =
    action === 'rejected'
      ? `${subject} bị từ chối`
      : action === 'replied'
        ? `Chủ trọ trả lời: ${subject}`
        : maintenance && row.status === 'done'
          ? `${subject} đã xử lý xong`
          : maintenance
            ? `${subject} đang được xử lý`
            : `${subject} đã được chấp nhận`;

  await publishNotification(
    {
      buildingId: row.buildingId,
      kind: 'request.updated',
      title: shorten(title, 120),
      body: message
        ? shorten(action === 'rejected' ? `Lý do: ${message}` : message)
        : 'Xem chi tiết trong cổng người thuê.',
      path: maintenance ? '/p/maintenance' : '/p/requests',
      audience: 'tenant',
      contractId: row.contractId,
      tenantId: row.tenantId,
    },
    transaction,
  );
}

/** Announcement → every active contract of the building (or of the chosen rooms). */
export async function notifyAnnouncement(row: AnnouncementModel, transaction: Transaction) {
  const contracts = await ContractModel.findAll({
    where: {
      buildingId: row.buildingId,
      status: { [Op.in]: ['active', 'ending'] },
      ...(row.roomIds?.length ? { roomId: { [Op.in]: row.roomIds } } : {}),
    },
    attributes: ['id'],
    order: [['id', 'ASC']],
    transaction,
  });

  for (const contract of contracts)
    await publishNotification(
      {
        buildingId: row.buildingId,
        kind: 'announcement.created',
        title: shorten(`Thông báo: ${row.title}`, 120),
        body: shorten(row.body),
        path: '/p/notices',
        audience: 'tenant',
        contractId: contract.id,
      },
      transaction,
    );
}
