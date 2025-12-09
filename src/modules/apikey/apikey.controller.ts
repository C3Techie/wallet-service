import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse as ApiResponseDoc,
} from '@nestjs/swagger';
import { ApiKeyListDocs } from './decorators/apikey-list-docs.decorator';
import { ApikeyService } from './apikey.service';
import {
  CreateApiKeyDto,
  RolloverApiKeyDto,
  ApiKeyResponseDto,
} from './dtos';
import { JwtAuthGuard } from '../auth/guards';
import { User } from '../auth/entities/user.entity';

@ApiTags('API Keys')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('keys')
export class ApikeyController {
  constructor(private apikey_service: ApikeyService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponseDoc({
    status: HttpStatus.CREATED,
    description: 'API key created successfully',
    type: ApiKeyResponseDto,
  })
  async create_api_key(
    @Req() req: { user: User },
    @Body() create_api_key_dto: CreateApiKeyDto,
  ) {
    return this.apikey_service.create_api_key(req.user, create_api_key_dto);
  }

  @Post('rollover')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Rollover an expired API key' })
  @ApiResponseDoc({
    status: HttpStatus.CREATED,
    description: 'API key rolled over successfully',
    type: ApiKeyResponseDto,
  })
  async rollover_api_key(
    @Req() req: { user: User },
    @Body() rollover_dto: RolloverApiKeyDto,
  ) {
    return this.apikey_service.rollover_api_key(req.user, rollover_dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all API keys for the authenticated user' })
  @ApiKeyListDocs()
  async list_api_keys(
    @Req() req: { user: User },
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('revoked') revoked?: boolean,
    @Query('is_active') is_active?: boolean,
  ) {
    return this.apikey_service.list_api_keys(
      req.user,
      page,
      limit,
      revoked,
      is_active,
    );
  }
}
