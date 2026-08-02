import { StatusCodes } from 'http-status-codes';
import { BaseError } from './base-error.js';

export class Forbidden extends BaseError {
  constructor(message = 'forbidden') {
    super(message, StatusCodes.FORBIDDEN, 'forbidden');
  }
}
