import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Op, Sequelize } from 'sequelize';
import { accessibleWhere, conditionWhere } from '../dist/middlewares/accessible-where.js';

const manager = {
  id: 'm',
  role: 'manager',
  buildingIds: ['a'],
  contractIds: [],
  permissionGroups: ['readings', 'payments'],
};

const sql = (where) =>
  new Sequelize('postgres://unused:unused@localhost/unused', { logging: false })
    .getQueryInterface()
    .queryGenerator.whereItemsQuery(where);

test('CASL SQL scopes assigned buildings, aliases building ids, and denies absent grants', () => {
  assert.match(sql(accessibleWhere(manager, 'read', 'Room')), /"buildingId" IN \('a'\)/);
  assert.match(
    sql(accessibleWhere(manager, 'read', 'Building', { buildingId: 'id' })),
    /"id" IN \('a'\)/,
  );
  assert.equal(sql(accessibleWhere({ ...manager, role: 'owner' }, 'manage', 'Member')), '');
  assert.match(sql(accessibleWhere(manager, 'void', 'Invoice')), /"id" IN \(NULL\)/);
  assert.match(
    sql(accessibleWhere({ ...manager, buildingIds: [] }, 'read', 'Room')),
    /"buildingId" IN \(NULL\)/,
  );
});

test('eq, in and logical junctions translate, unsupported operators and malformed operands fail closed', () => {
  assert.deepEqual(conditionWhere({ buildingId: { $eq: 'a' } }, { buildingId: 'id' }), {
    [Op.and]: [{ id: { [Op.eq]: 'a' } }],
  });
  assert.deepEqual(
    conditionWhere(
      { $or: [{ buildingId: 'a' }, { buildingId: { $in: ['b'] } }] },
      { buildingId: 'id' },
    ),
    {
      [Op.and]: [
        { [Op.or]: [{ [Op.and]: [{ id: 'a' }] }, { [Op.and]: [{ id: { [Op.in]: ['b'] } }] }] },
      ],
    },
  );
  for (const condition of [
    { buildingId: { $ne: 'b' } },
    { buildingId: {} },
    { buildingId: { $in: [1] } },
    { ownerId: 'a' },
    { $not: {} },
    { $or: {} },
    null,
  ])
    assert.throws(() => conditionWhere(condition, { buildingId: 'id' }));
});
