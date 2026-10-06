import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

export interface ApiErrorBody {
  success: false;
  message: string;
  errorCode: string;
  details?: unknown;
  path: string;
  statusCode: number;
  timestamp: string;
}

/**
 * Filtre global : normalise TOUTES les erreurs sortantes.
 * Aucune stack trace ni détail technique n'est exposé au client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    const { status, message, errorCode, details } = this.describe(exception);

    if (status >= Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      this.logger.error(
        `[${request.requestId ?? '-'}] ${request.method} ${request.url} -> ${status} ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `[${request.requestId ?? '-'}] ${request.method} ${request.url} -> ${status} ${message}`,
      );
    }

    const body: ApiErrorBody = {
      success: false,
      message,
      errorCode,
      ...(details ? { details } : {}),
      path: request.url,
      statusCode: status,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }

  private describe(exception: unknown): {
    status: number;
    message: string;
    errorCode: string;
    details?: unknown;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        return { status, message: res, errorCode: this.codeFor(status) };
      }

      const payload = res as Record<string, unknown>;
      const rawMessage = payload.message;
      const message = Array.isArray(rawMessage)
        ? 'Validation échouée'
        : typeof rawMessage === 'string'
          ? rawMessage
          : exception.message;

      return {
        status,
        message,
        errorCode:
          (typeof payload.errorCode === 'string' && payload.errorCode) ||
          this.codeFor(status),
        details: Array.isArray(rawMessage) ? { errors: rawMessage } : undefined,
      };
    }

    if (exception instanceof QueryFailedError) {
      const driverError = exception.driverError as
        { code?: string } | undefined;
      const code = driverError?.code;

      // 23505 = violation d'unicité, 23503 = violation de clé étrangère
      if (code === '23505') {
        return {
          status: HttpStatus.CONFLICT,
          message: 'Cette ressource existe déjà',
          errorCode: 'CONFLICT',
        };
      }

      if (code === '23503') {
        return {
          status: HttpStatus.CONFLICT,
          message: 'Opération impossible : ressource liée inexistante',
          errorCode: 'FOREIGN_KEY_VIOLATION',
        };
      }

      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erreur de base de données',
        errorCode: 'DATABASE_ERROR',
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Une erreur interne est survenue',
      errorCode: 'INTERNAL_SERVER_ERROR',
    };
  }

  private codeFor(status: number): string {
    switch (status) {
      case Number(HttpStatus.BAD_REQUEST):
        return 'BAD_REQUEST';
      case Number(HttpStatus.UNAUTHORIZED):
        return 'UNAUTHORIZED';
      case Number(HttpStatus.FORBIDDEN):
        return 'FORBIDDEN';
      case Number(HttpStatus.NOT_FOUND):
        return 'NOT_FOUND';
      case Number(HttpStatus.CONFLICT):
        return 'CONFLICT';
      case Number(HttpStatus.UNPROCESSABLE_ENTITY):
        return 'VALIDATION_ERROR';
      default:
        return 'ERROR';
    }
  }
}
