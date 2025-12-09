import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private config_service: ConfigService) {
    super({
      clientID: config_service.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: config_service.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: config_service.get<string>('GOOGLE_CALLBACK_URL') || '',
      scope: ['email', 'profile'],
    });
  }

  validate(
    access_token: string,
    refresh_token: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { emails, displayName, photos, id } = profile;
    const user = {
      email: emails?.[0]?.value || '',
      name: displayName,
      avatar: photos?.[0]?.value,
      google_id: id,
    };
    done(null, user);
  }
}
