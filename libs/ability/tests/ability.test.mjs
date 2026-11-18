import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  abilityRules,
  canAccess,
  canOn,
  createAppAbility,
  defineAbilityFor,
  rulesForStaffRole,
} from '../dist/shared/index.js';

// Snapshot of the former `STAFF_PERMISSIONS` table (`permission.middleware.ts`).
const LEGACY_PERMISSIONS = [
  'system:read',
  'system:manage',
  'staff:read',
  'staff:manage',
  'customer:read',
  'customer:manage',
  'audit:read',
  'catalog:read',
  'catalog:write',
  'inventory:read',
  'inventory:write',
  'settings:manage',
  'promotion:read',
  'promotion:write',
  'order:read',
  'order:manage',
  'payment:read',
  'payment:manage',
  'fulfillment:read',
  'fulfillment:manage',
  'return:read',
  'return:manage',
  'refund:read',
  'refund:manage',
  'review:read',
  'review:moderate',
  'review:reply',
  'content:read',
  'content:write',
  'content:publish',
  'support:read',
  'support:manage',
  'notification:read',
  'notification:manage',
  'report:read',
  'report:export',
];
const LEGACY_STAFF_PERMISSIONS = {
  owner: LEGACY_PERMISSIONS,
  administrator: LEGACY_PERMISSIONS.filter((p) => !['system:manage', 'staff:manage'].includes(p)),
  catalog: [
    'catalog:read',
    'catalog:write',
    'inventory:read',
    'inventory:write',
    'promotion:read',
    'promotion:write',
    'review:read',
  ],
  content: ['content:read', 'content:write', 'content:publish', 'catalog:read'],
  support: [
    'customer:read',
    'order:read',
    'return:read',
    'review:read',
    'review:reply',
    'support:read',
    'support:manage',
  ],
  fulfillment: ['order:read', 'fulfillment:read', 'fulfillment:manage', 'inventory:read'],
};
const SUBJECTS = { audit: 'AuditLog' };

function toCheck(permission) {
  const [resource, action] = permission.split(':');
  const subject = SUBJECTS[resource] ?? resource[0].toUpperCase() + resource.slice(1);
  return [action, subject];
}

const staff = (staffRole) => ({ id: `staff-${staffRole}`, role: 'admin', staffRole });
const customer = { id: 'customer-1', role: 'user' };

test('every staff role keeps exactly its legacy permissions', () => {
  for (const [role, granted] of Object.entries(LEGACY_STAFF_PERMISSIONS)) {
    const ability = defineAbilityFor(staff(role));
    for (const permission of LEGACY_PERMISSIONS) {
      const [action, subject] = toCheck(permission);
      assert.equal(
        canAccess(ability, action, subject),
        granted.includes(permission),
        `${role} → ${permission}`,
      );
    }
  }
});

test('an admin without a staff role is an owner', () => {
  const ability = defineAbilityFor({ id: 'a', role: 'admin', staffRole: null });
  assert.ok(canAccess(ability, 'manage', 'System'));
});

test('customers have no unconditional access', () => {
  const ability = defineAbilityFor(customer);
  for (const permission of LEGACY_PERMISSIONS) {
    const [action, subject] = toCheck(permission);
    assert.equal(canAccess(ability, action, subject), false, permission);
  }
});

test('owner rules allow only the owner record', () => {
  const ability = defineAbilityFor(customer);
  const own = { userId: customer.id };
  const other = { userId: 'someone-else' };

  for (const [action, subject] of [
    ['read', 'Order'],
    ['manage', 'Order'],
    ['manage', 'Payment'],
    ['read', 'Return'],
    ['read', 'Refund'],
    ['read', 'Support'],
    ['manage', 'Support'],
    ['moderate', 'Review'],
  ]) {
    assert.ok(canOn(ability, action, subject, own), `${action} own ${subject}`);
    assert.equal(canOn(ability, action, subject, other), false, `${action} other ${subject}`);
  }
  assert.equal(canOn(ability, 'manage', 'Return', own), false);
  assert.equal(canOn(ability, 'reply', 'Review', own), false);
});

test('staff access applies to records of other users', () => {
  const ability = defineAbilityFor(staff('support'));
  assert.ok(canOn(ability, 'read', 'Order', { userId: 'customer-1' }));
  assert.equal(canOn(ability, 'manage', 'Order', { userId: 'customer-1' }), false);
});

test('serialized rules rebuild the same ability on clients', () => {
  const server = defineAbilityFor(staff('catalog'));
  const client = createAppAbility(JSON.parse(JSON.stringify(abilityRules(server))));

  assert.ok(canAccess(client, 'write', 'Catalog'));
  assert.equal(canAccess(client, 'read', 'Order'), false);
  assert.ok(canOn(client, 'read', 'Order', { userId: 'staff-catalog' }));
});

test('role listings expose only unconditional staff rules', () => {
  const rules = rulesForStaffRole('administrator');
  assert.ok(rules.every((rule) => !rule.conditions));
  assert.ok(canAccess(createAppAbility(rules), 'read', 'System'));
  assert.equal(canAccess(createAppAbility(rules), 'manage', 'System'), false);
});
