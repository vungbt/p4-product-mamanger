import type { JsonValue } from '@p4/shared';

const privateField =
  /password|token|secret|signature|authorization|credential|email|phone|address|line1|fullName|encrypted/i;

export function redact(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(redact);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        privateField.test(key) ? '[REDACTED]' : redact(item),
      ]),
    );
  }
  return value;
}
