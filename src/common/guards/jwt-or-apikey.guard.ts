import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApikeyService } from '../../modules/apikey/apikey.service';
import { User } from '../../modules/auth/entities/user.entity';
import {
  INVALID_CREDENTIALS,
  UNAUTHORIZED,
  API_KEY_INVALID,
  INSUFFICIENT_PERMISSIONS,
} from '../../constants/system.messages';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';

interface AuthenticatedRequest {
  headers: {
    'x-api-key'?: string;
    authorization?: string;
  };
  user?: User;
  api_key_permissions?: string[];
}

@Injectable()
export class JwtOrApiKeyGuard implements CanActivate {
  constructor(
    private jwt_service: JwtService,
    private apikey_service: ApikeyService,
    private reflector: Reflector,
    @InjectRepository(User)
    private user_repository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const required_permission = this.reflector.get<string>(
      PERMISSION_KEY,
      context.getHandler(),
    );

    // Try API Key first
    const api_key = request.headers['x-api-key'];
    if (api_key) {
      const validation = await this.apikey_service.validate_api_key(api_key);
      if (validation.is_valid && validation.user_id) {
        const user = await this.user_repository.findOne({
          where: { id: validation.user_id },
        });
        if (!user) {
          throw new UnauthorizedException(INVALID_CREDENTIALS);
        }

        // Check if API key has required permission
        if (required_permission && validation.permissions) {
          if (!validation.permissions.includes(required_permission)) {
            throw new ForbiddenException(INSUFFICIENT_PERMISSIONS(required_permission));
          }
        }

        request.user = user;
        request.api_key_permissions = validation.permissions || [];
        return true;
      }
      throw new UnauthorizedException(API_KEY_INVALID);
    }

    // Try JWT
    const auth_header = request.headers['authorization'];
    if (auth_header && auth_header.startsWith('Bearer ')) {
      const token = auth_header.substring(7);
      try {
        const payload = this.jwt_service.verify<{ sub: string }>(token);
        const user = await this.user_repository.findOne({
          where: { id: payload.sub },
        });
        if (!user) {
          throw new UnauthorizedException(INVALID_CREDENTIALS);
        }
        request.user = user;
        // JWT users can perform all actions, no permission check needed
        return true;
      } catch {
        throw new UnauthorizedException(UNAUTHORIZED);
      }
    }

    throw new UnauthorizedException(UNAUTHORIZED);
  }
}
