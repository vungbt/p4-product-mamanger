import { createHash, createHmac, randomBytes } from 'node:crypto';
import { NotFound, setAuditChanges } from '@p4/server-core';
import {
  abbreviatePersonName,
  buildVietQrPayload,
  findVietQrBank,
  INVOICE_SHARE_TTL_DAYS,
  type InvoicePeriodShare,
  type InvoicePeriodShareResult,
  type InvoiceShareLink,
  type InvoiceShareRevokeResult,
  isInvoiceOverdue,
  isoDateInTimeZone,
  type Period,
  type PublicInvoice,
  type PublicInvoiceBase,
  type PublicInvoiceLine,
  type PublicInvoicePayee,
  publicInvoicePath,
  type StayInvoiceLineMeta,
  type StayUser,
  TRANSFER_CONTENT_INVOICE_CODE,
  toTransferText,
} from '@stay/shared';
import { Op, type Transaction } from 'sequelize';
import { env, LOCAL_WEB_ORIGINS } from '@/configs/env.js';
import { allowedWebOrigins } from '@/middlewares/cookie-origin.js';
import {
  BuildingModel,
  ContractOccupantModel,
  InvoiceLineModel,
  InvoiceModel,
  RoomModel,
  TenantModel,
} from '@/sequelize/models/index.js';
import { auditedTransaction, recordAudit } from '@/shared/audit.js';
import { runIdempotent } from '@/shared/persistence.js';
import { getSettings } from '../settings/settings.service.js';
import { conflict, findBuilding, findInvoice, ISSUED_STATUSES } from './invoices.service.js';

/** 32 random bytes (or an HMAC-SHA256 digest) in base64url: always 43 characters. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
/** Most characters of the transfer content kept in the QR (NAPAS purpose field). */
const MAX_TRANSFER_CONTENT = 50;

/** Only this hash is stored: a database leak never reveals working links. */
export function hashShareToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Bulk links are derived from a random nonce with the server secret, so an `Idempotency-Key`
 * replay can return the same links while the idempotency record stores only the nonce.
 */
function derivedShareToken(nonce: string): string {
  return createHmac('sha256', env.auth.secret)
    .update(`stay.invoice-share:${nonce}`)
    .digest('base64url');
}

function shareExpiry(): Date {
  return new Date(Date.now() + INVOICE_SHARE_TTL_DAYS * 86_400_000);
}

/**
 * The caller's web origin when it is trusted, else `STAY_WEB_URL` or the first web origin. Also
 * used for tenant portal links (ST-25).
 */
export function webOrigin(requestOrigin: string | undefined): string {
  const allowed = allowedWebOrigins();

  if (requestOrigin && allowed.includes(requestOrigin)) return requestOrigin;
  return env.webUrl ?? allowed[0] ?? LOCAL_WEB_ORIGINS[0] ?? '';
}

function shareLink(token: string, origin: string) {
  const path = publicInvoicePath(token);

  return { path, url: `${origin}${path}` };
}

/** Issued, partially paid or paid; drafts and void invoices cannot be shared (409). */
function assertShareable(row: InvoiceModel) {
  if (!ISSUED_STATUSES.includes(row.status) || !row.code) conflict('invoice_not_shareable');
}

/** Writes the hash and expiry without bumping the invoice version (no business change). */
async function storeShare(
  row: InvoiceModel,
  token: string | null,
  expiresAt: Date | null,
  transaction: Transaction,
) {
  await InvoiceModel.update(
    { shareTokenHash: token ? hashShareToken(token) : null, shareExpiresAt: expiresAt },
    { where: { id: row.id }, transaction, silent: true },
  );
}

/** Audit facts: ids, code, period and expiry — never the token, its hash or personal data. */
function auditShare(
  row: InvoiceModel,
  action: 'share_created' | 'share_revoked',
  transaction: Transaction,
  expiresAt: Date | null = null,
) {
  return recordAudit(
    {
      action: `invoice.${action}`,
      resourceType: 'invoice',
      resourceId: row.id,
      changes: {
        buildingId: row.buildingId,
        contractId: row.contractId,
        invoiceId: row.id,
        code: row.code,
        period: row.period,
        status: row.status,
        replacedActiveLink: Boolean(
          row.shareTokenHash && row.shareExpiresAt && row.shareExpiresAt > new Date(),
        ),
        expiresAt: expiresAt?.toISOString() ?? null,
      },
    },
    transaction,
  );
}

async function lockedShareable(user: StayUser, id: string, transaction: Transaction) {
  const found = await findInvoice(user, id, 'update', transaction);

  return found.reload({ transaction, lock: transaction.LOCK.UPDATE });
}

/**
 * Creates or refreshes the share link of an issued invoice: a new random token (the previous
 * link stops working) valid for `INVOICE_SHARE_TTL_DAYS`. The token is returned only here.
 */
export async function shareInvoice(
  user: StayUser,
  id: string,
  requestOrigin: string | undefined,
): Promise<InvoiceShareLink> {
  return auditedTransaction(async (transaction) => {
    const row = await lockedShareable(user, id, transaction);

    assertShareable(row);
    const token = randomBytes(32).toString('base64url');
    const expiresAt = shareExpiry();

    await auditShare(row, 'share_created', transaction, expiresAt);
    await storeShare(row, token, expiresAt, transaction);
    return {
      invoiceId: row.id,
      token,
      ...shareLink(token, webOrigin(requestOrigin)),
      expiresAt: expiresAt.toISOString(),
    };
  });
}

/** Revokes the share link (idempotent): the public page answers 404 from now on. */
export async function revokeInvoiceShare(
  user: StayUser,
  id: string,
): Promise<InvoiceShareRevokeResult> {
  return auditedTransaction(async (transaction) => {
    const row = await lockedShareable(user, id, transaction);
    const revoked = row.shareTokenHash !== null;

    await auditShare(row, 'share_revoked', transaction);
    if (revoked) await storeShare(row, null, null, transaction);
    return { invoiceId: row.id, revoked };
  });
}

interface StoredPeriodShares {
  expiresAt: string;
  entries: { invoiceId: string; nonce: string }[];
}

function storedPeriodShares(result: unknown): StoredPeriodShares {
  if (!result || typeof result !== 'object' || Array.isArray(result))
    return { expiresAt: '', entries: [] };
  const expiresAt =
    'expiresAt' in result && typeof result.expiresAt === 'string' ? result.expiresAt : '';
  const raw = 'entries' in result && Array.isArray(result.entries) ? result.entries : [];
  const entries = raw.flatMap((entry: unknown) =>
    entry &&
    typeof entry === 'object' &&
    'invoiceId' in entry &&
    'nonce' in entry &&
    typeof entry.invoiceId === 'string' &&
    typeof entry.nonce === 'string'
      ? [{ invoiceId: entry.invoiceId, nonce: entry.nonce }]
      : [],
  );

  return { expiresAt, entries };
}

/**
 * Creates or refreshes the links of every issued (also partially paid/paid) invoice of a
 * building and period, for sending them room by room after issuing. Required
 * `Idempotency-Key`: a replay returns the same links (still valid ones only).
 */
export async function sharePeriodInvoices(
  user: StayUser,
  buildingId: string,
  period: Period,
  key: string,
  requestOrigin: string | undefined,
): Promise<InvoicePeriodShareResult> {
  return auditedTransaction(async (transaction) => {
    await findBuilding(user, buildingId, 'update', transaction);
    const { result, replayed } = await runIdempotent(
      {
        scope: `invoice.shares.${buildingId}.${period}`,
        actorId: user.id,
        key,
        payload: { buildingId, period },
      },
      async (tx) => {
        const rows = await InvoiceModel.findAll({
          where: { buildingId, period, status: { [Op.in]: ISSUED_STATUSES } },
          order: [['id', 'ASC']],
          lock: tx.LOCK.UPDATE,
          transaction: tx,
        });
        const expiresAt = shareExpiry();
        const entries: StoredPeriodShares['entries'] = [];

        for (const row of rows) {
          if (!row.code) continue;
          const nonce = randomBytes(32).toString('base64url');

          await auditShare(row, 'share_created', tx, expiresAt);
          await storeShare(row, derivedShareToken(nonce), expiresAt, tx);
          entries.push({ invoiceId: row.id, nonce });
        }
        return { expiresAt: expiresAt.toISOString(), entries };
      },
    );
    const stored = storedPeriodShares(result);
    const tokens = new Map(
      stored.entries.map((entry) => [entry.invoiceId, derivedShareToken(entry.nonce)]),
    );
    const rows = await InvoiceModel.findAll({
      where: { id: { [Op.in]: [...tokens.keys()] }, buildingId },
      transaction,
    });
    const rooms = await RoomModel.findAll({
      where: { id: { [Op.in]: [...new Set(rows.map((row) => row.roomId))] } },
      attributes: ['id', 'code'],
      transaction,
    });
    const roomCodes = new Map(rooms.map((room) => [room.id, room.code]));
    const origin = webOrigin(requestOrigin);
    const links: InvoicePeriodShare[] = rows.flatMap((row) => {
      const token = tokens.get(row.id);

      // A replay skips links refreshed or revoked since the first call.
      if (!token || !row.code || row.shareTokenHash !== hashShareToken(token)) return [];
      return [
        {
          invoiceId: row.id,
          roomCode: roomCodes.get(row.roomId) ?? '',
          code: row.code,
          status: row.status,
          total: row.total,
          remaining: row.total - row.paidTotal,
          ...shareLink(token, origin),
          expiresAt: stored.expiresAt,
        },
      ];
    });

    links.sort(
      (a, b) =>
        a.roomCode.localeCompare(b.roomCode, 'vi', { numeric: true }) ||
        a.code.localeCompare(b.code),
    );
    setAuditChanges({ buildingId, period, count: links.length, replayed });
    return { buildingId, period, links, count: links.length, replayed };
  });
}

/* -------------------------------------------------------------------------- */
/* Public invoice                                                              */
/* -------------------------------------------------------------------------- */

function publicMeta(meta: StayInvoiceLineMeta): PublicInvoiceLine['meta'] {
  return {
    ...(meta.coveredFrom ? { coveredFrom: meta.coveredFrom } : {}),
    ...(meta.coveredTo ? { coveredTo: meta.coveredTo } : {}),
    ...(meta.startReading !== undefined ? { startReading: meta.startReading } : {}),
    ...(meta.endReading !== undefined ? { endReading: meta.endReading } : {}),
    ...(meta.segments
      ? {
          segments: meta.segments.map(({ startReading, endReading, consumption }) => ({
            startReading,
            endReading,
            consumption,
          })),
        }
      : {}),
  };
}

function publicLine(line: InvoiceLineModel): PublicInvoiceLine {
  return {
    type: line.type,
    description: line.description,
    period: line.period,
    quantity: line.quantity,
    unit: line.unit,
    unitPrice: line.unitPrice,
    ratioNum: line.ratioNum,
    ratioDen: line.ratioDen,
    amount: line.amount,
    meta: publicMeta(line.meta ?? {}),
  };
}

function payeeOf(building: BuildingModel): PublicInvoicePayee | null {
  if (!building.bankBin || !building.bankAccount || !building.bankAccountName) return null;
  const bank = findVietQrBank(building.bankBin);

  return {
    bankBin: building.bankBin,
    bankShortName: bank?.shortName ?? null,
    bankName: bank?.name ?? null,
    accountNumber: building.bankAccount,
    accountName: building.bankAccountName,
  };
}

/** System template with the invoice code (appended when the template has no placeholder). */
function transferContent(template: string, code: string): string {
  const text = template.includes(TRANSFER_CONTENT_INVOICE_CODE)
    ? template.replaceAll(TRANSFER_CONTENT_INVOICE_CODE, code)
    : `${template} ${code}`;

  return toTransferText(text).slice(0, MAX_TRANSFER_CONTENT).trim();
}

function vietQr(payee: PublicInvoicePayee | null, amount: number, content: string) {
  if (!payee || amount <= 0) return null;
  try {
    return buildVietQrPayload({
      bin: payee.bankBin,
      accountNumber: payee.accountNumber,
      amount,
      content,
    });
  } catch {
    // Invalid stored bank data: show the account without a QR.
    return null;
  }
}

/** Abbreviated name of the current (latest) primary occupant of the contract. */
async function representative(contractId: string): Promise<string | null> {
  const occupant = await ContractOccupantModel.findOne({
    where: { contractId, isPrimary: true },
    order: [
      ['fromDate', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    attributes: ['tenantId'],
  });
  const tenant = occupant
    ? await TenantModel.findByPk(occupant.tenantId, { attributes: ['id', 'fullName'] })
    : null;

  return tenant ? abbreviatePersonName(tenant.fullName) : null;
}

/**
 * The tenant view of an issued invoice (`PublicInvoiceBase`): shared by the public link and the
 * tenant portal (ST-25). The caller has already checked the invoice may be shown.
 */
export async function publicInvoiceView(
  row: InvoiceModel & { code: string },
): Promise<PublicInvoiceBase> {
  const [building, room, lines, name, settings] = await Promise.all([
    BuildingModel.findByPk(row.buildingId),
    RoomModel.findByPk(row.roomId, { attributes: ['id', 'code'] }),
    InvoiceLineModel.findAll({
      where: { invoiceId: row.id },
      order: [
        ['position', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    }),
    representative(row.contractId),
    getSettings(),
  ]);

  if (!building) throw new NotFound();
  const remaining = row.total - row.paidTotal;
  const payee = payeeOf(building);
  const content = transferContent(settings.transferContentTemplate, row.code);

  return {
    buildingName: building.name,
    buildingAddress: building.address,
    roomCode: room?.code ?? '',
    kind: row.kind,
    period: row.period,
    code: row.code,
    status: row.status,
    issuedOn: row.issuedOn,
    dueOn: row.dueOn,
    overdue:
      isInvoiceOverdue(
        row.status,
        row.dueOn,
        isoDateInTimeZone(new Date()),
        building.graceDays ?? settings.graceDays,
      ) && remaining > 0,
    lines: lines.map(publicLine),
    subtotal: row.subtotal,
    rounding: row.rounding,
    total: row.total,
    paidTotal: row.paidTotal,
    remaining,
    representative: name,
    payee,
    transferContent: content,
    vietQrPayload: vietQr(payee, remaining, content),
  };
}

/** Issued invoices with a code: the only ones a tenant may see. */
export function isTenantVisible(row: InvoiceModel | null): row is InvoiceModel & { code: string } {
  return Boolean(row?.code && ISSUED_STATUSES.includes(row.status));
}

/**
 * `GET /api/public/invoices/:token` (no session). Unknown, expired, revoked, draft or void →
 * 404. Read-only: no audit changes are recorded for this route.
 */
export async function publicInvoice(token: string): Promise<PublicInvoice> {
  if (!TOKEN_PATTERN.test(token)) throw new NotFound();
  const row = await InvoiceModel.findOne({ where: { shareTokenHash: hashShareToken(token) } });

  if (!isTenantVisible(row) || !row.shareExpiresAt || row.shareExpiresAt <= new Date())
    throw new NotFound();
  return { ...(await publicInvoiceView(row)), expiresAt: row.shareExpiresAt.toISOString() };
}
