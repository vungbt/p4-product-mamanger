import type { JsonValue } from '@p4/shared';
import { InputValidError } from './errors.js';

/** Canonical JSON (sorted keys, ISO dates) for fingerprints and JSONB columns. */
export function jsonValue(value: unknown): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value))
    return value.map((item: unknown) => (item === undefined ? null : jsonValue(item)));
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .flatMap((key) => {
          const item: unknown = Reflect.get(value, key);
          return item === undefined ? [] : [[key, jsonValue(item)]];
        }),
    );
  }
  throw new InputValidError('invalid_json_value');
}
