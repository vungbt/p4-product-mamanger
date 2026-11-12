import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { parseCccdDate, parseCccdGender, parseCccdQr } from '../dist/index.js';

// Synthetic sample in the card layout: number|old number|name|birth|gender|address|issue date.
const FULL =
  '001099012345|123456789|Nguyễn Thị Thuỳ Dương|05061999|Nữ|Số 12, Ngõ 34 Phố Đội Cấn, Ba Đình, Hà Nội|10072021';

const data = (raw) => {
  const result = parseCccdQr(raw);

  assert.equal(result.ok, true, JSON.stringify(result));
  return result.data;
};

describe('parseCccdQr', () => {
  test('a full 7-field QR', () => {
    assert.deepEqual(data(FULL), {
      idNumber: '001099012345',
      oldIdNumber: '123456789',
      fullName: 'Nguyễn Thị Thuỳ Dương',
      birthDate: '1999-06-05',
      gender: 'female',
      permanentAddress: 'Số 12, Ngõ 34 Phố Đội Cấn, Ba Đình, Hà Nội',
      issuedAt: '2021-07-10',
    });
  });

  test('empty old CMND number', () => {
    const result = data(
      '079200001234||TRẦN VĂN BÌNH|31121990|Nam|Phường 1, Quận 3, TP. Hồ Chí Minh|01022022',
    );

    assert.equal(result.oldIdNumber, null);
    assert.equal(result.fullName, 'TRẦN VĂN BÌNH');
    assert.equal(result.gender, 'male');
    assert.equal(result.birthDate, '1990-12-31');
    assert.equal(result.issuedAt, '2022-02-01');
  });

  test('6 fields without the old number', () => {
    const result = data('079200001234|Lê Văn Cường|01011985|Nam|Hải Châu, Đà Nẵng|15082021');

    assert.equal(result.oldIdNumber, null);
    assert.equal(result.fullName, 'Lê Văn Cường');
    assert.equal(result.permanentAddress, 'Hải Châu, Đà Nẵng');
    assert.equal(result.issuedAt, '2021-08-15');
  });

  test('6 fields with the old number but no issue date', () => {
    const result = data('079200001234|123456789012|Lê Văn Cường|01011985|Nam|Hải Châu, Đà Nẵng');

    assert.equal(result.oldIdNumber, '123456789012');
    assert.equal(result.permanentAddress, 'Hải Châu, Đà Nẵng');
    assert.equal(result.issuedAt, null);
  });

  test('extra trailing fields of newer cards are ignored', () => {
    const result = data(`${FULL}|Nguyễn Văn Bố|Trần Thị Mẹ|`);

    assert.equal(result.issuedAt, '2021-07-10');
    assert.equal(result.permanentAddress, 'Số 12, Ngõ 34 Phố Đội Cấn, Ba Đình, Hà Nội');
  });

  test('whitespace, BOM, line breaks and spaced numbers', () => {
    const result = data(
      '﻿  001 099 012 345 | 123456789 |  Nguyễn   Thị  A \n| 05061999 | nữ |  Hà   Nội  | 10072021 \r\n',
    );

    assert.equal(result.idNumber, '001099012345');
    assert.equal(result.fullName, 'Nguyễn Thị A');
    assert.equal(result.gender, 'female');
    assert.equal(result.permanentAddress, 'Hà Nội');
  });

  test('decomposed (NFD) diacritics are returned composed (NFC)', () => {
    const result = data(FULL.normalize('NFD'));

    assert.equal(result.fullName, 'Nguyễn Thị Thuỳ Dương');
    assert.equal(result.fullName, result.fullName.normalize('NFC'));
    assert.equal(result.gender, 'female');
  });

  test('missing or invalid optional fields become null', () => {
    const result = data('001099012345||||||');

    assert.deepEqual(result, {
      idNumber: '001099012345',
      oldIdNumber: null,
      fullName: null,
      birthDate: null,
      gender: null,
      permanentAddress: null,
      issuedAt: null,
    });
    const invalid = data('001099012345||A|31021999|Unknown|B|99999999');

    assert.equal(invalid.birthDate, null);
    assert.equal(invalid.gender, null);
    assert.equal(invalid.issuedAt, null);
  });

  test('malformed input is rejected with a reason', () => {
    assert.deepEqual(parseCccdQr(''), { ok: false, error: 'empty' });
    assert.deepEqual(parseCccdQr('   \n'), { ok: false, error: 'empty' });
    assert.deepEqual(parseCccdQr('https://example.com/pay?x=1'), { ok: false, error: 'not_cccd' });
    assert.deepEqual(parseCccdQr('001099012345|Nguyễn A|05061999'), {
      ok: false,
      error: 'not_cccd',
    });
    assert.deepEqual(parseCccdQr('12345|123456789|A|05061999|Nam|B|10072021'), {
      ok: false,
      error: 'invalid_id_number',
    });
    assert.deepEqual(parseCccdQr('00109901234X|123456789|A|05061999|Nam|B|10072021'), {
      ok: false,
      error: 'invalid_id_number',
    });
  });
});

describe('CCCD field helpers', () => {
  test('dates', () => {
    assert.equal(parseCccdDate('29022000'), '2000-02-29');
    assert.equal(parseCccdDate('29021999'), null);
    assert.equal(parseCccdDate('05/06/1999'), '1999-06-05');
    assert.equal(parseCccdDate('1999-06-05'), null);
    assert.equal(parseCccdDate(undefined), null);
  });

  test('gender', () => {
    for (const value of ['Nam', 'NAM', ' nam ', 'Male'])
      assert.equal(parseCccdGender(value), 'male');
    for (const value of ['Nữ', 'NỮ', 'nu', 'Nữ'.normalize('NFD'), 'Female'])
      assert.equal(parseCccdGender(value), 'female');
    assert.equal(parseCccdGender('Khác'), 'other');
    assert.equal(parseCccdGender(''), null);
    assert.equal(parseCccdGender('x'), null);
  });
});
