import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  customVariantColor,
  ensureRowDefault,
  matchVariantColor,
  saveVariantRow,
  toggleVariantRemoval,
  variantDiff,
  variantRows,
} from './variant-diff.ts';

const baseline = [
  {
    id: 'existing',
    version: 3,
    sku: 'SHIRT-M-RED',
    barcode: null,
    size: 'M',
    color: 'red',
    price: 100,
    status: 'active',
    isDefault: true,
    imageIds: ['image'],
  },
];

test('unchanged rows generate no writes; edits send only changed fields and no stock or image overwrites', () => {
  const rows = variantRows(baseline);
  assert.deepEqual(variantDiff(rows, baseline).changes, { create: [], update: [], delete: [] });
  rows[0].price = 120;
  rows[0].stock = 99;
  const diff = variantDiff(rows, baseline);
  assert.deepEqual(diff.changes.update, [{ id: 'existing', expectedVersion: 3, price: 120 }]);
  assert.equal(diff.paths['variants.update.0'], 'existing');
});

test('removed existing rows are deleted, removed drafts are omitted, and undo restores the baseline', () => {
  const rows = variantRows(baseline);
  const draft = {
    ...rows[0],
    key: 'draft',
    id: undefined,
    sku: 'SHIRT-L-RED',
    size: 'L',
    removed: true,
  };
  rows[0].removed = true;
  const removed = variantDiff([...rows, draft], baseline);
  assert.deepEqual(removed.changes, { create: [], update: [], delete: ['existing'] });
  assert.equal(removed.paths['variants.delete.0'], 'existing');
  rows[0].removed = false;
  assert.deepEqual(variantDiff([...rows, draft], baseline).changes, {
    create: [],
    update: [],
    delete: [],
  });
});

test('row keys map batch indices to the correct new or changed row after deletions', () => {
  const rows = variantRows(baseline);
  rows[0].sku = 'CUSTOM';
  const draft = {
    ...rows[0],
    key: 'new-row',
    id: undefined,
    sku: 'SHIRT-L-RED',
    size: 'L',
    stock: 4,
  };
  const diff = variantDiff([draft, rows[0]], baseline);
  assert.equal(diff.paths['variants.create.0'], 'new-row');
  assert.equal(diff.paths['variants.update.0'], 'existing');
  assert.deepEqual(diff.changes.create, [
    {
      sku: 'SHIRT-L-RED',
      barcode: null,
      size: 'L',
      color: 'red',
      price: 100,
      stock: 4,
      status: 'active',
      isDefault: true,
      imageStorageIds: [],
    },
  ]);
});

test('removing, deactivating and undoing rows retain exactly one selectable active default', () => {
  const first = variantRows(baseline)[0];
  const second = { ...first, key: 'second', id: 'second', sku: 'SECOND', isDefault: false };
  const removed = ensureRowDefault([{ ...first, removed: true }, second]);
  assert.deepEqual(
    removed.map((row) => row.isDefault),
    [false, true],
  );
  const restored = ensureRowDefault([{ ...removed[0], removed: false }, removed[1]]);
  assert.deepEqual(
    restored.map((row) => row.isDefault),
    [false, true],
  );
  const deactivated = ensureRowDefault([restored[0], { ...restored[1], status: 'inactive' }]);
  assert.deepEqual(
    deactivated.map((row) => row.isDefault),
    [true, false],
  );
});

test('SKU images retain independent uploads and emit only ordered image changes', () => {
  const previous = [
    { ...baseline[0], images: [{ fileId: 'file', storageId: 'saved', url: '/saved' }] },
  ];
  const rows = variantRows(previous);
  assert.deepEqual(rows[0].images, [{ storageId: 'saved', url: '/saved' }]);
  assert.equal(variantDiff(rows, previous).changed, false);
  rows[0].images = [{ storageId: 'new', url: '/new' }, ...rows[0].images];
  assert.deepEqual(variantDiff(rows, previous).changes.update, [
    { id: 'existing', expectedVersion: 3, imageStorageIds: ['new', 'saved'] },
  ]);
  rows[0].images = [];
  assert.deepEqual(variantDiff(rows, previous).changes.update[0].imageStorageIds, []);
});

const colors = [
  { value: 'Đen', label: 'Black', color: '#000000' },
  { value: 'Trắng', label: 'White', color: '#FFFFFF' },
];

test('stored colour names match palette values and labels regardless of case or diacritics', () => {
  for (const value of ['Đen', 'đen', 'DEN', ' den ', 'BLACK', 'black']) {
    assert.equal(matchVariantColor(value, colors), colors[0]);
  }
  assert.equal(matchVariantColor('TRANG', colors), colors[1]);
  assert.equal(matchVariantColor('Tra\u0306\u0301ng', colors), colors[1]);
  assert.equal(matchVariantColor('Custom blue', colors), undefined);
  assert.deepEqual(customVariantColor('#12AbEF'), {
    value: '#12AbEF',
    label: '#12AbEF',
    color: '#12AbEF',
  });
  assert.deepEqual(customVariantColor('Custom blue'), {
    value: 'Custom blue',
    label: 'Custom blue',
    color: 'var(--color-muted)',
  });
});

test('dialog add and edit preserve unrelated rows and send only explicit changes', () => {
  const rows = variantRows(baseline);
  const draft = {
    ...rows[0],
    key: 'draft',
    id: undefined,
    size: 'L',
    sku: 'CUSTOM',
    stock: 4,
    isDefault: false,
  };
  const added = saveVariantRow(rows, draft);
  assert.equal(added.length, 2);
  assert.deepEqual(variantDiff(added, baseline).changes.update, []);
  assert.equal(variantDiff(added, baseline).changes.create[0].stock, 4);
  const edited = saveVariantRow(added, { ...added[1], price: 200, isDefault: true });
  assert.deepEqual(
    edited.map((row) => row.isDefault),
    [false, true],
  );
  assert.equal(variantDiff(edited, baseline).changes.create[0].price, 200);
  assert.deepEqual(variantDiff(edited, baseline).changes.update, [
    { id: 'existing', expectedVersion: 3, isDefault: false },
  ]);
});

test('dialog deletion removes drafts, marks saved rows, and undo restores an unchanged diff', () => {
  const rows = variantRows(baseline);
  const draft = {
    ...rows[0],
    key: 'draft',
    id: undefined,
    size: 'L',
    sku: 'CUSTOM',
    isDefault: false,
  };
  const added = saveVariantRow(rows, draft);
  const withoutDraft = toggleVariantRemoval(added, 'draft');
  assert.deepEqual(withoutDraft, rows);
  const removed = toggleVariantRemoval(withoutDraft, 'existing');
  assert.equal(removed[0].removed, true);
  assert.deepEqual(variantDiff(removed, baseline).changes.delete, ['existing']);
  const restored = toggleVariantRemoval(removed, 'existing');
  assert.equal(restored[0].removed, false);
  assert.equal(variantDiff(restored, baseline).changed, false);
});
