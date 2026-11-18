import {
  applyAuditPolicies,
  currentUser,
  queryText,
  type RouteAuditPolicies,
  uuidQueryRule,
  uuidRouteId,
  validateListQuery,
} from '@p4/server-core';
import { ANNOUNCEMENT_STATUSES } from '@stay/shared';
import { Router } from 'express';
import { requireScopedAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { formBody } from '@/shared/input.js';
import { readAnnouncementInput } from '../requests/requests.input.js';
import {
  type AnnouncementListQuery,
  type AnnouncementSortField,
  archiveAnnouncement,
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement,
} from './announcements.service.js';

const router = Router();
const sortFields: AnnouncementSortField[] = ['createdAt', 'expiresAt'];
const announcementQuery = validateListQuery({
  sortFields,
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  rules: () => ({
    buildingId: uuidQueryRule,
    status: `sometimes|required|in:${ANNOUNCEMENT_STATUSES.join(',')}`,
  }),
  normalize: (query, base): AnnouncementListQuery => ({
    ...base,
    buildingId: queryText(query, 'buildingId'),
    status: ANNOUNCEMENT_STATUSES.find((status) => status === queryText(query, 'status')) ?? 'all',
  }),
});

// O-32: "manage Building" maps to `update Building` (owner; managers in assigned buildings).
router.get(
  '/announcements',
  authRequired,
  requireScopedAbility('update', 'Building'),
  announcementQuery,
  listHandler((req, query: AnnouncementListQuery) => listAnnouncements(currentUser(req), query)),
);
router.post(
  '/announcements',
  authRequired,
  requireScopedAbility('update', 'Building'),
  apiHandler(
    (req) => createAnnouncement(currentUser(req), readAnnouncementInput(formBody(req))),
    201,
  ),
);
router.put(
  '/announcements/:id',
  authRequired,
  requireScopedAbility('update', 'Building'),
  apiHandler((req) => {
    const body = formBody(req);
    const version = body.integer('version', 1);
    const input = readAnnouncementInput(body);

    return updateAnnouncement(currentUser(req), uuidRouteId(req), input, version);
  }),
);
router.post(
  '/announcements/:id/archive',
  authRequired,
  requireScopedAbility('update', 'Building'),
  apiHandler((req) => archiveAnnouncement(currentUser(req), uuidRouteId(req))),
);
router.delete(
  '/announcements/:id',
  authRequired,
  requireScopedAbility('update', 'Building'),
  apiHandler((req) => deleteAnnouncement(currentUser(req), uuidRouteId(req))),
);

/** Writes record `announcement.*` rows with ids, targeting, pin and expiry (no text). */
const auditPolicies = {
  'GET /announcements': { action: 'read', resourceType: 'announcement' },
  'POST /announcements': { action: 'create', resourceType: 'announcement' },
  'PUT /announcements/:id': { action: 'update', resourceType: 'announcement' },
  'POST /announcements/:id/archive': { action: 'archive', resourceType: 'announcement' },
  'DELETE /announcements/:id': { action: 'delete', resourceType: 'announcement' },
} satisfies RouteAuditPolicies;

export default applyAuditPolicies(router, auditPolicies);
