import { SetMetadata } from '@nestjs/common';
import { SKIP_WRAP_KEY } from '../interceptors/response-transform.interceptor';

/**
 * Decorator to skip response wrapping for specific endpoints
 * Use when you want to return raw response
 */
export const SkipWrap = () => SetMetadata(SKIP_WRAP_KEY, true);
