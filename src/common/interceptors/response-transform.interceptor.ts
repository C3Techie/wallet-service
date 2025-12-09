import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import * as sysMsg from '../../constants/system.messages';

export const SKIP_WRAP_KEY = 'skipWrap';

/**
 * Response transform interceptor
 * Wraps all successful responses in { message, data } format
 * following HNG SDK pattern
 */
@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<
  T,
  { message: string; data: T } | T
> {
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<{ message: string; data: T } | T> {
    const skip_wrap = this.reflector.getAllAndOverride<boolean>(SKIP_WRAP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip_wrap) {
      return next.handle() as Observable<T>;
    }

    return next.handle().pipe(
      map((data: unknown) => {
        // If response already has message and data, return as-is
        if (data && typeof data === 'object' && 'message' in data) {
          return data as { message: string; data: T };
        }

        // Otherwise wrap it
        return {
          message: sysMsg.OPERATION_SUCCESSFUL,
          data: data as T,
        };
      }),
    ) as Observable<{ message: string; data: T } | T>;
  }
}
