import { BaseError } from './base-error.js';

export class Forbidden extends BaseError {
  constructor(message = 'forbidden') {
    super(message, 403, 'forbidden');
  }
}
