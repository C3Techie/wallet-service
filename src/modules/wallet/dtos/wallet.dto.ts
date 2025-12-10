import { IsNumber, Min, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DepositDto {
  @ApiProperty({ description: 'Amount to deposit in kobo', example: 5000 })
  @IsNumber()
  @Min(1)
  amount: number;
}

export class TransferDto {
  @ApiProperty({
    description: 'Recipient wallet number',
    example: '4566678954356',
  })
  @IsString()
  @IsNotEmpty()
  wallet_number: string;

  @ApiProperty({ description: 'Amount to transfer in kobo', example: 3000 })
  @IsNumber()
  @Min(1)
  amount: number;
}

export class DepositResponseDto {
  @ApiProperty({ description: 'Transaction reference' })
  reference: string;

  @ApiProperty({ description: 'Paystack authorization URL' })
  authorization_url: string;
}

export class BalanceResponseDto {
  @ApiProperty({ description: 'Wallet balance in kobo', example: 15000 })
  balance: number;
  @ApiProperty({ description: 'Wallet number', example: '1234567890123' })
  wallet_number: string;
}

export class TransferResponseDto {
  @ApiProperty({ description: 'Transfer status' })
  status: string;

  @ApiProperty({ description: 'Transfer message' })
  message: string;

  @ApiProperty({ description: 'Sender wallet number' })
  sender_wallet_number: string;

  @ApiProperty({ description: 'Recipient wallet number' })
  recipient_wallet_number: string;

  @ApiProperty({ description: 'Transaction reference' })
  reference: string;
}

export class TransactionStatusResponseDto {
  @ApiProperty({ description: 'Transaction reference' })
  reference: string;

  @ApiProperty({ description: 'Transaction status' })
  status: string;

  @ApiProperty({ description: 'Transaction amount in kobo' })
  amount: number;
}

export class TransactionHistoryDto {
  @ApiProperty({ description: 'Transaction type' })
  type: string;

  @ApiProperty({ description: 'Transaction amount in kobo' })
  amount: number;

  @ApiProperty({ description: 'Transaction status' })
  status: string;

  @ApiProperty({
    description: 'Transaction direction (sent, received, deposit)',
  })
  direction: string;

  @ApiProperty({ description: 'Transaction reference' })
  reference: string;

  @ApiProperty({ description: 'Transaction timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'Sender wallet number (for received transfers)', required: false })
  sender_wallet_number?: string;

  @ApiProperty({ description: 'Recipient wallet number (for sent transfers)', required: false })
  recipient_wallet_number?: string;
}
