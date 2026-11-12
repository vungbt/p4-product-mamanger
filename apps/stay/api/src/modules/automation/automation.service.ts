import { randomUUID } from 'node:crypto';
import { NotFound, setAuditChanges } from '@p4/server-core';
import type { StayAutomationSettings, StayNotifications, StayUser } from '@stay/shared';
import { QueryTypes, type Transaction } from 'sequelize';
import { hasAccess } from '@/middlewares/ability.middleware.js';
import { accessibleWhere } from '@/middlewares/accessible-where.js';
import { BuildingModel, sequelize } from '@/sequelize/models/index.js';
import { auditedTransaction } from '@/shared/audit.js';
import { assertVersion } from '@/shared/input.js';
import { findAccessibleBuilding } from '../buildings/buildings.service.js';

export const settingsColumns = `reading_reminder AS "readingReminder",
 reading_reminder_before AS "readingReminderBefore",
 reading_reminder_days_before AS "readingReminderDaysBefore", create_drafts AS "createDrafts",
 before_due AS "beforeDue", after_due AS "afterDue", tenant_reminders_disabled AS "tenantRemindersDisabled", version`;

export const automationDefaults: StayAutomationSettings = {
  readingReminder: false,
  readingReminderBefore: false,
  readingReminderDaysBefore: 1,
  createDrafts: false,
  beforeDue: false,
  afterDue: false,
  tenantRemindersDisabled: true,
  version: 1,
};

export async function automationSettings(
  user: StayUser,
  id: string,
): Promise<StayAutomationSettings> {
  await findAccessibleBuilding(user, id, 'read');
  const rows = await sequelize.query<StayAutomationSettings>(
    `SELECT ${settingsColumns} FROM building_automations WHERE building_id=:id`,
    { replacements: { id }, type: QueryTypes.SELECT },
  );
  return rows[0] ?? automationDefaults;
}

export async function updateAutomationSettings(
  user: StayUser,
  id: string,
  input: StayAutomationSettings,
): Promise<StayAutomationSettings> {
  return auditedTransaction(async (transaction) => {
    await findAccessibleBuilding(user, id, 'manage', transaction);
    await sequelize.query(
      'INSERT INTO building_automations(building_id) VALUES (:id) ON CONFLICT DO NOTHING',
      { replacements: { id }, transaction },
    );
    const [before] = await sequelize.query<StayAutomationSettings>(
      `SELECT ${settingsColumns} FROM building_automations WHERE building_id=:id FOR UPDATE`,
      { replacements: { id }, transaction, type: QueryTypes.SELECT },
    );
    if (!before) throw new Error('Automation settings missing after insert');
    assertVersion(before.version, input.version);
    const [after] = await sequelize.query<StayAutomationSettings>(
      `UPDATE building_automations SET
      reading_reminder=:readingReminder, reading_reminder_before=:readingReminderBefore,
      reading_reminder_days_before=:readingReminderDaysBefore, create_drafts=:createDrafts, before_due=:beforeDue,
      after_due=:afterDue, tenant_reminders_disabled=:tenantRemindersDisabled, version=version+1
      WHERE building_id=:id RETURNING ${settingsColumns}`,
      { replacements: { id, ...input }, transaction, type: QueryTypes.SELECT },
    );
    if (!after) throw new Error('Automation settings update failed');
    setAuditChanges({ buildingId: id, before: { ...before }, after: { ...after } });
    return after;
  });
}

export async function notify(
  buildingId: string,
  title: string,
  body: string,
  path: string,
  transaction: Transaction,
) {
  await sequelize.query(
    'INSERT INTO notifications(id,building_id,title,body,path) VALUES (:id,:buildingId,:title,:body,:path)',
    { replacements: { id: randomUUID(), buildingId, title, body, path }, transaction },
  );
}

export async function listNotifications(user: StayUser): Promise<StayNotifications> {
  const ids = hasAccess(user, 'read', 'Building')
    ? 'all'
    : (
        await BuildingModel.findAll({
          attributes: ['id'],
          where: accessibleWhere(user, 'read', 'Building', { buildingId: 'id' }),
        })
      ).map((row) => row.id);
  if (ids !== 'all' && !ids.length) return { items: [], unreadCount: 0 };
  const scope = ids === 'all' ? '' : 'AND n.building_id IN (:ids)';
  const replacements = { userId: user.id, ids };
  // A bounded recent list, with an independent total for all unread records.
  const items = await sequelize.query<StayNotifications['items'][number]>(
    `SELECT n.id,n.building_id AS "buildingId",n.title,n.body,n.path,
    to_char(n.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
    to_char(r.read_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "readAt"
    FROM notifications n LEFT JOIN notification_reads r ON r.notification_id=n.id AND r.user_id=:userId
    WHERE true ${scope} ORDER BY n.created_at DESC,n.id DESC LIMIT 50`,
    { replacements, type: QueryTypes.SELECT },
  );
  const [count] = await sequelize.query<{ count: number }>(
    `SELECT count(*)::integer AS count FROM notifications n
    WHERE NOT EXISTS(SELECT 1 FROM notification_reads r WHERE r.notification_id=n.id AND r.user_id=:userId) ${scope}`,
    { replacements, type: QueryTypes.SELECT },
  );
  return { items, unreadCount: count?.count ?? 0 };
}

export async function markNotificationRead(user: StayUser, id: string): Promise<{ id: string }> {
  return auditedTransaction(async (transaction) => {
    const [row] = await sequelize.query<{ buildingId: string }>(
      'SELECT building_id AS "buildingId" FROM notifications WHERE id=:id',
      { replacements: { id }, transaction, type: QueryTypes.SELECT },
    );
    if (!row) throw new NotFound('notification_not_found');
    await findAccessibleBuilding(user, row.buildingId, 'read', transaction);
    await sequelize.query(
      'INSERT INTO notification_reads(notification_id,user_id) VALUES (:id,:userId) ON CONFLICT DO NOTHING',
      { replacements: { id, userId: user.id }, transaction },
    );
    setAuditChanges({ notificationId: id, buildingId: row.buildingId });
    return { id };
  });
}
