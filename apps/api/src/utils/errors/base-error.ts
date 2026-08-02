export type Extensions = Record<string, unknown>;

export class BaseError extends Error {
  statusCode: number;
  code: string;
  extensions: Extensions;

  constructor(message: string, statusCode = 400, code = 'error', extensions: Extensions = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.extensions = extensions;
  }
}

/** @deprecated dùng Unauthorized / BadRequest / … */
export class AppError extends BaseError {}

export function isAppError(error: unknown): error is BaseError {
  return error instanceof BaseError;
}
