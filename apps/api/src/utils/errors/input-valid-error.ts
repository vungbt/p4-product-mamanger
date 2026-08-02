import { BaseError, type Extensions } from './base-error.js';

export class InputValidError extends BaseError {
  constructor(message = 'input_valid_error', extensions: Extensions = {}) {
    super(message, 400, 'input_valid_error', extensions);
  }
}
