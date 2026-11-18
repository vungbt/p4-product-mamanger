import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { buildVietQrPayload, crc16Ccitt, StayValueError, toTransferText } from '../dist/index.js';

/** Splits an EMVCo string into `{ id: value }` (one level). */
function parseTlv(payload) {
  const fields = {};
  let index = 0;

  while (index < payload.length) {
    const id = payload.slice(index, index + 2);
    const length = Number(payload.slice(index + 2, index + 4));

    fields[id] = payload.slice(index + 4, index + 4 + length);
    index += 4 + length;
  }
  assert.equal(index, payload.length, 'lengths add up to the payload');
  return fields;
}

describe('crc16Ccitt', () => {
  test('matches the CRC-16/CCITT-FALSE check values', () => {
    assert.equal(crc16Ccitt('123456789'), '29B1');
    assert.equal(crc16Ccitt(''), 'FFFF');
  });
});

describe('buildVietQrPayload', () => {
  const payload = buildVietQrPayload({
    bin: '970436',
    accountNumber: '0123456789',
    amount: 10000,
    content: 'Kiểm tra Stay',
  });

  test('encodes the NAPAS fields', () => {
    const fields = parseTlv(payload);
    const merchant = parseTlv(fields['38']);

    assert.equal(fields['00'], '01');
    assert.equal(fields['01'], '12');
    assert.equal(merchant['00'], 'A000000727');
    assert.equal(merchant['02'], 'QRIBFTTA');
    assert.deepEqual(parseTlv(merchant['01']), { '00': '970436', '01': '0123456789' });
    assert.equal(fields['53'], '704');
    assert.equal(fields['54'], '10000');
    assert.equal(fields['58'], 'VN');
    assert.deepEqual(parseTlv(fields['62']), { '08': 'KIEM TRA STAY' });
  });

  test('matches the expected payload byte for byte', () => {
    // CRC cross-checked with Python's binascii.crc_hqx(payload, 0xFFFF).
    assert.equal(
      payload,
      '000201010212' +
        '38540010A00000072701240006970436011001234567890208QRIBFTTA' +
        '5303704540510000' +
        '5802VN' +
        '62170813KIEM TRA STAY' +
        '6304FB7D',
    );
  });

  test('ends with the CRC of everything before it, including "6304"', () => {
    assert.match(payload, /6304[0-9A-F]{4}$/);
    assert.equal(payload.slice(-4), crc16Ccitt(payload.slice(0, -4)));
  });

  test('static QR without amount or content', () => {
    const fields = parseTlv(buildVietQrPayload({ bin: '970415', accountNumber: '113366668888' }));

    assert.equal(fields['01'], '11');
    assert.equal(fields['54'], undefined);
    assert.equal(fields['62'], undefined);
  });

  test('rejects malformed input', () => {
    assert.throws(() => buildVietQrPayload({ bin: '97043', accountNumber: '1' }), StayValueError);
    assert.throws(
      () => buildVietQrPayload({ bin: '970436', accountNumber: '01 23' }),
      StayValueError,
    );
    assert.throws(
      () => buildVietQrPayload({ bin: '970436', accountNumber: '1', amount: 1.5 }),
      StayValueError,
    );
    assert.throws(
      () => buildVietQrPayload({ bin: '970436', accountNumber: '1', amount: 0 }),
      StayValueError,
    );
  });
});

describe('toTransferText', () => {
  test('removes diacritics and symbols', () => {
    assert.equal(toTransferText('Đặng Thị Ánh – phòng 101!'), 'DANG THI ANH PHONG 101');
  });
});

describe('ST-16 share helpers', async () => {
  const { abbreviatePersonName, findVietQrBank, publicInvoicePath } = await import(
    '../dist/index.js'
  );

  test('abbreviates the representative name to initials and the given name', () => {
    assert.equal(abbreviatePersonName('Nguyễn Văn An'), 'N. V. An');
    assert.equal(abbreviatePersonName('  đặng   thị  Bình '), 'Đ. T. Bình');
    assert.equal(abbreviatePersonName('An'), 'An');
    assert.equal(abbreviatePersonName('   '), null);
  });

  test('finds banks of the VietQR directory and builds public paths', () => {
    assert.equal(findVietQrBank('970436')?.code, 'VCB');
    assert.equal(findVietQrBank('000000'), undefined);
    assert.equal(publicInvoicePath('abc'), '/i/abc');
  });
});
