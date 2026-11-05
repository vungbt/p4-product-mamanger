import { randomUUID } from 'node:crypto';
import type { ListQuery } from '@p4/shared';
import { Router } from 'express';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { requirePermission } from '@/middlewares/permission.middleware.js';
import {
  NotificationModel,
  NotificationPreferencesModel,
  NotificationTemplateModel,
  sequelize,
} from '@/sequelize/models/index.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { recordAudit } from '@/shared/commerce/persistence.js';
import { assertVersion } from '@/shared/commerce/transitions.js';
import { currentUser, requestBody, uuidRouteId } from '@/shared/http-input.js';
import { validateListQuery } from '@/shared/list-query.js';
import { NotFound } from '@/utils/errors/index.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import { selectFields } from '@/utils/select-fields.js';
import * as notifications from './notifications.service.js';

const router = Router();
const list = validateListQuery({
  sortFields: ['createdAt'],
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  rules: () => ({}),
  normalize: (_query, base) => base,
});
router.get(
  '/notifications',
  authRequired,
  list,
  listHandler(async (req, query: ListQuery<'createdAt'>) => {
    const result = await NotificationModel.findAndCountAll({
      where: { userId: currentUser(req).id },
      order: [
        ['createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
        ['id', 'ASC'],
      ],
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
    return {
      data: result.rows.map(notifications.notificationDto),
      meta: buildPaginationMeta(query.page, query.pageSize, result.count),
    };
  }),
);
router.get(
  '/notifications/unread-count',
  authRequired,
  apiHandler(async (req) => notifications.unreadCount(currentUser(req).id)),
);
router.post(
  '/notifications/read-all',
  authRequired,
  apiHandler(async (req) => notifications.readNotifications(currentUser(req).id)),
);
router.post(
  '/notifications/:id/read',
  authRequired,
  apiHandler(async (req) => {
    const id = uuidRouteId(req);
    if (!(await NotificationModel.findOne({ where: { id, userId: currentUser(req).id } })))
      throw new NotFound();
    return notifications.readNotifications(currentUser(req).id, id);
  }),
);
router.get(
  '/me/notification-preferences',
  authRequired,
  apiHandler(async (req) =>
    notifications.preferencesDto(await notifications.preferences(currentUser(req).id)),
  ),
);
router.patch(
  '/me/notification-preferences',
  authRequired,
  apiHandler(async (req) => {
    const body = requestBody(req);
    const userId = currentUser(req).id;
    await notifications.preferences(userId);
    return sequelize.transaction(async (transaction) => {
      const row = await NotificationPreferencesModel.findByPk(userId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!row) throw new NotFound();
      assertVersion(row.version, body.integer('expectedVersion', 1));
      await row.update(
        {
          transactionalEmail: body.boolean('transactionalEmail'),
          marketingEmail: body.boolean('marketingEmail'),
          stockEmail: body.boolean('stockEmail'),
          version: row.version + 1,
        },
        { transaction },
      );
      await recordAudit(
        {
          actorId: userId,
          action: 'notification_preferences.updated',
          resourceType: 'user',
          resourceId: userId,
        },
        transaction,
      );
      return notifications.preferencesDto(row);
    });
  }),
);
router.get(
  '/admin/notification-templates',
  authRequired,
  requirePermission('notification:read'),
  apiHandler(async () =>
    (
      await NotificationTemplateModel.findAll({
        order: [
          ['type', 'ASC'],
          ['locale', 'ASC'],
        ],
        limit: 100,
      })
    ).map((row) => selectFields(row, ['id', 'type', 'locale', 'subject', 'body', 'version'])),
  ),
);
router.put(
  '/admin/notification-templates',
  authRequired,
  requirePermission('notification:manage'),
  apiHandler(async (req) => {
    const body = requestBody(req);
    const type = body.enum('type', notifications.TEMPLATE_TYPES);
    const locale = body.enum('locale', ['vi', 'en']);
    const subject = body.text('subject', 200);
    const text = body.text('body', 5000);
    if (/[<>]/.test(subject + text)) return body.invalid('body');
    return sequelize.transaction(async (transaction) => {
      await sequelize.query('SELECT pg_advisory_xact_lock(hashtext(:key))', {
        replacements: { key: `template:${type}:${locale}` },
        transaction,
      });
      let row = await NotificationTemplateModel.findOne({ where: { type, locale }, transaction });
      if (row) {
        assertVersion(row.version, body.integer('expectedVersion', 1));
        await row.update({ subject, body: text, version: row.version + 1 }, { transaction });
      } else
        row = await NotificationTemplateModel.create(
          { id: randomUUID(), type, locale, subject, body: text, version: 1 },
          { transaction },
        );
      await recordAudit(
        {
          actorId: currentUser(req).id,
          action: 'notification_template.updated',
          resourceType: 'notification_template',
          resourceId: row.id,
        },
        transaction,
      );
      return selectFields(row, ['id', 'type', 'locale', 'subject', 'body', 'version']);
    });
  }),
);
export default router;
