import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface HttpRequest {
  method: string;
  url: string;
  body?: Record<string, unknown>;
}

interface HttpResponse {
  statusCode: number;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<HttpRequest>();
    const { method, url, body } = request;
    const now = Date.now();

    let bodyToLog = '';
    if (method !== 'GET' && body && Object.keys(body).length > 0) {
      bodyToLog = JSON.stringify(body);
    }
    this.logger.log(`→ ${method} ${url}${bodyToLog ? ' ' + bodyToLog : ''}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse<HttpResponse>();
          const { statusCode } = response;
          const response_time = Date.now() - now;
          this.logger.log(
            `← ${method} ${url} ${statusCode} ${response_time}ms`,
          );
        },
        error: (error: { status?: number; message: string }) => {
          const response_time = Date.now() - now;
          this.logger.error(
            `← ${method} ${url} ${error.status || 500} ${response_time}ms - ${error.message}`,
          );
        },
      }),
    );
  }
}
