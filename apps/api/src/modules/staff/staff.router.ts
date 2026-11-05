import type { ListQuery } from '@p4/shared';
import { type NextFunction, type Request, type Response, Router } from 'express';
import { Op } from 'sequelize';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { requirePermission, STAFF_PERMISSIONS } from '@/middlewares/permission.middleware.js';
import { UserModel } from '@/sequelize/models/index.js';
import { apiHandler } from '@/shared/api-handler.js';
import { currentUser, requestBody, uuidRouteId } from '@/shared/http-input.js';
import { searchPattern } from '@/shared/list-filters.js';
import { type ListLocals, queryText, validateListQuery } from '@/shared/list-query.js';
import validate from '@/shared/validation.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import { selectFields } from '@/utils/select-fields.js';
import * as staff from './staff.service.js';

type Query = ListQuery<'email' | 'displayName' | 'createdAt'>;
const fields: NonNullable<Query['sortBy']>[] = ['email', 'displayName', 'createdAt'];
const listQuery = validateListQuery({
  sortFields: fields,
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  rules: () => ({}),
  normalize: (_query, base): Query => base,
});
const router = Router();
router.use(
  ['/admin/staff', '/admin/roles', '/admin/customers', '/staff/invitations'],
  authRequired,
);
router.get(
  '/admin/roles',
  requirePermission('staff:read'),
  apiHandler(async () => STAFF_PERMISSIONS),
);
for (const kind of ['staff', 'customers']) {
  router.get(
    `/admin/${kind}`,
    requirePermission(kind === 'staff' ? 'staff:read' : 'customer:read'),
    listQuery,
    async (req: Request, res: Response<unknown, ListLocals<Query>>, next: NextFunction) => {
      try {
        const query: Query = res.locals.listQuery;
        const q = queryText(req.query, 'q');
        const { rows, count } = await UserModel.findAndCountAll({
          where: {
            role: kind === 'staff' ? 'admin' : 'user',
            ...(q
              ? {
                  [Op.or]: [
                    { email: { [Op.iLike]: searchPattern(q) } },
                    { displayName: { [Op.iLike]: searchPattern(q) } },
                  ],
                }
              : {}),
          },
          attributes: [
            'id',
            'email',
            'displayName',
            'role',
            'staffRole',
            'accountStatus',
            'version',
          ],
          order: [
            [query.sortBy ?? 'createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
            ['id', 'ASC'],
          ],
          limit: query.pageSize,
          offset: (query.page - 1) * query.pageSize,
        });
        return res.jsonApi(200, {
          data: rows.map((row) =>
            selectFields(row, [
              'id',
              'email',
              'displayName',
              'role',
              'staffRole',
              'accountStatus',
              'version',
            ]),
          ),
          meta: buildPaginationMeta(query.page, query.pageSize, count),
        });
      } catch (error) {
        return next(error);
      }
    },
  );
}
router.post(
  '/admin/staff/invitations',
  requirePermission('staff:manage'),
  validate({ rules: { email: 'required|email' } }),
  apiHandler(async (req) => {
    const body = requestBody(req);
    return staff.inviteStaff(
      currentUser(req),
      body.text('email'),
      body.enum('staffRole', staff.STAFF_ROLES),
    );
  }, 202),
);
router.post(
  '/staff/invitations/accept',
  apiHandler(async (req) =>
    staff.acceptInvitation(currentUser(req), requestBody(req).text('token', 128)),
  ),
);
router.patch(
  '/admin/staff/:id/role',
  requirePermission('staff:manage'),
  apiHandler(async (req) => {
    const body = requestBody(req);
    return staff.changeAccount(
      currentUser(req),
      uuidRouteId(req),
      {
        expectedVersion: body.integer('expectedVersion', 1),
        staffRole: body.enum('staffRole', staff.STAFF_ROLES),
        reason: body.text('reason', 1000),
      },
      true,
    );
  }),
);
for (const kind of ['staff', 'customers']) {
  router.patch(
    `/admin/${kind}/:id/status`,
    requirePermission(kind === 'staff' ? 'staff:manage' : 'customer:manage'),
    apiHandler(async (req) => {
      const body = requestBody(req);
      return staff.changeAccount(
        currentUser(req),
        uuidRouteId(req),
        {
          expectedVersion: body.integer('expectedVersion', 1),
          accountStatus: body.enum('accountStatus', ['active', 'blocked']),
          reason: body.text('reason', 1000),
        },
        kind === 'staff',
      );
    }),
  );
}
export default router;
