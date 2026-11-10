import assert from 'node:assert/strict';
import { test } from 'node:test';
import { meterConsumption } from '@stay/billing';

test('mid-period replacement bills both physical meters without charging the reset', () => {
  const result = meterConsumption([
    { meterId: 'old', startReading: 1250, endReading: 1285 },
    { meterId: 'new', startReading: 5, endReading: 22 },
  ]);
  assert.equal(result.consumption, 52);
  assert.deepEqual(
    result.segments.map((segment) => segment.consumption),
    [35, 17],
  );
  assert.throws(() => meterConsumption([{ startReading: 1250, endReading: 1249 }]));
  for (const endReading of [-1, 1.5, NaN])
    assert.throws(() => meterConsumption([{ startReading: 0, endReading }]));
});
