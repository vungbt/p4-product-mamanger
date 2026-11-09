import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ANY_ACTION, ANY_SUBJECT, createAbilityKit } from '@p4/ability/core';
import { createAbilityGuards } from '../dist/index.js';
import { Forbidden, Unauthorized } from '../dist/shared/index.js';

const kit = createAbilityKit({
  actions: ['read', 'update'],
  subjects: ['Room', 'Settings'],
  define({ can }, user) {
    if (user.role === 'owner') can(ANY_ACTION, ANY_SUBJECT);
    if (user.role === 'manager')
      can(['read', 'update'], 'Room', { buildingId: { $in: user.buildingIds } });
  },
});

const guards = createAbilityGuards(kit, { getUser: (req) => req.user });
const owner = { id: 'o', role: 'owner' };
const manager = { id: 'm', role: 'manager', buildingIds: ['b-1'] };

function run(middleware, user) {
  let result;
  middleware({ user }, {}, (error) => {
    result = error ?? 'next';
  });
  return result;
}

test('requireAbility needs unconditional access and carries OpenAPI metadata', () => {
  const guard = guards.requireAbility('read', 'Room');

  assert.equal(guard.requiredAbility, 'read:Room');
  assert.equal(run(guard, owner), 'next');
  assert.ok(run(guard, manager) instanceof Forbidden);
  assert.ok(run(guard, undefined) instanceof Unauthorized);
});

test('record checks honour conditions; hasAccess ignores them', () => {
  assert.equal(guards.hasAccess(manager, 'read', 'Room'), false);
  assert.ok(guards.canAccessRecord(manager, 'update', 'Room', { buildingId: 'b-1' }));
  assert.equal(guards.canAccessRecord(manager, 'update', 'Room', { buildingId: 'b-2' }), false);
  assert.throws(
    () => guards.assertCanAccessRecord(manager, 'read', 'Room', { buildingId: 'b-2' }),
    Forbidden,
  );
  assert.throws(() => guards.assertAccess(manager, 'read', 'Settings'), Forbidden);
  assert.equal(guards.abilityOf(owner), guards.abilityOf(owner));
});
