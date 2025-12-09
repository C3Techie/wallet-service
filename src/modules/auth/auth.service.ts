import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserModelAction } from './model-actions';
import { AuthResponseDto, UserResponseDto } from './dtos';
import { User } from './entities/user.entity';
import * as sysMsg from '../../constants/system.messages';
import { ApiResponse } from '../../common/interfaces';

@Injectable()
export class AuthService {
  constructor(
    private user_model_action: UserModelAction,
    private jwt_service: JwtService,
    private config_service: ConfigService,
  ) {}

  async google_login(google_user: {
    email: string;
    name?: string;
    avatar?: string;
    google_id: string;
  }): Promise<ApiResponse<AuthResponseDto>> {
    try {
      // Check if user exists
      let user = await this.user_model_action.get({
        identifier_options: { email: google_user.email },
      });

      // Create user if doesn't exist
      if (!user) {
        user = await this.user_model_action.create({
          create_payload: {
            email: google_user.email,
            name: google_user.name,
            avatar: google_user.avatar,
            google_id: google_user.google_id,
          },
        });
      }

      // Generate JWT token
      const payload = { sub: user.id, email: user.email };
      const access_token = this.jwt_service.sign(payload);

      const user_response: UserResponseDto = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };

      return {
        message: sysMsg.GOOGLE_AUTH_SUCCESS,
        data: {
          access_token,
          token_type: 'Bearer',
          user: user_response,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `${sysMsg.GOOGLE_AUTH_FAILED}: ${(error as Error).message}`,
      );
    }
  }

  async validate_user(user_id: string): Promise<User | null> {
    return this.user_model_action.get({
      identifier_options: { id: user_id },
    });
  }

  async handle_google_callback(google_user: {
    email: string;
    name?: string;
    avatar?: string;
    google_id: string;
  }): Promise<ApiResponse<AuthResponseDto>> {
    return await this.google_login(google_user);
  }
}
