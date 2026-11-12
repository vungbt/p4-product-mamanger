import {
  applyAuditPolicies,
  type RouteAuditPolicies,
  uuidRouteId,
  validateListQuery,
} from '@p4/server-core';
import { Router } from 'express';
import { requireAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { formBody } from '@/shared/input.js';
import { readInvitationInput, readMemberInput } from './members.input.js';
import {
  disableMember,
  inviteMember,
  listMembers,
  type MemberListQuery,
  type MemberSortField,
  updateMember,
} from './members.service.js';

const router = Router();
const sortFields: MemberSortField[] = ['email', 'displayName'];
const memberQuery = validateListQuery({
  sortFields,
  defaultSort: 'email',
  rules: () => ({}),
  normalize: (_query, base) => base,
});

// ST-27 action policy: owner-only manage Member; never promote or disable owners/tenants.
router.get(
  '/members',
  authRequired,
  requireAbility('manage', 'Member'),
  memberQuery,
  listHandler((_req, query: MemberListQuery) => listMembers(query)),
);
router.post(
  '/members/invitations',
  authRequired,
  requireAbility('manage', 'Member'),
  apiHandler((req) => inviteMember(readInvitationInput(formBody(req))), 201),
);
router.put(
  '/members/:id',
  authRequired,
  requireAbility('manage', 'Member'),
  apiHandler((req) => {
    const body = formBody(req);
    const version = body.integer('version', 0);
    const input = readMemberInput(body);

    return updateMember(uuidRouteId(req), input, version);
  }),
);
router.post(
  '/members/:id/disable',
  authRequired,
  requireAbility('manage', 'Member'),
  apiHandler((req) => disableMember(uuidRouteId(req))),
);

const auditPolicies = {
  'GET /members': { action: 'read', resourceType: 'member' },
  'POST /members/invitations': { action: 'create', resourceType: 'member' },
  'PUT /members/:id': { action: 'update', resourceType: 'member' },
  'POST /members/:id/disable': { action: 'update', resourceType: 'member' },
} satisfies RouteAuditPolicies;

export default applyAuditPolicies(router, auditPolicies);
