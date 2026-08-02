import { StatusCodes } from 'http-status-codes';
import { BaseError, type Extensions } from './base-error.js';

export class BadRequest extends BaseError {
  constructor(message = 'input_valid_error', extensions: Extensions = {}) {
    super(message, StatusCodes.BAD_REQUEST, 'bad_request', extensions);
  }
}
