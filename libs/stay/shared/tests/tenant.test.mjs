import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  maskIdNumber,
  normalizeIdNumber,
  normalizePhone,
  normalizePlate,
  parseVietnameseDate,
  plateKey,
  TENANT_IMPORT_COLUMNS,
} from '../dist/index.js';

describe('tenant values', () => {
  test('phones are stored as 0xxxxxxxxx', () => {
    assert.equal(normalizePhone('0901234567'), '0901234567');
    assert.equal(normalizePhone(' 090 123.45-67 '), '0901234567');
    assert.equal(normalizePhone('+84 90 123 4567'), '0901234567');
    assert.equal(normalizePhone('84901234567'), '0901234567');
    assert.equal(normalizePhone('901234567'), null);
    assert.equal(normalizePhone('09012345678'), null);
    assert.equal(normalizePhone('abc'), null);
  });

  test('CCCD has 12 digits and is masked in the middle', () => {
    assert.equal(normalizeIdNumber('0010 9000 1234'), '001090001234');
    assert.equal(normalizeIdNumber('12345'), null);
    assert.equal(maskIdNumber('001090001234'), '001*****1234');
  });

  test('plates are upper case; separators do not make a different vehicle', () => {
    assert.equal(normalizePlate(' 59-x1  123.45 '), '59-X1 123.45');
    assert.equal(normalizePlate('!!'), null);
    assert.equal(plateKey('59-X1 123.45'), plateKey('59x112345'));
  });

  test('dates accept dd/MM/yyyy and YYYY-MM-DD', () => {
    assert.equal(parseVietnameseDate('5/1/2000'), '2000-01-05');
    assert.equal(parseVietnameseDate('29-02-2024'), '2024-02-29');
    assert.equal(parseVietnameseDate('2000-01-05'), '2000-01-05');
    assert.equal(parseVietnameseDate('31/02/2000'), null);
    assert.equal(parseVietnameseDate('2000/01/05'), null);
  });

  test('only name and phone are required import columns', () => {
    assert.deepEqual(
      TENANT_IMPORT_COLUMNS.filter((column) => column.required).map((column) => column.key),
      ['fullName', 'phone'],
    );
  });
});
