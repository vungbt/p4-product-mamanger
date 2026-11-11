import { applyAuditPolicies, currentUser, uuidRouteId } from '@p4/server-core';
import { Router } from 'express';
import { requireScopedAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { apiHandler } from '@/shared/api-handler.js';
import { formBody } from '@/shared/input.js';
import { linkAuditPolicies } from './portal.audit.js';
import { createPortalLink, listPortalLinks, revokePortalLink } from './portal.links.js';

const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const router = Router();

// ST-25 staff side: "manage Contract" in the spec maps to `update Contract` (managers hold it in
// assigned buildings; inaccessible contracts and links are 404).
router.get(
  '/contracts/:id/portal-links',
  authRequired,
  requireScopedAbility('read', 'Contract'),
  apiHandler((req) => listPortalLinks(currentUser(req), uuidRouteId(req))),
);
router.post(
  '/contracts/:id/portal-links',
  authRequired,
  requireScopedAbility('update', 'Contract'),
  apiHandler((req) => {
    const body = formBody(req);
    const tenantId = body.text('tenantId', 36);

    body.check('tenantId', UUID_PATTERN.test(tenantId));
    body.assertValid();
    return createPortalLink(currentUser(req), uuidRouteId(req), tenantId, req.get('origin'));
  }, 201),
);
router.delete(
  '/portal-links/:id',
  authRequired,
  requireScopedAbility('update', 'Contract'),
  apiHandler((req) => revokePortalLink(currentUser(req), uuidRouteId(req))),
);

export default applyAuditPolicies(router, linkAuditPolicies);
