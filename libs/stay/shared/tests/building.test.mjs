import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { BUILDING_CODE_PATTERN, suggestBuildingCode } from '../dist/index.js';

describe('suggestBuildingCode', () => {
  test('takes the initials of the words without diacritics', () => {
    assert.equal(suggestBuildingCode('Trọ cô Vân'), 'TCV');
    assert.equal(suggestBuildingCode('Nhà trọ Hoà Bình 2'), 'NTHB2');
    assert.equal(suggestBuildingCode('đường Đông Đô'), 'DDD');
  });

  test('keeps numbers whole and caps the code at 6 characters', () => {
    assert.equal(suggestBuildingCode('Toà 12'), 'T12');
    assert.equal(suggestBuildingCode('Khu nhà trọ sinh viên Bách Khoa Hà Nội'), 'KNTSVB');
    assert.equal(suggestBuildingCode('Tầng 123456789'), 'T12345');
  });

  test('ignores punctuation and extra spaces', () => {
    assert.equal(suggestBuildingCode('  Nhà-trọ   (A&B)  '), 'NTAB');
  });

  test('returns an empty code when nothing usable is left', () => {
    assert.equal(suggestBuildingCode(''), '');
    assert.equal(suggestBuildingCode(' - & '), '');
  });

  test('every non-empty suggestion is a valid building code', () => {
    for (const name of ['Trọ cô Vân', 'Nhà trọ Hoà Bình 2', 'Ký túc xá ĐHQG', 'A']) {
      assert.match(suggestBuildingCode(name), BUILDING_CODE_PATTERN);
    }
  });
});
