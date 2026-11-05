import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, describe, test } from 'node:test';
import { claimEvent, finishEvent } from '../dist/modules/jobs/jobs.service.js';
import { csvCell, reportQuery, reportRows } from '../dist/modules/reports/reports.service.js';
import { DomainEventModel, sequelize } from '../dist/sequelize/models/index.js';

test('CSV export escapes formulas/quotes and report ranges are bounded', () => {
  assert.equal(csvCell('=IMPORT("url")'), '"\'=IMPORT(""url"")"');
  assert.equal(csvCell('normal'), '"normal"');
  assert.throws(() => reportQuery({ from: '2026-01-01', to: '2026-02-01' }));
  assert.throws(() => reportQuery({ from: '2024-01-01T00:00:00Z', to: '2026-01-01T00:00:00Z' }));
});
describe('job leases and financial reports local database', {
  skip: process.env.P4_TEST_DATABASE !== 'local',
}, () => {
  const type = `test.${randomUUID()}`;
  const ids = [];
  after(async () => {
    await DomainEventModel.destroy({ where: { id: ids } });
    await sequelize.close();
  });
  test('two workers claim one event once and stale lease cannot finish it', async () => {
    const row = await DomainEventModel.create({
      id: randomUUID(),
      type,
      aggregateType: 'test',
      aggregateId: 'fixture',
      payload: {},
      status: 'pending',
      attempts: 0,
      availableAt: new Date(),
      leaseUntil: null,
      deliveredAt: null,
    });
    ids.push(row.id);
    const results = await Promise.all([
      claimEvent(new Date(), [type]),
      claimEvent(new Date(), [type]),
    ]);
    const first = results.find(Boolean);
    assert.ok(first);
    assert.equal(results.filter(Boolean).length, 1);
    await row.update({ leaseUntil: new Date(Date.now() - 1000) });
    const second = await claimEvent(new Date(), [type]);
    assert.ok(second);
    assert.notEqual(first.leaseToken, second.leaseToken);
    assert.equal(await finishEvent(first, null), false);
    assert.equal(await finishEvent(second, null), true);
    assert.equal((await row.reload()).status, 'delivered');
  });
  test('report queries aggregate ledger and balances without joining duplicate payments', async () => {
    const query = reportQuery({
      from: '2026-01-01T00:00:00Z',
      to: '2026-12-31T00:00:00Z',
      timezone: 'Asia/Ho_Chi_Minh',
    });
    for (const kind of ['sales', 'orders', 'inventory', 'products'])
      assert.ok(Array.isArray(await reportRows(kind, query)));
  });
});
