import { BaseError, InputValidError } from '@p4/server-core';
import type { Request } from 'express';

const MAX_INT = 2_147_483_647;

/**
 * Reads a JSON body field by field and collects every field error, so a form shows all of them
 * at once (`{ code: 'input_valid_error', extensions: { field: [message] } }`). Call
 * `assertValid()` before using the values: invalid fields return placeholders.
 *
 * Method names match `requestBody` from `@p4/server-core`, which the OpenAPI generator reads.
 */
export function formBody(req: Request) {
  const raw: unknown = req.body;

  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw new InputValidError('input_valid_error');

  const data: Record<string, unknown> = Object.fromEntries(Object.entries(raw));
  const errors: Record<string, string[]> = {};

  const attribute = (field: string) => {
    const key = `validator:attribute.${field}`;
    const translated = req.t(key);

    return translated === key ? field : translated;
  };

  /** Records `error:<key>` for `field` (first error per field only). */
  const invalid = (field: string, key = 'invalid_field', options: Record<string, unknown> = {}) => {
    errors[field] ??= [req.t(`error:${key}`, { attribute: attribute(field), ...options })];
  };

  const isEmpty = (field: string) => data[field] === undefined || data[field] === null;

  const optionalText = (field: string, max = 255): string | undefined => {
    const value = data[field];

    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'string') {
      invalid(field);
      return undefined;
    }

    const text = value.trim();

    if (text.length > max) invalid(field, 'too_long', { max });
    return text;
  };

  const text = (field: string, max = 255): string => {
    const value = optionalText(field, max);

    if (!value) invalid(field, 'required_field');
    return value ?? '';
  };

  const integer = (field: string, min = 0, max = MAX_INT): number => {
    const value = data[field];

    if (value === undefined || value === null) {
      invalid(field, 'required_field');
      return min;
    }
    if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
      invalid(field, 'integer_field');
      return min;
    }
    if (value < min || value > max) {
      invalid(field, 'integer_range', { min, max });
      return min;
    }

    return value;
  };

  return {
    data,
    errors,
    invalid,
    isEmpty,
    text,
    optionalText,
    integer,
    strings(field: string, maxItems = 20, maxLength = 255): string[] {
      const value = data[field];

      if (!Array.isArray(value) || value.length > maxItems) {
        invalid(field);
        return [];
      }

      return value.filter(
        (item: unknown): item is string =>
          typeof item === 'string' && item.length > 0 && item.length <= maxLength,
      );
    },
    boolean(field: string): boolean {
      const value = data[field];

      if (typeof value === 'boolean') return value;
      invalid(field, value === undefined || value === null ? 'required_field' : 'invalid_field');
      return false;
    },
    enum<const Values extends readonly [string, ...string[]]>(
      field: string,
      values: Values,
    ): Values[number] {
      const value = values.find((item) => item === data[field]);

      if (value === undefined) invalid(field);
      return value ?? values[0];
    },
    /** Records `key` for `field` unless `ok`; returns `ok`. */
    check(field: string, ok: boolean, key = 'invalid_field', options?: Record<string, unknown>) {
      if (!ok) invalid(field, key, options);
      return ok;
    },
    assertValid() {
      if (Object.keys(errors).length) throw new InputValidError('input_valid_error', errors);
    },
  };
}

export type FormBody = ReturnType<typeof formBody>;

/** Optimistic lock: the client's `version` must match the stored row (409 otherwise). */
export function assertVersion(actual: number, expected: number) {
  if (actual !== expected)
    throw new BaseError('version_conflict', 409, 'version_conflict', {
      expectedVersion: expected,
      actualVersion: actual,
    });
}
