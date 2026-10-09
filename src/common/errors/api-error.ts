import { HttpException, HttpStatus } from '@nestjs/common';

import { type ErrorCodeValue } from './error-codes';

export class ApiException extends HttpException {
  constructor(
    code: ErrorCodeValue,
    message: string,
    status: number = HttpStatus.BAD_REQUEST,
  ) {
    super({ code, message, statusCode: status }, status);
  }
}
