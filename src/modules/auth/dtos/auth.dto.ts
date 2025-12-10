import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoogleAuthCallbackDto {
  @ApiProperty({ description: 'Google ID token' })
  @IsString()
  @IsNotEmpty()
  id_token: string;
}

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiPropertyOptional({ description: 'User name' })
  name?: string;

  @ApiPropertyOptional({ description: 'User avatar URL' })
  avatar?: string;

  @ApiProperty({ description: 'Created at timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updated_at: Date;
}

export class WalletResponseDto {
  @ApiProperty({ description: 'Wallet ID' })
  id: string;

  @ApiProperty({ description: 'Wallet number' })
  wallet_number: string;
  
  @ApiProperty({ description: 'Created at timestamp' })
  created_at: Date;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  access_token: string;

  @ApiProperty({ description: 'Token type', example: 'Bearer' })
  token_type: string;

  @ApiProperty({ description: 'User data', type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ description: 'Wallet data', type: WalletResponseDto })
  wallet: WalletResponseDto;
}
