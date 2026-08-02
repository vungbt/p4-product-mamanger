import { BaseError, type Extensions } from './base-error.js';

export class BadRequest extends BaseError {
  constructor(message = 'input_valid_error', extensions: Extensions = {}) {
    super(message, 400, 'bad_request', extensions);
  }
}
