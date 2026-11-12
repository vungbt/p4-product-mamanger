import { BaseError, buildPaginationMeta, NotFound, searchPattern } from '@p4/server-core';
import type { ListQuery, PaginationMeta } from '@p4/shared';
import {
  isIsoDate,
  isoDateInTimeZone,
  PAYMENT_METHODS,
  type PaymentInput,
  type PaymentMethod,
  type PaymentMethodTotal,
  type PaymentResult,
  type PaymentReverseInput,
  type StayAction,
  type StayPayment,
  type StayUser,
} from '@stay/shared';
import { Op, Transaction, type WhereOptions } from 'sequelize';
import { canAccessRecord, hasAccess } from '@/middlewares/ability.middleware.js';
import { InvoiceModel, PaymentModel, RoomModel } from '@/sequelize/models/index.js';
import type { PaymentAttributes } from '@/sequelize/models/payment.model.js';
import { auditedTransaction, recordAudit } from '@/shared/audit.js';
import { runIdempotent } from '@/shared/persistence.js';
import type { ModelOrder } from '@/types/database.js';
import { applyInvoicePaidTotal } from '../invoices/invoices.service.js';
import { notifyPaymentRecorded } from '../notifications/notifications.events.js';
import { paymentDtos } from './payments.dto.js';

export type PaymentSortField = 'paidOn' | 'amount' | 'createdAt';

/** A payment to record: manual input, or `deposit` written by settlement (ST-17). */
export type PaymentRecordInput = Omit<PaymentInput, 'method'> & { method: PaymentMethod };

export interface PaymentListQuery extends ListQuery<PaymentSortField> {
  buildingId?: string;
  invoiceId?: string;
  method?: PaymentMethod;
  /** Inclusive `paidOn` range (`YYYY-MM-DD`). */
  dateFrom?: string;
  dateTo?: string;
  /** Reversed payments are listed only when asked; they never count in the totals. */
  includeReversed: boolean;
}

function conflict(code: string): never {
  throw new BaseError(code, 409, code);
}

const today = () => isoDateInTimeZone(new Date());

/** Inaccessible invoices and payments are 404, never 403. */
async function findInvoice(
  user: StayUser,
  id: string,
  action: StayAction,
  transaction: Transaction,
) {
  const row = await InvoiceModel.findByPk(id, { transaction });

  if (
    !row ||
    !canAccessRecord(user, action, 'Payment', {
      buildingId: row.buildingId,
      contractId: row.contractId,
    })
  )
    throw new NotFound();
  // Every payment writer serializes on the invoice row (then reads the payments).
  return row.reload({ transaction, lock: transaction.LOCK.UPDATE });
}

/** Sum of the invoice's non-reversed payments: the source of `invoices.paid_total`. */
async function paidTotalOf(invoiceId: string, transaction: Transaction): Promise<number> {
  const rows = await PaymentModel.findAll({
    where: { invoiceId, reversedAt: null },
    attributes: ['amount'],
    transaction,
  });
  const paid = rows.reduce((sum, row) => sum + row.amount, 0);

  if (!Number.isSafeInteger(paid))
    throw new BaseError('payment_amount_overflow', 422, 'payment_amount_overflow');
  return paid;
}

async function paymentResult(
  payment: PaymentModel,
  invoice: InvoiceModel,
  transaction?: Transaction,
): Promise<PaymentResult> {
  const [dto] = await paymentDtos([payment], transaction);

  if (!dto) throw new NotFound();
  return {
    payment: dto,
    invoice: {
      id: invoice.id,
      status: invoice.status,
      total: invoice.total,
      paidTotal: invoice.paidTotal,
      remaining: invoice.total - invoice.paidTotal,
      version: invoice.version,
    },
  };
}

/** Audit facts: ids, money, method, dates and statuses only (no reference, note or reason). */
async function auditPayment(
  action: 'recorded' | 'reversed',
  payment: PaymentModel,
  invoice: InvoiceModel,
  before: { paidTotal: number; status: string },
  transaction: Transaction,
) {
  await recordAudit(
    {
      action: `payment.${action}`,
      resourceType: 'payment',
      resourceId: payment.id,
      changes: {
        buildingId: invoice.buildingId,
        contractId: invoice.contractId,
        invoiceId: invoice.id,
        paymentId: payment.id,
        amount: payment.amount,
        method: payment.method,
        paidOn: payment.paidOn,
        paidTotalBefore: before.paidTotal,
        paidTotalAfter: invoice.paidTotal,
        statusBefore: before.status,
        statusAfter: invoice.status,
      },
    },
    transaction,
  );
}

/**
 * Records a payment inside the caller's transaction (ST-16 confirms a tenant payment claim with
 * this): locks the invoice, refuses drafts/void/paid invoices and amounts above the remaining
 * amount, then recomputes `paidTotal` and the status in the same transaction.
 */
export async function insertPayment(
  user: StayUser,
  invoiceId: string,
  input: PaymentRecordInput,
  transaction: Transaction,
): Promise<PaymentModel> {
  const invoice = await findInvoice(user, invoiceId, 'create', transaction);

  if (invoice.status === 'draft') conflict('invoice_not_issued');
  if (invoice.status === 'void') conflict('invoice_void');
  if (
    !Number.isSafeInteger(input.amount) ||
    input.amount <= 0 ||
    !PAYMENT_METHODS.includes(input.method) ||
    !isIsoDate(input.paidOn) ||
    input.paidOn > today()
  )
    throw new BaseError('invalid_payment', 422, 'invalid_payment');
  const paid = await paidTotalOf(invoice.id, transaction);
  const remaining = invoice.total - paid;

  if (remaining <= 0) conflict('invoice_already_paid');
  if (input.amount > remaining)
    throw new BaseError('payment_exceeds_remaining', 422, 'payment_exceeds_remaining', {
      remaining,
    });
  const before = { paidTotal: invoice.paidTotal, status: invoice.status };
  const payment = await PaymentModel.create(
    {
      invoiceId: invoice.id,
      buildingId: invoice.buildingId,
      amount: input.amount,
      method: input.method,
      paidOn: input.paidOn,
      reference: input.reference ?? null,
      note: input.note ?? null,
      actorId: user.id,
    },
    { transaction },
  );

  await applyInvoicePaidTotal(invoice, paid + input.amount, transaction);
  await auditPayment('recorded', payment, invoice, before, transaction);
  await notifyPaymentRecorded(
    invoice,
    input.amount,
    input.paidOn,
    remaining - input.amount,
    transaction,
  );
  return payment;
}

/** `POST /invoices/:id/payments`: the same `Idempotency-Key` never records twice. */
export async function recordPayment(
  user: StayUser,
  invoiceId: string,
  input: PaymentInput,
  key: string,
): Promise<PaymentResult> {
  return auditedTransaction(async (transaction) => {
    const { result } = await runIdempotent(
      {
        scope: `payment.create.${invoiceId}`,
        actorId: user.id,
        key,
        payload: {
          amount: input.amount,
          method: input.method,
          paidOn: input.paidOn,
          reference: input.reference ?? null,
          note: input.note ?? null,
        },
      },
      async (tx) => (await insertPayment(user, invoiceId, input, tx)).id,
    );

    if (typeof result !== 'string') throw new Error('Invalid stored payment id');
    const payment = await PaymentModel.findByPk(result, { transaction });
    const invoice = payment && (await InvoiceModel.findByPk(payment.invoiceId, { transaction }));

    if (!payment || !invoice) throw new NotFound();
    return paymentResult(payment, invoice, transaction);
  });
}

/** `POST /payments/:id/reverse`: once, with a reason; the invoice status is recomputed. */
export async function reversePayment(
  user: StayUser,
  id: string,
  input: PaymentReverseInput,
): Promise<PaymentResult> {
  return auditedTransaction(async (transaction) => {
    const found = await PaymentModel.findByPk(id, { transaction });

    if (!found) throw new NotFound();
    // Same lock order as recording: the invoice row first, then the payment row.
    const invoice = await findInvoice(user, found.invoiceId, 'void', transaction);
    const payment = await found.reload({ transaction, lock: transaction.LOCK.UPDATE });

    if (payment.reversedAt) conflict('payment_already_reversed');
    // The deposit ledger holds the matching `applied` entry; a settlement is final (ST-17).
    if (payment.method === 'deposit') conflict('deposit_payment_not_reversible');
    if (!input.reason.trim()) throw new BaseError('invalid_payment', 422, 'invalid_payment');
    const before = { paidTotal: invoice.paidTotal, status: invoice.status };

    await payment.update(
      { reversedAt: new Date(), reverseReason: input.reason.trim(), reversedBy: user.id },
      { transaction },
    );
    await applyInvoicePaidTotal(invoice, await paidTotalOf(invoice.id, transaction), transaction);
    await auditPayment('reversed', payment, invoice, before, transaction);
    return paymentResult(payment, invoice, transaction);
  });
}

/** Buildings whose payments `user` may read: `'all'` for an unconditional rule. */
function readableBuildingIds(user: StayUser): 'all' | string[] {
  if (hasAccess(user, 'read', 'Payment')) return 'all';
  return user.buildingIds.filter((buildingId) =>
    canAccessRecord(user, 'read', 'Payment', { buildingId }),
  );
}

/** `GET /payments` (Sổ thu): totals per method cover the whole filter, before paging. */
export async function listPayments(
  user: StayUser,
  query: PaymentListQuery,
): Promise<{
  data: StayPayment[];
  meta: PaginationMeta & { totals: PaymentMethodTotal[]; totalAmount: number };
}> {
  if (
    query.buildingId &&
    !canAccessRecord(user, 'read', 'Payment', { buildingId: query.buildingId })
  )
    throw new NotFound();
  const ids = readableBuildingIds(user);
  const conditions: WhereOptions<PaymentAttributes>[] = [];

  if (ids !== 'all') conditions.push({ buildingId: { [Op.in]: ids } });
  if (query.buildingId) conditions.push({ buildingId: query.buildingId });
  if (query.invoiceId) conditions.push({ invoiceId: query.invoiceId });
  if (query.method) conditions.push({ method: query.method });
  if (query.dateFrom) conditions.push({ paidOn: { [Op.gte]: query.dateFrom } });
  if (query.dateTo) conditions.push({ paidOn: { [Op.lte]: query.dateTo } });

  return auditedTransaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
    async (transaction) => {
      if (query.q) {
        // `q`: invoice code, room code or transaction reference.
        const pattern = searchPattern(query.q);
        const rooms = await RoomModel.findAll({
          where: { code: { [Op.iLike]: pattern } },
          attributes: ['id'],
          transaction,
        });
        const invoices = await InvoiceModel.findAll({
          where: {
            [Op.or]: [
              { code: { [Op.iLike]: pattern } },
              { roomId: { [Op.in]: rooms.map((room) => room.id) } },
            ],
          },
          attributes: ['id'],
          transaction,
        });

        conditions.push({
          [Op.or]: [
            { reference: { [Op.iLike]: pattern } },
            { invoiceId: { [Op.in]: invoices.map((invoice) => invoice.id) } },
          ],
        });
      }
      const counted: WhereOptions<PaymentAttributes> = {
        [Op.and]: [...conditions, { reversedAt: null }],
      };
      const where: WhereOptions<PaymentAttributes> = query.includeReversed
        ? { [Op.and]: conditions }
        : counted;
      const order: ModelOrder<PaymentAttributes> = [
        [query.sortBy ?? 'paidOn', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
        ['createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
        ['id', 'ASC'],
      ];
      const { rows, count } = await PaymentModel.findAndCountAll({
        where,
        order,
        limit: query.pageSize,
        offset: (query.page - 1) * query.pageSize,
        transaction,
      });
      const totals: PaymentMethodTotal[] = [];

      for (const method of PAYMENT_METHODS) {
        const scoped = { [Op.and]: [counted, { method }] };
        const [amount, payments] = await Promise.all([
          PaymentModel.sum('amount', { where: scoped, transaction }),
          PaymentModel.count({ where: scoped, transaction }),
        ]);

        totals.push({ method, amount: Number(amount ?? 0), count: payments });
      }
      const totalAmount = totals.reduce((sum, row) => sum + row.amount, 0);

      if (!totals.every((row) => Number.isSafeInteger(row.amount)))
        throw new BaseError('payment_amount_overflow', 422, 'payment_amount_overflow');
      return {
        data: await paymentDtos(rows, transaction),
        meta: { ...buildPaginationMeta(query.page, query.pageSize, count), totals, totalAmount },
      };
    },
  );
}
