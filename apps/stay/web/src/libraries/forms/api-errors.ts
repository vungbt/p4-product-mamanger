import { ApiSdkError } from '@stay/sdk/shared';

/** `PUT` with a stale `version` (optimistic lock): the record changed since it was loaded. */
export function isVersionConflict(error: unknown): boolean {
  return error instanceof ApiSdkError && error.status === 409 && error.code === 'version_conflict';
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiSdkError && error.status === 404;
}

export type ApiFormErrors<Field extends string> = {
  /** First API message of each form field (`extensions.<field>`). */
  fields: Partial<Record<Field, string>>;
  /** Form-level message: errors without a matching field, or the API message. */
  message: string | null;
};

/** Splits an API error into messages for `fields` and a form-level message. */
export function apiFormErrors<Field extends string>(
  error: unknown,
  fields: readonly Field[],
  fallback: string,
): ApiFormErrors<Field> {
  const result: ApiFormErrors<Field> = { fields: {}, message: null };

  if (!(error instanceof ApiSdkError)) {
    result.message = fallback;
    return result;
  }

  let unmatched = false;

  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    const known = fields.find((name) => name === field);

    if (known && messages[0]) result.fields[known] = messages[0];
    else unmatched = true;
  }

  if (unmatched || Object.keys(result.fields).length === 0)
    result.message = error.message || fallback;
  return result;
}

/**
 * Field meta updater showing an API message under the field (TanStack `errorMap.onServer`);
 * `undefined` clears it. Use with `form.setFieldMeta(field, serverError(message))`.
 */
export function serverError(message: string | undefined) {
  return <Meta extends { errorMap: object; isTouched: boolean }>(previous: Meta): Meta => ({
    ...previous,
    isTouched: previous.isTouched || message !== undefined,
    errorMap: { ...previous.errorMap, onServer: message },
  });
}

/** Form `listeners`: editing a field clears its API error so the form can be submitted again. */
export const clearServerErrorOnChange = {
  onChange: ({
    fieldApi,
  }: {
    fieldApi: {
      state: { meta: { errorMap: { onServer?: unknown } } };
      setMeta: (updater: ReturnType<typeof serverError>) => void;
    };
  }) => {
    if (fieldApi.state.meta.errorMap.onServer !== undefined)
      fieldApi.setMeta(serverError(undefined));
  },
};
