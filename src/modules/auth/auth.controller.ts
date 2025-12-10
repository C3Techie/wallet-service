import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiResponseDoc,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards';
import { Response } from 'express';
import * as sysMsg from '../../constants/system.messages';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private baseUrl: string;

  constructor(
    private auth_service: AuthService,
    private configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('baseUrl') || 'http://localhost:3000';
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Initiate Google OAuth login (must be opened in a browser, not Swagger or API clients)',
    description:
      'Open this endpoint in your browser to start Google sign-in. Do not use Swagger or API clients.\n\n' +
      '[Click here to start Google OAuth (Production)](https://wallet-service-nggx.onrender.com/api/v1/auth/google)\n\n' +
      '[Click here to start Google OAuth (Localhost)](http://localhost:3000/api/v1/auth/google)',
  })
  @ApiResponseDoc({
    status: HttpStatus.OK,
    description:
      'Redirects to Google OAuth. This endpoint should be opened in a browser, not via Swagger or API clients.',
  })
  async google_auth(@Res() res: Response) {
    // Guard redirects to Google
    return res.status(HttpStatus.BAD_REQUEST).json({
      message:
        'This endpoint must be opened in a browser. It will not work from Swagger or API clients.',
    });
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth callback (returns JWT token, user, and wallet details after successful sign-in)',
    description: 'This endpoint is called by Google after authentication. It returns a JWT token, user info, and wallet details. Should not be called directly by users.'
  })
  @ApiResponseDoc({
    status: HttpStatus.OK,
    description: 'Returns JWT token and user data',
  })
  async google_auth_redirect(
    @Req()
    req: {
      user?: {
        email: string;
        name?: string;
        avatar?: string;
        google_id: string;
      };
    },
    @Res() res: Response,
  ) {
    if (!req.user) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: sysMsg.GOOGLE_AUTH_FAILED,
      });
    }

    const result = await this.auth_service.handle_google_callback(req.user);
    return res.status(HttpStatus.OK).json(result);
  }
}
