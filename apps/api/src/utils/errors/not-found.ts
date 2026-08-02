import { BaseError } from './base-error.js';

export class NotFound extends BaseError {
  constructor(message = 'not_found') {
    super(message, 404, 'not_found');
  }
}
