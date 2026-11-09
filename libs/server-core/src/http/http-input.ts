import type { Request } from 'express';
import { InputValidError, Unauthorized } from '../shared/errors.js';
import { jsonValue } from '../shared/json.js';

export function currentUser(req: Request) {
  if (!req.user) throw new Unauthorized();
  return req.user;
}

export function requestBody(req: Request) {
  const value: unknown = req.body;
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new InputValidError('input_valid_error');
  const data: Record<string, unknown> = Object.fromEntries(Object.entries(value));
  const invalid = (field: string): never => {
    throw new InputValidError('input_valid_error', {
      [field]: [req.t('error:invalid_field', { attribute: field })],
    });
  };
  const optionalText = (field: string, max = 255, trim = true): string | undefined => {
    const raw = data[field];
    if (raw === undefined) return undefined;
    if (typeof raw !== 'string') return invalid(field);
    const text = trim ? raw.trim() : raw;
    return text.length <= max ? text : invalid(field);
  };
  const text = (field: string, max = 255, trim = true): string => {
    const result = optionalText(field, max, trim);
    return result?.length ? result : invalid(field);
  };
  const integer = (field: string, min = 0, max = 2_147_483_647): number => {
    const raw = data[field];
    return typeof raw === 'number' && Number.isSafeInteger(raw) && raw >= min && raw <= max
      ? raw
      : invalid(field);
  };
  return {
    data,
    invalid,
    text,
    optionalText,
    integer,
    strings(field: string, maxItems = 20, maxLength = 255): string[] {
      const raw = data[field];
      if (!Array.isArray(raw) || raw.length > maxItems) return invalid(field);
      return raw.map((item: unknown) =>
        typeof item === 'string' && item.length > 0 && item.length <= maxLength
          ? item
          : invalid(field),
      );
    },
    boolean(field: string) {
      return typeof data[field] === 'boolean' ? data[field] : invalid(field);
    },
    enum<const Values extends readonly string[]>(field: string, values: Values): Values[number] {
      return values.find((item) => item === data[field]) ?? invalid(field);
    },
    json(field: string) {
      return jsonValue(data[field]);
    },
  };
}

export function routeId(req: Request, field = 'id') {
  const value = req.params[field];
  if (typeof value !== 'string' || !value || value.length > 128)
    throw new InputValidError('input_valid_error');
  return value;
}

export function uuidRouteId(req: Request, field = 'id') {
  const value = routeId(req, field);
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value))
    throw new InputValidError('input_valid_error', {
      [field]: [req.t('error:invalid_field', { attribute: field })],
    });
  return value;
}
