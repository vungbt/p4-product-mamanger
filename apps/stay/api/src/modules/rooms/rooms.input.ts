import {
  generateRoomCodes,
  isIsoDate,
  isoDateInTimeZone,
  isRoomCode,
  METER_READING_MAX,
  normalizeRoomCode,
  ROOM_AREA_MAX,
  ROOM_BULK_LIMIT,
  ROOM_BULK_PER_FLOOR_MAX,
  ROOM_CODE_MAX_LENGTH,
  ROOM_FLOOR_MAX,
  ROOM_FLOOR_MIN,
  ROOM_MAX_OCCUPANTS_LIMIT,
  ROOM_PRICE_MAX,
  type RoomCodeTemplateInput,
  StayValueError,
} from '@stay/shared';
import { Op } from 'sequelize';
import { ServiceDefinitionModel } from '@/sequelize/models/index.js';
import type { FormBody } from '@/shared/input.js';
import {
  type MaintenanceInput,
  type NewRoomInput,
  type RoomInput,
  roomCodeTaken,
} from './rooms.service.js';
import type { RoomBulkInput } from './rooms-bulk.service.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_SERVICES = 50;
const MAX_SERIAL = 40;
const MAX_NOTE = 1000;
const MAX_TEMPLATE = 40;

/** `undefined`/empty text → `null`. */
const orNull = (value: string | undefined) => value || null;

/** Area in m²: optional, positive, at most two decimals. */
function readArea(body: FormBody): number | null {
  const value = body.data.areaM2;

  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    body.invalid('areaM2', 'decimal_field');
    return null;
  }

  const hundredths = Math.round(value * 100);

  body.check(
    'areaM2',
    value > 0 && value <= ROOM_AREA_MAX && Math.abs(value * 100 - hundredths) < 1e-6,
    'decimal_field',
    { max: ROOM_AREA_MAX },
  );
  return hundredths / 100;
}

/** Default services: existing service ids, without duplicates (`[]` when omitted). */
async function readServiceIds(body: FormBody): Promise<string[]> {
  if (body.isEmpty('serviceIds')) return [];

  const ids = [...new Set(body.strings('serviceIds', MAX_SERVICES, 36))];

  if (body.errors.serviceIds) return [];
  if (
    !body.check(
      'serviceIds',
      ids.every((id) => UUID_PATTERN.test(id)),
      'service_not_found',
    )
  )
    return [];

  const found = ids.length
    ? await ServiceDefinitionModel.count({ where: { id: { [Op.in]: ids } } })
    : 0;

  body.check('serviceIds', found === ids.length, 'service_not_found');
  return ids;
}

/** Whole non-negative meter reading (rules.md); `0` when omitted. */
function readReading(body: FormBody, field: string): number {
  return body.isEmpty(field) ? 0 : body.integer(field, 0, METER_READING_MAX);
}

/** Body of `POST /buildings/:buildingId/rooms` and `PUT /rooms/:id` (`existing`). */
async function readRoomFields(
  body: FormBody,
  buildingId: string,
  existingId?: string,
): Promise<RoomInput> {
  const input: RoomInput = {
    code: normalizeRoomCode(body.text('code', ROOM_CODE_MAX_LENGTH)),
    floor: body.integer('floor', ROOM_FLOOR_MIN, ROOM_FLOOR_MAX),
    areaM2: readArea(body),
    listPrice: body.integer('listPrice', 0, ROOM_PRICE_MAX),
    maxOccupants: body.integer('maxOccupants', 1, ROOM_MAX_OCCUPANTS_LIMIT),
    note: orNull(body.optionalText('note', MAX_NOTE)),
    serviceIds: await readServiceIds(body),
  };

  if (!body.errors.code && body.check('code', isRoomCode(input.code), 'room_code_format'))
    body.check('code', !(await roomCodeTaken(buildingId, input.code, existingId)), 'unique_value');
  return input;
}

export async function readNewRoomInput(body: FormBody, buildingId: string): Promise<NewRoomInput> {
  const fields = await readRoomFields(body, buildingId);
  const input: NewRoomInput = {
    ...fields,
    meters: {
      electricity: {
        initialReading: readReading(body, 'initialElectric'),
        serial: orNull(body.optionalText('electricSerial', MAX_SERIAL)),
      },
      water: {
        initialReading: readReading(body, 'initialWater'),
        serial: orNull(body.optionalText('waterSerial', MAX_SERIAL)),
      },
    },
  };

  body.assertValid();
  return input;
}

export async function readRoomInput(
  body: FormBody,
  room: { id: string; buildingId: string },
): Promise<RoomInput & { version: number }> {
  const version = body.integer('version', 1);
  const input = await readRoomFields(body, room.buildingId, room.id);

  body.assertValid();
  return { ...input, version };
}

/** Floors, rooms per floor and code template; generation errors map to their field. */
function readTemplate(body: FormBody): RoomCodeTemplateInput {
  const input = {
    floorFrom: body.integer('floorFrom', ROOM_FLOOR_MIN, ROOM_FLOOR_MAX),
    floorTo: body.integer('floorTo', ROOM_FLOOR_MIN, ROOM_FLOOR_MAX),
    roomsPerFloor: body.integer('roomsPerFloor', 1, ROOM_BULK_PER_FLOOR_MAX),
    template: body.text('template', MAX_TEMPLATE),
  };

  if (Object.keys(body.errors).length) return input;

  try {
    generateRoomCodes(input);
  } catch (error) {
    if (!(error instanceof StayValueError)) throw error;
    if (error.code === 'INVALID_ROOM_RANGE') body.invalid('floorTo', 'room_floor_range');
    else if (error.code === 'ROOM_BULK_LIMIT')
      body.invalid('roomsPerFloor', 'room_bulk_limit', { max: ROOM_BULK_LIMIT });
    else body.invalid('template', 'room_template');
  }
  return input;
}

/** Body of `POST /buildings/:buildingId/rooms/bulk/preview`. */
export function readBulkPreviewInput(body: FormBody): RoomCodeTemplateInput {
  const input = readTemplate(body);

  body.assertValid();
  return input;
}

/** `prices: [{ code, listPrice }]` edited on the preview; codes must be generated ones. */
function readPrices(body: FormBody, codes: ReadonlySet<string>): Record<string, number> {
  const value = body.data.prices;
  const prices: Record<string, number> = {};

  if (value === undefined || value === null) return prices;
  if (!Array.isArray(value) || value.length > ROOM_BULK_LIMIT) {
    body.invalid('prices');
    return prices;
  }

  for (const item of value) {
    const code: unknown = item && typeof item === 'object' ? Reflect.get(item, 'code') : undefined;
    const price: unknown =
      item && typeof item === 'object' ? Reflect.get(item, 'listPrice') : undefined;

    if (
      typeof code !== 'string' ||
      !codes.has(normalizeRoomCode(code)) ||
      typeof price !== 'number' ||
      !Number.isSafeInteger(price) ||
      price < 0 ||
      price > ROOM_PRICE_MAX
    ) {
      body.invalid('prices');
      return {};
    }
    prices[normalizeRoomCode(code)] = price;
  }
  return prices;
}

/** Body of `POST /buildings/:buildingId/rooms/bulk`. */
export async function readBulkInput(body: FormBody): Promise<RoomBulkInput> {
  const template = readTemplate(body);
  const listPrice = body.integer('listPrice', 0, ROOM_PRICE_MAX);
  const maxOccupants = body.integer('maxOccupants', 1, ROOM_MAX_OCCUPANTS_LIMIT);
  const areaM2 = readArea(body);
  const serviceIds = await readServiceIds(body);
  const meters = {
    electricity: { initialReading: readReading(body, 'initialElectric') },
    water: { initialReading: readReading(body, 'initialWater') },
  };
  const codes = Object.keys(body.errors).length
    ? new Set<string>()
    : new Set(generateRoomCodes(template).map((item) => item.code));
  const prices = readPrices(body, codes);

  body.assertValid();
  return { ...template, listPrice, maxOccupants, areaM2, serviceIds, meters, prices };
}

/** Body of `POST /rooms/:id/maintenance`: a reason is required to switch it on. */
export function readMaintenanceInput(body: FormBody): MaintenanceInput {
  const maintenance = body.boolean('maintenance');
  const version = body.integer('version', 1);

  if (!maintenance) {
    body.assertValid();
    return { maintenance, reason: null, until: null, version };
  }

  const reason = body.text('reason', 255);
  const until = orNull(body.optionalText('until', 10));

  if (until && body.check('until', isIsoDate(until), 'invalid_date'))
    body.check('until', until >= isoDateInTimeZone(new Date()), 'date_not_past');
  body.assertValid();
  return { maintenance, reason, until, version };
}
