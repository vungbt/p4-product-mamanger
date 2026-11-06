import { useCallback, useRef } from 'react';
import { type NavigateOptions, useSearchParams } from 'react-router-dom';
import * as v from 'valibot';

type QueryValue = string | number | boolean | readonly string[] | null | undefined;
type QueryPatch<T> = { [K in keyof T]?: T[K] | null };
type QueryUpdate<T> = QueryPatch<T> | ((current: T) => QueryPatch<T>);

/** Schema owns runtime defaults/coercion; a generic alone cannot validate URL strings. */
export function readQueryParam<T extends object>(
  schema: v.GenericSchema<unknown, T>,
  params: URLSearchParams,
): T {
  const input: Record<string, string | string[]> = {};
  for (const name of new Set(params.keys())) {
    const values = params.getAll(name);
    input[name] = values.length > 1 ? values : (values[0] ?? '');
  }
  return v.parse(schema, input);
}

export function writeQueryParam<T extends { [K in keyof T]: QueryValue }>(
  schema: v.GenericSchema<unknown, T>,
  previous: URLSearchParams,
  update: QueryUpdate<T>,
): URLSearchParams {
  const patch = typeof update === 'function' ? update(readQueryParam(schema, previous)) : update;
  const next = new URLSearchParams(previous);
  for (const [name, value] of Object.entries(patch)) {
    next.delete(name);
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      for (const item of value) next.append(name, item);
    } else next.set(name, String(value));
  }
  // Validate before navigation; coercion and fallback defaults remain schema-owned.
  readQueryParam(schema, next);
  return next;
}

export default function useQueryParam<T extends { [K in keyof T]: QueryValue }>(
  schema: v.GenericSchema<unknown, T>,
) {
  const [params, setParams] = useSearchParams();
  const latest = useRef(params);
  latest.current = params;

  const values = readQueryParam(schema, params);

  const setQuery = useCallback(
    (update: QueryUpdate<T>, options?: NavigateOptions) => {
      const next = writeQueryParam(schema, latest.current, update);
      if (next.toString() === latest.current.toString()) return;

      // Compose consecutive updates in the same event, which setSearchParams alone does not queue.
      latest.current = next;
      setParams(next, options);
    },
    [schema, setParams],
  );

  return [values, setQuery] as const;
}
