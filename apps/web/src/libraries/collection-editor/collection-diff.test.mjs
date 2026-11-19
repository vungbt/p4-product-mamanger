import assert from 'node:assert/strict';
import { test } from 'node:test';
import { collectionDiff } from './collection-diff.ts';

// A second domain uses numeric IDs, custom keys and optimistic update versions.
const baseline = [{ id: 0, name: 'Original', version: 4 }];
const row = { key: 'stable', id: 0, name: 'Original', removed: false };
const draft = { key: 'draft', name: 'New', removed: false };
const config = {
  path: 'children',
  rowKey: (value) => value.key,
  rowId: (value) => value.id,
  baselineId: (value) => value.id,
  isRemoved: (value) => value.removed,
  create: (value) => ({ name: value.name }),
  update: (value, previous) =>
    value.name === previous.name
      ? undefined
      : { id: previous.id, expectedVersion: previous.version, name: value.name },
};

const diff = (rows) => collectionDiff(rows, baseline, config);

test('unchanged collections generate no writes', () => {
  assert.deepEqual(diff([row]), {
    changes: { create: [], update: [], delete: [] },
    paths: {},
    changed: false,
  });
});
test('creates map stable keys to create payload paths', () => {
  assert.deepEqual(diff([draft]).changes.create, [{ name: 'New' }]);
  assert.equal(diff([draft]).paths['children.create.0'], 'draft');
});
test('updates use the caller payload and baseline version', () => {
  assert.deepEqual(diff([{ ...row, name: 'Edited' }]).changes.update, [
    { id: 0, expectedVersion: 4, name: 'Edited' },
  ]);
});
test('deletion accepts a zero ID', () => {
  assert.deepEqual(diff([{ ...row, removed: true }]).changes.delete, [0]);
});
test('removed drafts produce no payload or field paths', () => {
  assert.equal(diff([{ ...draft, removed: true }]).changed, false);
  assert.deepEqual(diff([{ ...draft, removed: true }]).paths, {});
});
test('undo restores an unchanged collection', () => {
  const removed = { ...row, removed: true };
  assert.equal(diff([removed]).changed, true);
  assert.equal(diff([{ ...removed, removed: false }]).changed, false);
});
test('mixed writes maintain independent batch indices after row reordering', () => {
  const result = diff([
    { ...draft, key: 'first' },
    { ...row, name: 'Edited' },
    { ...draft, key: 'second' },
  ]);
  assert.deepEqual(result.paths, {
    'children.create.0': 'first',
    'children.update.0': 'stable',
    'children.create.1': 'second',
  });
});
test('an ID missing from the baseline is treated as a create', () => {
  assert.deepEqual(diff([{ ...draft, id: 7 }]).changes, {
    create: [{ name: 'New' }],
    update: [],
    delete: [],
  });
});
