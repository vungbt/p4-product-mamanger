import { StatusCodes } from 'http-status-codes';
import { BaseError } from './base-error.js';

export class NotFound extends BaseError {
  constructor(message = 'not_found') {
    super(message, StatusCodes.NOT_FOUND, 'not_found');
  }
}
