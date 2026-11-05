import type { ListQuery } from '@p4/shared';
import { Router } from 'express';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { permissionsFor, requirePermission } from '@/middlewares/permission.middleware.js';
import { rateLimit } from '@/middlewares/rate-limit.middleware.js';
import {
  SupportMessageModel,
  SupportTicketModel,
  sequelize,
  UserModel,
} from '@/sequelize/models/index.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { recordAudit } from '@/shared/commerce/persistence.js';
import { assertVersion } from '@/shared/commerce/transitions.js';
import { currentUser, requestBody, uuidRouteId } from '@/shared/http-input.js';
import { validateListQuery } from '@/shared/list-query.js';
import { NotFound } from '@/utils/errors/index.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import * as support from './support.service.js';

const router = Router();
const list = validateListQuery({
  sortFields: ['createdAt'],
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  rules: () => ({}),
  normalize: (_query, base) => base,
});
router.post(
  '/support/tickets',
  authRequired,
  rateLimit('support-create', 10, 3600000),
  apiHandler(async (req) => {
    const body = requestBody(req);
    const orderId = body.optionalText('orderId', 36) ?? null;
    if (orderId && !/^[a-f0-9-]{36}$/i.test(orderId)) return body.invalid('orderId');
    return support.createTicket(currentUser(req), {
      subject: body.text('subject', 200),
      category: body.enum('category', ['order', 'return', 'payment', 'product', 'other']),
      body: body.text('body', 10000),
      orderId,
      attachmentIds:
        body.data.attachmentIds === undefined ? [] : body.strings('attachmentIds', 10, 36),
    });
  }, 201),
);
for (const admin of [false, true])
  router.get(
    admin ? '/admin/support/tickets' : '/support/tickets/mine',
    authRequired,
    ...(admin ? [requirePermission('support:read')] : []),
    list,
    listHandler(async (req, query: ListQuery<'createdAt'>) => {
      const result = await SupportTicketModel.findAndCountAll({
        where: admin ? {} : { userId: currentUser(req).id },
        order: [
          ['createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
          ['id', 'ASC'],
        ],
        limit: query.pageSize,
        offset: (query.page - 1) * query.pageSize,
      });
      return {
        data: result.rows.map(support.ticketDto),
        meta: buildPaginationMeta(query.page, query.pageSize, result.count),
      };
    }),
  );
router.get(
  '/support/tickets/:id',
  authRequired,
  apiHandler(async (req) =>
    support.ticketDto(await support.ownedTicket(currentUser(req), uuidRouteId(req))),
  ),
);
router.get(
  '/support/tickets/:id/messages',
  authRequired,
  list,
  listHandler(async (req, query: ListQuery<'createdAt'>) => {
    const id = uuidRouteId(req);
    const user = currentUser(req);
    await support.ownedTicket(user, id);
    const result = await SupportMessageModel.findAndCountAll({
      where: {
        ticketId: id,
        ...(permissionsFor(user).includes('support:read') ? {} : { internal: false }),
      },
      order: [
        ['createdAt', 'ASC'],
        ['id', 'ASC'],
      ],
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
    return {
      data: result.rows.map(support.messageDto),
      meta: buildPaginationMeta(query.page, query.pageSize, result.count),
    };
  }),
);
router.post(
  '/support/tickets/:id/messages',
  authRequired,
  rateLimit('support-message', 30),
  apiHandler(async (req) => {
    const body = requestBody(req);
    return support.addMessage(
      currentUser(req),
      uuidRouteId(req),
      body.integer('expectedVersion', 1),
      {
        body: body.text('body', 10000),
        internal: body.data.internal === undefined ? false : body.boolean('internal'),
        attachmentIds:
          body.data.attachmentIds === undefined ? [] : body.strings('attachmentIds', 10, 36),
      },
    );
  }, 201),
);
router.post(
  '/admin/support/tickets/:id/assign',
  authRequired,
  requirePermission('support:manage'),
  apiHandler(async (req) => {
    const body = requestBody(req);
    const assigneeId = body.text('assigneeId', 36);
    if (!/^[a-f0-9-]{36}$/i.test(assigneeId)) return body.invalid('assigneeId');
    const staff = await UserModel.findByPk(assigneeId);
    if (staff?.accountStatus !== 'active' || !permissionsFor(staff).includes('support:manage'))
      throw new NotFound();
    return sequelize.transaction(async (transaction) => {
      const row = await SupportTicketModel.findByPk(uuidRouteId(req), {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!row) throw new NotFound();
      assertVersion(row.version, body.integer('expectedVersion', 1));
      await row.update(
        { assigneeId, status: 'in_progress', version: row.version + 1 },
        { transaction },
      );
      await recordAudit(
        {
          actorId: currentUser(req).id,
          action: 'support.assigned',
          resourceType: 'support_ticket',
          resourceId: row.id,
        },
        transaction,
      );
      return support.ticketDto(row);
    });
  }),
);
router.post(
  '/support/tickets/:id/close',
  authRequired,
  apiHandler(async (req) => {
    const user = currentUser(req);
    const body = requestBody(req);
    const reason = body.text('reason', 1000);
    return sequelize.transaction(async (transaction) => {
      const row = await support.ownedTicket(user, uuidRouteId(req), transaction, true);
      assertVersion(row.version, body.integer('expectedVersion', 1));
      await row.update({ status: 'closed', version: row.version + 1 }, { transaction });
      await recordAudit(
        {
          actorId: user.id,
          action: 'support.closed',
          resourceType: 'support_ticket',
          resourceId: row.id,
          reason,
        },
        transaction,
      );
      return support.ticketDto(row);
    });
  }),
);
export default router;
