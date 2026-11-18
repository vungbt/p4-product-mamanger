import { StatusCodes } from 'http-status-codes';

export type Extensions = Record<string, unknown>;

/** HTTP error rendered by `handleErrorApi` as `{ message, code, extensions? }`. */
export class BaseError extends Error {
  statusCode: number;
  code: string;
  extensions: Extensions;

  constructor(
    message: string,
    statusCode = StatusCodes.BAD_REQUEST,
    code = 'error',
    extensions: Extensions = {},
  ) {
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

export class BadRequest extends BaseError {
  constructor(message = 'input_valid_error', extensions: Extensions = {}) {
    super(message, StatusCodes.BAD_REQUEST, 'bad_request', extensions);
  }
}

/** Field errors live in `extensions`: `{ field: [message] }`. */
export class InputValidError extends BaseError {
  constructor(message = 'input_valid_error', extensions: Extensions = {}) {
    super(message, StatusCodes.BAD_REQUEST, 'input_valid_error', extensions);
  }
}

export class Unauthorized extends BaseError {
  constructor(message = 'unauthorized') {
    super(message, StatusCodes.UNAUTHORIZED, 'unauthorized');
  }
}

export class Forbidden extends BaseError {
  constructor(message = 'forbidden') {
    super(message, StatusCodes.FORBIDDEN, 'forbidden');
  }
}

export class NotFound extends BaseError {
  constructor(message = 'not_found') {
    super(message, StatusCodes.NOT_FOUND, 'not_found');
  }
}
