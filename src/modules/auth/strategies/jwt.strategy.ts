import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserModelAction } from '../model-actions';
import * as sysMsg from '../../../constants/system.messages';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private config_service: ConfigService,
    private user_model_action: UserModelAction,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config_service.get<string>('JWT_SECRET') || '',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.user_model_action.get({
      identifier_options: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException(sysMsg.USER_NOT_FOUND);
    }

    return user;
  }
}
