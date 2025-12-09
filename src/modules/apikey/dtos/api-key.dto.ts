import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsEnum,
  ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ApiKeyExpiry {
  ONE_HOUR = '1H',
  ONE_DAY = '1D',
  ONE_MONTH = '1M',
  ONE_YEAR = '1Y',
}

export enum ApiKeyPermission {
  DEPOSIT = 'deposit',
  TRANSFER = 'transfer',
  READ = 'read',
}

export class CreateApiKeyDto {
  @ApiProperty({ description: 'API key name', example: 'wallet-service' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Permissions for the API key',
    example: ['deposit', 'transfer', 'read'],
    enum: ApiKeyPermission,
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(ApiKeyPermission, { each: true })
  permissions: ApiKeyPermission[];

  @ApiProperty({
    description: 'Expiry duration',
    example: '1D',
    enum: ApiKeyExpiry,
  })
  @IsEnum(ApiKeyExpiry)
  @IsNotEmpty()
  expiry: ApiKeyExpiry;
}

export class RolloverApiKeyDto {
  @ApiProperty({
    description: 'ID of the expired API key',
    example: 'FGH2485K6KK79GKG9GKGK',
  })
  @IsString()
  @IsNotEmpty()
  expired_key_id: string;

  @ApiProperty({
    description: 'Expiry duration for new key',
    example: '1M',
    enum: ApiKeyExpiry,
  })
  @IsEnum(ApiKeyExpiry)
  @IsNotEmpty()
  expiry: ApiKeyExpiry;
}

export class ApiKeyResponseDto {
  @ApiProperty({ description: 'API key ID' })
  id: string;

  @ApiProperty({ description: 'Generated API key' })
  api_key: string;

  @ApiProperty({ description: 'Expiration date' })
  expires_at: Date;
}

export class ApiKeyListItemDto {
  @ApiProperty({ description: 'API key ID' })
  id: string;

  @ApiProperty({ description: 'API key name' })
  name: string;

  @ApiProperty({ description: 'Masked API key (last 8 characters)' })
  api_key_preview: string;

  @ApiProperty({
    description: 'Key permissions',
    example: ['deposit', 'transfer', 'read'],
  })
  permissions: string[];

  @ApiProperty({ description: 'Expiration date' })
  expires_at: Date;

  @ApiProperty({ description: 'Whether key is revoked' })
  revoked: boolean;

  @ApiProperty({ description: 'Whether key is expired' })
  is_expired: boolean;

  @ApiProperty({ description: 'Whether key is active' })
  is_active: boolean;

  @ApiProperty({ description: 'Creation date' })
  created_at: Date;
}
