import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  DEFAULT_ROOM_CODE_TEMPLATE,
  generateRoomCodes,
  isRoomCode,
  normalizeRoomCode,
  ROOM_BULK_LIMIT,
  StayValueError,
} from '../dist/index.js';

function errorCode(fn) {
  try {
    fn();
  } catch (error) {
    assert.ok(error instanceof StayValueError);
    return error.code;
  }
  return null;
}

describe('room codes', () => {
  test('{floor}{number} generates codes floor by floor', () => {
    assert.deepEqual(
      generateRoomCodes({
        floorFrom: 1,
        floorTo: 2,
        roomsPerFloor: 2,
        template: DEFAULT_ROOM_CODE_TEMPLATE,
      }),
      [
        { code: '101', floor: 1 },
        { code: '102', floor: 1 },
        { code: '201', floor: 2 },
        { code: '202', floor: 2 },
      ],
    );
  });

  test('templates may add a prefix and are upper-cased', () => {
    assert.deepEqual(
      generateRoomCodes({ floorFrom: 3, floorTo: 3, roomsPerFloor: 1, template: 'p{number}' }),
      [{ code: 'P01', floor: 3 }],
    );
    assert.equal(normalizeRoomCode(' a-101 '), 'A-101');
    assert.equal(isRoomCode('A-101'), true);
    assert.equal(isRoomCode('-101'), false);
    assert.equal(isRoomCode('Phòng 1'), false);
  });

  test('rejects invalid ranges, templates and oversized batches', () => {
    const base = { floorFrom: 1, floorTo: 3, roomsPerFloor: 4, template: '{floor}{number}' };
    const generate = (changes) => () => generateRoomCodes({ ...base, ...changes });

    assert.equal(errorCode(generate({ floorFrom: 4 })), 'INVALID_ROOM_RANGE');
    assert.equal(errorCode(generate({ roomsPerFloor: 0 })), 'INVALID_ROOM_RANGE');
    assert.equal(errorCode(generate({ template: '{floor}' })), 'INVALID_ROOM_TEMPLATE');
    // Several floors without `{floor}` would repeat the same codes.
    assert.equal(errorCode(generate({ template: 'P{number}' })), 'INVALID_ROOM_TEMPLATE');
    assert.equal(
      errorCode(generate({ template: 'Phòng {floor}{number}' })),
      'INVALID_ROOM_TEMPLATE',
    );
    assert.equal(
      errorCode(generate({ floorFrom: 0, floorTo: 99, roomsPerFloor: 50 })),
      'ROOM_BULK_LIMIT',
    );
    assert.ok(ROOM_BULK_LIMIT >= 50);
  });
});
