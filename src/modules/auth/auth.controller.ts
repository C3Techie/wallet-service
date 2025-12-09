import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
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
  constructor(private auth_service: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Initiate Google OAuth login',
    description: 'Open this endpoint in your browser to start Google sign-in. Do not use Swagger or API clients.\n\n[Click here to start Google OAuth](http://localhost:3000/api/v1/auth/google)'
  })
  @ApiResponseDoc({
    status: HttpStatus.OK,
    description: 'Redirects to Google OAuth. This endpoint should be opened in a browser, not via Swagger or API clients.',
  })
  async google_auth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
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
