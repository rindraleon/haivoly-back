import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface ApiSuccessBody<T> {
  success: true;
  data: T;
  message: string;
}

const DATE_ONLY_FIELDS = new Set([
  'datePlantation',
  'datePrevueRecolte',
  'dateRecolte',
]);

/** Champs jamais exposés dans une réponse. */
const PRIVATE_FIELDS = new Set(['password', 'tokenHash']);

function serializeValue(value: unknown, key?: string): unknown {
  if (value === null || value === undefined) return value;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return key && DATE_ONLY_FIELDS.has(key)
      ? value.toISOString().slice(0, 10)
      : value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item, key));
  }

  if (typeof value === 'object') {
    return serializeEntity(value as Record<string, unknown>);
  }

  return value;
}

function serializeEntity(
  entity: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(entity)) {
    if (PRIVATE_FIELDS.has(key)) continue;
    result[key] = serializeValue(value, key);
  }

  return result;
}

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccessBody<T> | T
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessBody<T> | T> {
    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          'success' in (data as Record<string, unknown>)
        ) {
          return data;
        }

        return {
          success: true as const,
          data: serializeValue(data) as T,
          message: 'Opération réussie',
        };
      }),
    );
  }
}
