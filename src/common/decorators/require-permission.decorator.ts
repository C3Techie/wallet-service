import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'required_permission';

/**
 * Decorator to specify required API key permission for an endpoint
 * JWT users bypass this check
 */
export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);
