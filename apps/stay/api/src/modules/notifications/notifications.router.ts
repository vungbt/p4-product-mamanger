import {
  applyAuditPolicies,
  currentUser,
  type RouteAuditPolicies,
  uuidRouteId,
} from '@p4/server-core';
import {
  NOTIFICATION_GROUPS,
  type NotificationGroup,
  type NotificationPreferences,
  type PushSubscriptionInput,
} from '@stay/shared';
import { type Request, Router } from 'express';
import { accessibleBuildingIds, requireScopedAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { apiHandler } from '@/shared/api-handler.js';
import { formBody } from '@/shared/input.js';
import { portalOf, portalSessionRequired } from '../portal/portal.session.js';
import {
  listPortalNotifications,
  markPortalNotificationRead,
  portalNotificationSettings,
  staffNotificationSettings,
  subscribePortalPush,
  subscribeStaffPush,
  unsubscribePortalPush,
  unsubscribeStaffPush,
  updatePortalPreferences,
  updateStaffPreferences,
} from './notifications.service.js';
import { streamHandler } from './notifications.stream.js';

/**
 * Hosts of the browsers' push services. The worker POSTs to the endpoint, so an arbitrary URL
 * would let a client make the server call internal addresses.
 */
const PUSH_HOSTS = [
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  'push.services.mozilla.com',
  'notify.windows.com',
  'push.apple.com',
];

function isPushEndpoint(value: string): boolean {
  try {
    const url = new URL(value);

    return (
      url.protocol === 'https:' &&
      !url.port &&
      PUSH_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))
    );
  } catch {
    return false;
  }
}

const isGroup = (value: unknown): value is NotificationGroup =>
  NOTIFICATION_GROUPS.some((group) => group === value);

function readPreferences(req: Request): NotificationPreferences {
  const body = formBody(req);
  const muted = body.data.mutedGroups;
  const input = {
    email: body.boolean('email'),
    push: body.boolean('push'),
    mutedGroups: Array.isArray(muted) ? muted.filter(isGroup) : [],
  };

  body.check(
    'mutedGroups',
    Array.isArray(muted) && muted.length <= NOTIFICATION_GROUPS.length && muted.every(isGroup),
  );
  body.assertValid();
  return input;
}

const BASE64URL = /^[A-Za-z0-9_-]+={0,2}$/;

function readSubscription(req: Request): PushSubscriptionInput {
  const body = formBody(req);
  const endpoint = body.text('endpoint', 2048);
  const keys = body.data.keys;
  const p256dh = keys && typeof keys === 'object' && 'p256dh' in keys ? keys.p256dh : undefined;
  const auth = keys && typeof keys === 'object' && 'auth' in keys ? keys.auth : undefined;

  body.check('endpoint', isPushEndpoint(endpoint));
  body.check(
    'keys',
    typeof p256dh === 'string' &&
      typeof auth === 'string' &&
      p256dh.length <= 200 &&
      auth.length <= 100 &&
      BASE64URL.test(p256dh) &&
      BASE64URL.test(auth),
  );
  body.assertValid();
  return { endpoint, keys: { p256dh: String(p256dh), auth: String(auth) } };
}

function readEndpoint(req: Request): string {
  const body = formBody(req);
  const endpoint = body.text('endpoint', 2048);

  body.assertValid();
  return endpoint;
}

const router = Router();

/* Staff ------------------------------------------------------------------- */

router.get(
  '/notifications/stream',
  authRequired,
  requireScopedAbility('read', 'Building'),
  streamHandler((req) => {
    const ids = accessibleBuildingIds(currentUser(req), 'read');

    return (signal) =>
      signal.audience === 'staff' && (ids === 'all' || ids.includes(signal.buildingId));
  }),
);
router.get(
  '/me/notification-settings',
  authRequired,
  apiHandler((req) => staffNotificationSettings(currentUser(req))),
);
router.put(
  '/me/notification-settings',
  authRequired,
  apiHandler((req) => updateStaffPreferences(currentUser(req), readPreferences(req))),
);
router.post(
  '/me/push-subscriptions',
  authRequired,
  apiHandler(
    (req) => subscribeStaffPush(currentUser(req), readSubscription(req), req.get('user-agent')),
    201,
  ),
);
router.delete(
  '/me/push-subscriptions',
  authRequired,
  apiHandler((req) => unsubscribeStaffPush(currentUser(req), readEndpoint(req))),
);

/* Tenant portal (cookie path /api/portal) ---------------------------------- */

router.get(
  '/portal/notifications',
  portalSessionRequired,
  apiHandler((req) => listPortalNotifications(portalOf(req))),
);
router.post(
  '/portal/notifications/:id/read',
  portalSessionRequired,
  apiHandler((req) => markPortalNotificationRead(portalOf(req), uuidRouteId(req))),
);
router.get(
  '/portal/notifications/stream',
  portalSessionRequired,
  streamHandler((req) => {
    const portal = portalOf(req);

    return (signal) =>
      signal.audience === 'tenant' &&
      signal.contractId === portal.contractId &&
      (signal.tenantId === null || signal.tenantId === portal.tenantId);
  }),
);
router.get(
  '/portal/notification-settings',
  portalSessionRequired,
  apiHandler((req) => portalNotificationSettings(portalOf(req))),
);
router.put(
  '/portal/notification-settings',
  portalSessionRequired,
  apiHandler((req) => updatePortalPreferences(portalOf(req), readPreferences(req))),
);
router.post(
  '/portal/push-subscriptions',
  portalSessionRequired,
  apiHandler(
    (req) => subscribePortalPush(portalOf(req), readSubscription(req), req.get('user-agent')),
    201,
  ),
);
router.delete(
  '/portal/push-subscriptions',
  portalSessionRequired,
  apiHandler((req) => unsubscribePortalPush(portalOf(req), readEndpoint(req))),
);

/** Settings and subscriptions record ids and flags only (never endpoints or keys). */
const auditPolicies = {
  'GET /notifications/stream': { action: 'read', resourceType: 'notification' },
  'GET /me/notification-settings': { action: 'read', resourceType: 'notification_preference' },
  'PUT /me/notification-settings': { action: 'update', resourceType: 'notification_preference' },
  'POST /me/push-subscriptions': { action: 'create', resourceType: 'push_subscription' },
  'DELETE /me/push-subscriptions': { action: 'delete', resourceType: 'push_subscription' },
  'GET /portal/notifications': { action: 'read', resourceType: 'tenant_portal' },
  'POST /portal/notifications/:id/read': { action: 'update', resourceType: 'notification' },
  'GET /portal/notifications/stream': { action: 'read', resourceType: 'tenant_portal' },
  'GET /portal/notification-settings': { action: 'read', resourceType: 'notification_preference' },
  'PUT /portal/notification-settings': {
    action: 'update',
    resourceType: 'notification_preference',
  },
  'POST /portal/push-subscriptions': { action: 'create', resourceType: 'push_subscription' },
  'DELETE /portal/push-subscriptions': { action: 'delete', resourceType: 'push_subscription' },
} satisfies RouteAuditPolicies;

export default applyAuditPolicies(router, auditPolicies);
