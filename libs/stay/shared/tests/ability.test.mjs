import assert from 'node:assert/strict';
import { test } from 'node:test';
import { stayAbilityKit as kit, STAY_ACTIONS, STAY_SUBJECTS } from '../dist/index.js';

const owner = { id: 'owner-1', role: 'owner' };
const manager = { id: 'manager-1', role: 'manager', buildingIds: ['b-1', 'b-2'] };
const tenant = { id: 'tenant-1', role: 'tenant', contractIds: ['c-1'] };

test('owner has every action on every subject', () => {
  const ability = kit.defineAbilityFor(owner);

  for (const action of STAY_ACTIONS) {
    for (const subject of STAY_SUBJECTS) {
      assert.ok(kit.canAccess(ability, action, subject), `${action} ${subject}`);
      assert.ok(kit.canOn(ability, action, subject, { buildingId: 'b-9' }), `${action} ${subject}`);
    }
  }
});

test('manager acts only inside assigned buildings', () => {
  const ability = kit.defineAbilityFor(manager);

  assert.ok(kit.canOn(ability, 'update', 'Room', { buildingId: 'b-1' }));
  assert.ok(kit.canOn(ability, 'issue', 'Invoice', { buildingId: 'b-2' }));
  assert.ok(kit.canOn(ability, 'read', 'Building', { buildingId: 'b-1' }));
  assert.ok(kit.canOn(ability, 'read', 'Report', { buildingId: 'b-1' }));
  assert.equal(kit.canOn(ability, 'update', 'Room', { buildingId: 'b-3' }), false);
  assert.equal(kit.canOn(ability, 'read', 'Invoice', { buildingId: 'b-3' }), false);
  assert.equal(kit.canOn(ability, 'read', 'Invoice', {}), false);
  assert.equal(kit.canOn(ability, 'delete', 'Building', { buildingId: 'b-1' }), false);
});

test('manager never gets Settings, Member, void or settle', () => {
  const ability = kit.defineAbilityFor(manager);
  const record = { buildingId: 'b-1' };

  for (const action of STAY_ACTIONS) {
    assert.equal(kit.canOn(ability, action, 'Settings', record), false, `${action} Settings`);
    assert.equal(kit.canOn(ability, action, 'Member', record), false, `${action} Member`);
  }
  for (const subject of STAY_SUBJECTS) {
    assert.equal(kit.canOn(ability, 'void', subject, record), false, `void ${subject}`);
    assert.equal(kit.canOn(ability, 'settle', subject, record), false, `settle ${subject}`);
  }
});

test('canAccess ignores conditional rules', () => {
  for (const user of [manager, tenant]) {
    const ability = kit.defineAbilityFor(user);

    for (const action of STAY_ACTIONS) {
      for (const subject of STAY_SUBJECTS) {
        assert.equal(kit.canAccess(ability, action, subject), false, `${action} ${subject}`);
      }
    }
  }
  // CASL itself passes on a subject type with conditional rules; canAccess must not.
  assert.ok(kit.defineAbilityFor(manager).can('read', 'Room'));
});

test('tenant reads own contract data and reports maintenance', () => {
  const ability = kit.defineAbilityFor(tenant);
  const own = { buildingId: 'b-1', contractId: 'c-1' };
  const other = { buildingId: 'b-1', contractId: 'c-2' };

  for (const subject of ['Contract', 'Invoice', 'MeterReading']) {
    assert.ok(kit.canOn(ability, 'read', subject, own), subject);
    assert.equal(kit.canOn(ability, 'read', subject, other), false, subject);
    assert.equal(kit.canOn(ability, 'update', subject, own), false, subject);
  }
  assert.ok(kit.canOn(ability, 'create', 'Maintenance', own));
  assert.equal(kit.canOn(ability, 'create', 'Maintenance', other), false);
  assert.equal(kit.canOn(ability, 'read', 'Tenant', own), false);
  assert.equal(kit.canOn(ability, 'read', 'Payment', own), false);
});

test('serialized rules rebuild the same ability on clients', () => {
  const server = kit.defineAbilityFor(manager);
  const client = kit.createAppAbility(JSON.parse(JSON.stringify(kit.abilityRules(server))));

  for (const buildingId of ['b-1', 'b-3']) {
    for (const action of STAY_ACTIONS) {
      assert.equal(
        kit.canOn(client, action, 'Invoice', { buildingId }),
        kit.canOn(server, action, 'Invoice', { buildingId }),
        `${action} Invoice ${buildingId}`,
      );
    }
  }
});

test('permission groups restrict writes and never permit building prices, void or settlement', () => {
  const ability = kit.defineAbilityFor({ ...manager, permissionGroups: ['readings', 'payments'] });
  const record = { buildingId: 'b-1' };

  assert.ok(kit.canOn(ability, 'update', 'MeterReading', record));
  assert.ok(kit.canOn(ability, 'create', 'Payment', record));
  for (const [action, subject] of [
    ['update', 'Building'],
    ['create', 'Invoice'],
    ['issue', 'Invoice'],
    ['update', 'Contract'],
    ['void', 'Invoice'],
    ['settle', 'Contract'],
  ])
    assert.equal(kit.canOn(ability, action, subject, record), false, `${action} ${subject}`);
  const readOnly = kit.defineAbilityFor({ ...manager, permissionGroups: [] });

  for (const subject of STAY_SUBJECTS) {
    for (const action of STAY_ACTIONS.filter((value) => value !== 'read'))
      assert.equal(kit.canOn(readOnly, action, subject, record), false, `${action} ${subject}`);
  }
  assert.equal(kit.canOn(ability, 'update', 'MeterReading', { buildingId: 'b-3' }), false);
});
