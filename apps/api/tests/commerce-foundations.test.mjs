import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, describe, test } from 'node:test';
import { hasAccess } from '../dist/middlewares/ability.middleware.js';
import {
  AuditLogModel,
  DomainEventModel,
  IdempotencyRecordModel,
  sequelize,
} from '../dist/sequelize/models/index.js';
import {
  enqueueEvent,
  jsonValue,
  recordAudit,
  redact,
  runIdempotent,
} from '../dist/shared/commerce/persistence.js';
import {
  assertTransition,
  assertVersion,
  canTransition,
} from '../dist/shared/commerce/transitions.js';

test('state graph and version guards reject backwards transitions', () => {
  assert.equal(canTransition('order', 'confirmed', 'processing'), true);
  assert.equal(canTransition('shipment', 'delivered', 'pending_pack'), false);
  assert.throws(
    () => assertTransition('refund', 'succeeded', 'processing'),
    (e) => e.code === 'invalid_state_transition' && e.statusCode === 409,
  );
  assert.throws(
    () => assertVersion(2, 1),
    (e) => e.code === 'version_conflict',
  );
  assert.equal(hasAccess({ id: 'u1', role: 'user' }, 'read', 'System'), false);
  assert.ok(hasAccess({ id: 'a1', role: 'admin' }, 'read', 'System'));
});

test('JSON fingerprint input is canonical and audit redaction is recursive', () => {
  assert.equal(
    JSON.stringify(jsonValue({ b: 2, a: 1 })),
    JSON.stringify(jsonValue({ a: 1, b: 2 })),
  );
  assert.deepEqual(
    redact({ email: 'private', nested: [{ passwordHash: 'private', status: 'active' }] }),
    { email: '[REDACTED]', nested: [{ passwordHash: '[REDACTED]', status: 'active' }] },
  );
  assert.throws(() => jsonValue(Infinity));
});

describe('foundation persistence against local database', {
  skip: process.env.P4_TEST_DATABASE !== 'local',
}, () => {
  const actorId = randomUUID();
  const aggregateId = randomUUID();
  const scope = 'foundation-test';
  after(async () => {
    await AuditLogModel.destroy({ where: { resourceId: aggregateId } });
    await DomainEventModel.destroy({ where: { aggregateId } });
    await IdempotencyRecordModel.destroy({ where: { scope, actorId } });
    await sequelize.close();
  });
  test('concurrent replay executes once, payload mismatch conflicts', async () => {
    let calls = 0;
    const input = { scope, actorId, key: 'concurrency-key', payload: { order: 'fixture' } };
    const work = async (transaction) => {
      calls++;
      await recordAudit(
        {
          actorId,
          action: 'test.created',
          resourceType: 'test',
          resourceId: aggregateId,
          changes: { password: 'hidden' },
        },
        transaction,
      );
      await enqueueEvent(
        { type: 'test.created', aggregateType: 'test', aggregateId, payload: { id: aggregateId } },
        transaction,
      );
      return { id: aggregateId };
    };
    const results = await Promise.all([
      runIdempotent(input, work),
      runIdempotent(input, work),
      runIdempotent(input, work),
    ]);
    assert.equal(calls, 1);
    assert.equal(results.filter((r) => !r.replayed).length, 1);
    assert.equal(await AuditLogModel.count({ where: { resourceId: aggregateId } }), 1);
    await assert.rejects(
      () => runIdempotent({ ...input, payload: { other: true } }, work),
      (e) => e.code === 'idempotency_conflict',
    );
  });
  test('failed business operation rolls back its event and audit', async () => {
    const failedId = randomUUID();
    await assert.rejects(() =>
      runIdempotent({ scope, actorId, key: 'rollback-key', payload: {} }, async (transaction) => {
        await enqueueEvent(
          { type: 'test.failed', aggregateType: 'test', aggregateId: failedId, payload: {} },
          transaction,
        );
        await recordAudit(
          { actorId, action: 'test.failed', resourceType: 'test', resourceId: failedId },
          transaction,
        );
        throw new Error('business failed');
      }),
    );
    assert.equal(await DomainEventModel.count({ where: { aggregateId: failedId } }), 0);
    assert.equal(await AuditLogModel.count({ where: { resourceId: failedId } }), 0);
    assert.equal(
      await IdempotencyRecordModel.count({ where: { scope, actorId, key: 'rollback-key' } }),
      0,
    );
  });
});
