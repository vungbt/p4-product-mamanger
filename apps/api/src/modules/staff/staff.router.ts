import { rulesForStaffRole } from '@p4/ability/shared';
import {
  applyAuditPolicies,
  buildPaginationMeta,
  currentUser,
  type ListLocals,
  queryText,
  requestBody,
  searchPattern,
  uuidRouteId,
  validate,
  validateListQuery,
} from '@p4/server-core';
import type { ListQuery } from '@p4/shared';
import { type NextFunction, type Request, type Response, Router } from 'express';
import { Op } from 'sequelize';
import { requireAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { UserModel } from '@/sequelize/models/index.js';
import { apiHandler } from '@/shared/api-handler.js';
import { selectFields } from '@/utils/select-fields.js';
import { auditPolicies } from './staff.audit.js';
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
  requireAbility('read', 'Staff'),
  apiHandler(async () =>
    Object.fromEntries(staff.STAFF_ROLES.map((role) => [role, rulesForStaffRole(role)])),
  ),
);
for (const kind of ['staff', 'customers']) {
  router.get(
    `/admin/${kind}`,
    requireAbility('read', kind === 'staff' ? 'Staff' : 'Customer'),
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
  requireAbility('manage', 'Staff'),
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
  requireAbility('manage', 'Staff'),
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
    requireAbility('manage', kind === 'staff' ? 'Staff' : 'Customer'),
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
export default applyAuditPolicies(router, auditPolicies);
