import { applyAuditPolicies, currentUser, uuidRouteId } from '@p4/server-core';
import { Router } from 'express';
import { requireAbility, requireScopedAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { apiHandler } from '@/shared/api-handler.js';
import { formBody } from '@/shared/input.js';
import {
  automationSettings,
  listNotifications,
  markNotificationRead,
  updateAutomationSettings,
} from './automation.service.js';

const router = Router();

router.get(
  '/buildings/:id/automation',
  authRequired,
  requireScopedAbility('read', 'Building'),
  apiHandler((req) => automationSettings(currentUser(req), uuidRouteId(req))),
);
router.put(
  '/buildings/:id/automation',
  authRequired,
  requireAbility('manage', 'Building'),
  apiHandler((req) => {
    const body = formBody(req);
    const input = {
      readingReminder: body.boolean('readingReminder'),
      createDrafts: body.boolean('createDrafts'),
      beforeDue: body.boolean('beforeDue'),
      afterDue: body.boolean('afterDue'),
      tenantRemindersDisabled: body.boolean('tenantRemindersDisabled'),
      version: body.integer('version', 1),
    };
    body.assertValid();
    return updateAutomationSettings(currentUser(req), uuidRouteId(req), input);
  }),
);
router.get(
  '/notifications',
  authRequired,
  requireScopedAbility('read', 'Building'),
  apiHandler((req) => listNotifications(currentUser(req))),
);
router.post(
  '/notifications/:id/read',
  authRequired,
  requireScopedAbility('read', 'Building'),
  apiHandler((req) => markNotificationRead(currentUser(req), uuidRouteId(req))),
);

export default applyAuditPolicies(router, {
  'GET /buildings/:id/automation': { action: 'read', resourceType: 'building_automation' },
  'PUT /buildings/:id/automation': { action: 'update', resourceType: 'building_automation' },
  'GET /notifications': { action: 'read', resourceType: 'notification' },
  'POST /notifications/:id/read': { action: 'update', resourceType: 'notification' },
});
