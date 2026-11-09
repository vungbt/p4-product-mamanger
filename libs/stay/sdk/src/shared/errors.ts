function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value))
    : undefined;
}

export class ApiSdkError extends Error {
  readonly error = true;
  readonly code: string | undefined;
  readonly data: unknown;
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    readonly status: number,
    body: unknown,
  ) {
    const object = record(body);
    super(typeof object?.message === 'string' ? object.message : `API request failed (${status}).`);
    this.name = 'ApiSdkError';
    this.code = typeof object?.code === 'string' ? object.code : undefined;
    this.data = body;
    this.fieldErrors = {};
    const fields = record(object?.extensions);
    for (const [key, value] of Object.entries(fields ?? {})) {
      if (Array.isArray(value) && value.every((item: unknown) => typeof item === 'string'))
        this.fieldErrors[key] = value;
    }
  }
}

export function getFieldError(error: unknown, field: string): string | undefined {
  return error instanceof ApiSdkError ? error.fieldErrors[field]?.[0] : undefined;
}

export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (!result.response.ok) throw new ApiSdkError(result.response.status, result.error);
  if (result.data === undefined) throw new Error('API response is missing its documented body.');
  return result.data;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return fallback;
}
