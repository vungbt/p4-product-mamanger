import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selectFields } from '../dist/utils/select-fields.js';

test('selectFields reads selected class getters without serializing the model or private fields', () => {
  class Entity {
    get id() {
      return 'category-1';
    }
    get name() {
      return 'Category';
    }
    get passwordHash() {
      throw new Error('Private fields must not be read');
    }
    toJSON() {
      throw new Error('Model serialization must not be invoked');
    }
  }
  const source = new Entity();
  const result = selectFields(source, ['id', 'name']);
  assert.deepEqual(result, { id: 'category-1', name: 'Category' });
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
  assert.deepEqual(Object.keys(result), ['id', 'name']);
});

test('selectFields preserves null/undefined/false/zero, creates a new object and performs a shallow selection', () => {
  const nested = { keep: true };
  const source = Object.freeze({
    id: 0,
    nullable: null,
    optional: undefined,
    active: false,
    nested,
    ignored: 'private',
  });
  const result = selectFields(source, ['id', 'nullable', 'optional', 'active', 'nested']);
  assert.deepEqual(result, { id: 0, nullable: null, optional: undefined, active: false, nested });
  assert.equal(result.nested, nested);
  assert.notEqual(result, source);
  assert.deepEqual(selectFields(source, []), {});
});

test('selectFields defines special keys as own data without altering the result prototype', () => {
  const source = JSON.parse('{"__proto__":{"polluted":true},"id":"1"}');
  const result = selectFields(source, ['__proto__', 'id']);
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
  assert.equal(Object.hasOwn(result, '__proto__'), true);
  assert.equal(result.polluted, undefined);
  assert.equal(
    Object.getOwnPropertyDescriptor(result, '__proto__')?.value,
    Object.getOwnPropertyDescriptor(source, '__proto__')?.value,
  );
});
