import { StatusCodes } from 'http-status-codes';
import { BaseError } from './base-error.js';

export class Unauthorized extends BaseError {
  constructor(message = 'unauthorized') {
    super(message, StatusCodes.UNAUTHORIZED, 'unauthorized');
  }
}
