import { BaseError } from './base-error.js';

export class Unauthorized extends BaseError {
  constructor(message = 'unauthorized') {
    super(message, 401, 'unauthorized');
  }
}
