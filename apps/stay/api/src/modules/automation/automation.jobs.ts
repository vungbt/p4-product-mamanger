import { randomUUID } from 'node:crypto';
import { createOutbox, logger, requestStore } from '@p4/server-core';
import type { JsonValue } from '@p4/shared';
import { billingDate } from '@stay/billing';
import {
  addDays,
  addMonths,
  isoDateInTimeZone,
  type StayAutomationSettings,
  type StayUser,
} from '@stay/shared';
import { Op, QueryTypes, type Transaction } from 'sequelize';
import {
  BuildingModel,
  DomainEventModel,
  InvoiceModel,
  sequelize,
  UserModel,
} from '@/sequelize/models/index.js';
import { auditedCommand, auditedTransaction, recordAudit } from '@/shared/audit.js';
import { createDrafts } from '../invoices/invoices.service.js';
import { shareInvoice } from '../invoices/invoices.share.js';
import { billingDefaults } from '../settings/settings.service.js';
import { automationDefaults, notify, settingsColumns } from './automation.service.js';

export type AutomationKind = 'reading' | 'drafts' | 'before_due' | 'after_due';

interface Run {
  id: string;
  buildingId: string;
  period: string;
  kind: AutomationKind;
  scheduledOn: string;
}

// System principal supplies CASL permissions to the existing billing/share services. It is
// never installed as an HTTP user; audit actor_id stays null with source=worker.
const system: StayUser = {
  id: '00000000-0000-4000-8000-000000000026',
  role: 'owner',
  email: '',
  displayName: 'Stay automation',
  avatarUrl: null,
  emailVerified: false,
  buildingIds: [],
  contractIds: [],
};
const { enqueueEvent } = createOutbox({
  insertEvent: (row, transaction) => DomainEventModel.create(row, { transaction }),
});

async function mail(
  run: Run,
  to: string,
  subject: string,
  text: string,
  transaction: Transaction,
  invoiceId?: string,
) {
  await enqueueEvent(
    {
      type: 'stay.automation.mail',
      aggregateType: 'automation',
      aggregateId: run.id,
      payload: { to, subject, text, ...(invoiceId ? { invoiceId } : {}) },
    },
    transaction,
  );
}

async function ownerNotice(
  run: Run,
  title: string,
  body: string,
  path: string,
  transaction: Transaction,
  email = false,
) {
  await notify(run.buildingId, title, body, path, transaction);
  if (email) {
    for (const owner of await UserModel.findAll({
      where: { role: 'owner', accountStatus: 'active' },
      transaction,
    }))
      await mail(run, owner.email, title, body, transaction);
  }
}

function enabled(settings: StayAutomationSettings, kind: AutomationKind) {
  if (kind === 'reading') return settings.readingReminder;
  if (kind === 'drafts') return settings.createDrafts;
  return (
    !settings.tenantRemindersDisabled &&
    (kind === 'before_due' ? settings.beforeDue : settings.afterDue)
  );
}

async function executeRun(run: Run, now: Date, transaction: Transaction) {
  const building = await BuildingModel.findByPk(run.buildingId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!building || building.archivedAt) return;
  const [stored] = await sequelize.query<StayAutomationSettings>(
    `SELECT ${settingsColumns} FROM building_automations WHERE building_id=:id`,
    { replacements: { id: building.id }, transaction, type: QueryTypes.SELECT },
  );
  if (!enabled(stored ?? automationDefaults, run.kind)) return;
  if (run.kind === 'reading') {
    await ownerNotice(
      run,
      'Đến ngày chốt số',
      `Chốt chỉ số kỳ ${addMonths(run.period, -1)} — ${building.name}`,
      `/readings?period=${addMonths(run.period, -1)}`,
      transaction,
      true,
    );
  } else if (run.kind === 'drafts') {
    const result = await createDrafts(system, building.id, run.period, `automation:${run.id}`);
    const missing = result.rows.filter(
      (row) => row.reason === 'missing_reading' || row.reason === 'missing_meter',
    );
    if (missing.length)
      await ownerNotice(
        run,
        'Còn phòng thiếu chỉ số',
        missing.map((row) => row.roomCode).join(', '),
        `/invoices/run?period=${run.period}`,
        transaction,
      );
  } else {
    const dueOn = addDays(run.scheduledOn, run.kind === 'before_due' ? 1 : -3);
    const invoices = await InvoiceModel.findAll({
      where: {
        buildingId: building.id,
        period: run.period,
        dueOn,
        status: { [Op.in]: ['issued', 'partially_paid'] },
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const unreachable: string[] = [];
    for (const invoice of invoices) {
      if (invoice.paidTotal >= invoice.total) continue;
      const [tenant] = await sequelize.query<{ email: string | null; fullName: string }>(
        `SELECT t.email,t.full_name AS "fullName" FROM contract_occupants o JOIN tenants t ON t.id=o.tenant_id
        WHERE o.contract_id=:id AND o.is_primary AND o.from_date<=:date AND (o.to_date IS NULL OR o.to_date>:date)
        ORDER BY o.from_date DESC LIMIT 1`,
        {
          replacements: { id: invoice.contractId, date: isoDateInTimeZone(now) },
          transaction,
          type: QueryTypes.SELECT,
        },
      );
      if (!tenant?.email) {
        unreachable.push(
          `${invoice.code ?? invoice.id}: ${tenant?.fullName ?? 'Không có người đại diện'}`,
        );
        continue;
      }
      const link = await shareInvoice(system, invoice.id, undefined);
      await mail(
        run,
        tenant.email,
        run.kind === 'before_due'
          ? 'Nhắc thanh toán hoá đơn ngày mai'
          : 'Hoá đơn đã quá hạn 3 ngày',
        `Hoá đơn ${invoice.code}: còn ${invoice.total - invoice.paidTotal} VND. ${link.url}`,
        transaction,
        invoice.id,
      );
    }
    if (unreachable.length)
      await ownerNotice(
        run,
        'Không thể gửi nhắc thanh toán',
        unreachable.join('\n'),
        `/invoices?period=${run.period}`,
        transaction,
      );
  }
  await recordAudit(
    {
      actorId: null,
      action: 'automation.completed',
      resourceType: 'automation',
      resourceId: run.id,
      changes: { buildingId: run.buildingId, period: run.period, kind: run.kind },
    },
    transaction,
  );
}

/** Claim is committed separately. A crash leaves pending work reclaimable after expiry.
 * The lease row stays locked throughout the effects transaction, fencing expired workers.
 * Drafts, notifications, mail outbox and done all commit together or all roll back.
 */
export async function resumeAutomationRun(run: Run, now: Date): Promise<boolean> {
  const token = randomUUID();
  const claimed = await sequelize.query<{ key: string }>(
    `INSERT INTO job_leases(key,token,expires_at) VALUES (:key,:token,:expiry)
    ON CONFLICT(key) DO UPDATE SET token=EXCLUDED.token,expires_at=EXCLUDED.expires_at
    WHERE job_leases.expires_at<=:now RETURNING key`,
    {
      replacements: { key: run.id, token, now, expiry: new Date(now.getTime() + 90_000) },
      type: QueryTypes.SELECT,
    },
  );
  if (!claimed.length) return false;
  return requestStore.run({ requestId: `automation:${run.id}`, source: 'worker' }, () =>
    auditedCommand({ action: 'update', resourceType: 'automation', resourceId: run.id }, async () =>
      auditedTransaction(async (transaction) => {
        const [lease] = await sequelize.query<{ token: string }>(
          'SELECT token FROM job_leases WHERE key=:id FOR UPDATE',
          { replacements: { id: run.id }, transaction, type: QueryTypes.SELECT },
        );
        if (lease?.token !== token) return false;
        const [pending] = await sequelize.query<{ status: string }>(
          'SELECT status FROM automation_runs WHERE id=:id FOR UPDATE',
          { replacements: { id: run.id }, transaction, type: QueryTypes.SELECT },
        );
        if (pending?.status !== 'pending') return false;
        await executeRun(run, now, transaction);
        await sequelize.query(
          "UPDATE automation_runs SET status='done',completed_at=:now WHERE id=:id",
          { replacements: { id: run.id, now }, transaction },
        );
        await sequelize.query('DELETE FROM job_leases WHERE key=:id AND token=:token', {
          replacements: { id: run.id, token },
          transaction,
        });
        return true;
      }),
    ),
  );
}

/** Explicit clock; all calendar dates use Asia/Ho_Chi_Minh, including month boundaries. */
export async function runAutomations(now: Date): Promise<{ completed: number }> {
  if (!Number.isFinite(now.getTime())) throw new Error('Invalid automation date');
  const date = isoDateInTimeZone(now);
  const month = date.slice(0, 7);
  const defaults = await billingDefaults();
  for (const building of await BuildingModel.findAll({ where: { archivedAt: null } })) {
    const [stored] = await sequelize.query<StayAutomationSettings>(
      `SELECT ${settingsColumns} FROM building_automations WHERE building_id=:id`,
      { replacements: { id: building.id }, type: QueryTypes.SELECT },
    );
    const settings = stored ?? automationDefaults;
    // Adjacent periods cover due-1 at the previous month's end and due+3 next month.
    for (const period of [addMonths(month, -1), month, addMonths(month, 1)]) {
      const schedule: [AutomationKind, string][] = [
        ['reading', billingDate(addMonths(period, -1), building.readingDay ?? defaults.readingDay)],
        ['drafts', billingDate(period, building.issueDay ?? defaults.issueDay)],
        ['before_due', addDays(billingDate(period, building.dueDay ?? defaults.dueDay), -1)],
        ['after_due', addDays(billingDate(period, building.dueDay ?? defaults.dueDay), 3)],
      ];
      for (const [kind, scheduledOn] of schedule) {
        if (scheduledOn !== date || !enabled(settings, kind)) continue;
        await sequelize.query(
          `INSERT INTO automation_runs(id,building_id,period,kind,scheduled_on) VALUES (:id,:buildingId,:period,:kind,:scheduledOn) ON CONFLICT(building_id,period,kind) DO NOTHING`,
          {
            replacements: { id: randomUUID(), buildingId: building.id, period, kind, scheduledOn },
          },
        );
      }
    }
  }
  const runs = await sequelize.query<Run>(
    `SELECT id,building_id AS "buildingId",period,kind,scheduled_on::text AS "scheduledOn" FROM automation_runs WHERE status='pending' AND scheduled_on<=:date ORDER BY scheduled_on,id`,
    { replacements: { date }, type: QueryTypes.SELECT },
  );
  let completed = 0;
  for (const run of runs) {
    try {
      if (await resumeAutomationRun(run, now)) completed++;
    } catch {
      // Keep this run pending; one building's failure must not starve other buildings.
      logger.error(`[stay-worker] Automation run ${run.id} failed`);
    }
  }
  return { completed };
}

export interface AutomationMailer {
  /** Implementations must deduplicate using id (provider idempotency key). */
  send(id: string, payload: JsonValue): Promise<void>;
}

/** No SMTP package is installed. Never log addresses, invoice links or mail bodies. */
export const logMailer: AutomationMailer = {
  async send(id) {
    process.stdout.write(`[stay-mail:log] ${id}\n`);
  },
};

/** P4's outbox claim pattern, scoped to Stay automation events. */
export async function deliverAutomationMail(
  now: Date,
  mailer: AutomationMailer = logMailer,
): Promise<boolean> {
  const event = await sequelize.transaction(async (transaction) => {
    const row = await DomainEventModel.findOne({
      where: {
        type: 'stay.automation.mail',
        [Op.or]: [
          { status: 'pending', availableAt: { [Op.lte]: now } },
          { status: 'processing', leaseUntil: { [Op.lte]: now } },
        ],
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
      skipLocked: true,
      order: [['availableAt', 'ASC']],
    });
    if (!row) return null;
    if (row.attempts >= 5) {
      await row.update(
        {
          status: 'dead_letter',
          leaseToken: null,
          leaseUntil: null,
          lastErrorCode: 'lease_attempts_exhausted',
        },
        { transaction },
      );
      return null;
    }
    await row.update(
      {
        status: 'processing',
        leaseToken: randomUUID(),
        leaseUntil: new Date(now.getTime() + 90_000),
        attempts: row.attempts + 1,
      },
      { transaction },
    );
    return row;
  });
  if (!event) return false;
  try {
    // Re-check opt-out after queueing: an owner may disable reminders while mail waits.
    const [permission] = await sequelize.query<{ allowed: boolean }>(
      `SELECT
      b.archived_at IS NULL AND CASE r.kind WHEN 'reading' THEN a.reading_reminder
      WHEN 'before_due' THEN NOT a.tenant_reminders_disabled AND a.before_due
      WHEN 'after_due' THEN NOT a.tenant_reminders_disabled AND a.after_due ELSE false END AS allowed
      FROM automation_runs r JOIN buildings b ON b.id=r.building_id
      JOIN building_automations a ON a.building_id=r.building_id WHERE r.id=:id`,
      { replacements: { id: event.aggregateId }, type: QueryTypes.SELECT },
    );
    const payload = event.payload;
    const invoiceId =
      payload &&
      typeof payload === 'object' &&
      !Array.isArray(payload) &&
      typeof payload.invoiceId === 'string'
        ? payload.invoiceId
        : null;
    const invoice = invoiceId ? await InvoiceModel.findByPk(invoiceId) : null;
    const unpaid =
      !invoiceId ||
      (invoice &&
        (invoice.status === 'issued' || invoice.status === 'partially_paid') &&
        invoice.paidTotal < invoice.total);
    if (permission?.allowed && unpaid) await mailer.send(event.id, event.payload);
    await DomainEventModel.update(
      {
        status: 'delivered',
        deliveredAt: now,
        leaseUntil: null,
        leaseToken: null,
        lastErrorCode: null,
      },
      { where: { id: event.id, leaseToken: event.leaseToken } },
    );
  } catch {
    await DomainEventModel.update(
      {
        status: event.attempts >= 5 ? 'dead_letter' : 'pending',
        availableAt: new Date(now.getTime() + 60_000),
        leaseUntil: null,
        leaseToken: null,
        lastErrorCode: 'mail_delivery_failed',
      },
      { where: { id: event.id, leaseToken: event.leaseToken } },
    );
  }
  return true;
}
