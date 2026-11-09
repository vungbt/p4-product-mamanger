import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ANY_ACTION, ANY_SUBJECT, createAbilityKit } from '../dist/core/index.js';

// Stay-like fixture: not the real Stay definitions, only the shape a second app uses.
const ACTIONS = ['read', 'write', 'manage'];
const SUBJECTS = ['Building', 'Room', 'Invoice', 'Settings'];

const kit = createAbilityKit({
  actions: ACTIONS,
  subjects: SUBJECTS,
  define({ can }, user) {
    if (user.role === 'owner') can(ANY_ACTION, ANY_SUBJECT);
    if (user.role === 'manager') {
      const assigned = { buildingId: { $in: user.buildingIds } };

      can('read', 'Building', { id: { $in: user.buildingIds } });
      can(['read', 'write'], ['Room', 'Invoice'], assigned);
    }
  },
});

const owner = { id: 'owner-1', role: 'owner' };
const manager = { id: 'manager-1', role: 'manager', buildingIds: ['b-1', 'b-2'] };

test('owner has every access', () => {
  const ability = kit.defineAbilityFor(owner);

  for (const action of ACTIONS) {
    for (const subject of SUBJECTS) {
      assert.ok(kit.canAccess(ability, action, subject), `${action} ${subject}`);
      assert.ok(kit.canOn(ability, action, subject, { buildingId: 'b-9' }), `${action} ${subject}`);
    }
  }
});

test('manager acts only on assigned buildings', () => {
  const ability = kit.defineAbilityFor(manager);

  assert.ok(kit.canOn(ability, 'write', 'Invoice', { buildingId: 'b-1' }));
  assert.ok(kit.canOn(ability, 'read', 'Room', { buildingId: 'b-2' }));
  assert.ok(kit.canOn(ability, 'read', 'Building', { id: 'b-1' }));
  assert.equal(kit.canOn(ability, 'write', 'Invoice', { buildingId: 'b-3' }), false);
  assert.equal(kit.canOn(ability, 'read', 'Building', { id: 'b-3' }), false);
  assert.equal(kit.canOn(ability, 'manage', 'Invoice', { buildingId: 'b-1' }), false);
  assert.equal(kit.canOn(ability, 'read', 'Settings', { buildingId: 'b-1' }), false);
});

test('canAccess ignores conditional rules', () => {
  const ability = kit.defineAbilityFor(manager);

  for (const action of ACTIONS) {
    for (const subject of SUBJECTS) {
      assert.equal(kit.canAccess(ability, action, subject), false, `${action} ${subject}`);
    }
  }
  // CASL itself passes on a subject type with conditional rules; canAccess must not.
  assert.ok(ability.can('read', 'Room'));
});

test('a conditional cannot denies unconditional access', () => {
  const ability = kit.createAppAbility([
    { action: '*', subject: 'all' },
    { action: 'write', subject: 'Invoice', conditions: { buildingId: 'b-1' }, inverted: true },
  ]);

  assert.equal(kit.canAccess(ability, 'write', 'Invoice'), false);
  assert.ok(kit.canAccess(ability, 'read', 'Invoice'));
  assert.equal(kit.canOn(ability, 'write', 'Invoice', { buildingId: 'b-1' }), false);
  assert.ok(kit.canOn(ability, 'write', 'Invoice', { buildingId: 'b-2' }));
});

test('serialized rules rebuild the same ability on clients', () => {
  const server = kit.defineAbilityFor(manager);
  const client = kit.createAppAbility(JSON.parse(JSON.stringify(kit.abilityRules(server))));

  for (const buildingId of ['b-1', 'b-2', 'b-3']) {
    for (const action of ACTIONS) {
      assert.equal(
        kit.canOn(client, action, 'Invoice', { buildingId }),
        kit.canOn(server, action, 'Invoice', { buildingId }),
        `${action} Invoice ${buildingId}`,
      );
    }
  }
  assert.equal(kit.canAccess(client, 'read', 'Room'), false);
});

test('no rules means no access, and records are not mutated', () => {
  const ability = kit.createAppAbility();
  const record = { buildingId: 'b-1' };

  assert.equal(kit.canAccess(ability, 'read', 'Building'), false);
  assert.equal(kit.canOn(ability, 'read', 'Room', record), false);
  assert.deepEqual(Object.keys(record), ['buildingId']);
});

test('rulesFrom collects a partial definition', () => {
  const rules = kit.rulesFrom(({ can }) => can('read', 'Settings'));

  assert.deepEqual(rules, [{ action: 'read', subject: 'Settings' }]);
  assert.ok(kit.canAccess(kit.createAppAbility(rules), 'read', 'Settings'));
});
