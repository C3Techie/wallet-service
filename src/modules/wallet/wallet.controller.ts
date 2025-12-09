import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Headers,
  RawBodyRequest,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse as ApiResponseDoc,
  ApiHeader,
  ApiSecurity,
} from '@nestjs/swagger';
import { WalletTransactionHistoryDocs } from './decorators/wallet-transaction-history-docs.decorator';
import { WalletService } from './wallet.service';
import {
  DepositDto,
  TransferDto,
  DepositResponseDto,
  BalanceResponseDto,
  TransferResponseDto,
  TransactionStatusResponseDto,
  TransactionHistoryDto,
} from './dtos';
import { JwtOrApiKeyGuard } from '../../common/guards';
import { User } from '../auth/entities/user.entity';
import { SkipWrap, RequirePermission } from '../../common/decorators';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(private wallet_service: WalletService) {}

  @Post('deposit')
  @UseGuards(JwtOrApiKeyGuard)
  @RequirePermission('deposit')
  @ApiBearerAuth('JWT')
  @ApiSecurity('API-KEY')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Initialize a deposit using Paystack (JWT or API key with "deposit" permission)',
  })
  @ApiResponseDoc({
    status: HttpStatus.CREATED,
    description: 'Deposit initialized successfully',
    type: DepositResponseDto,
  })
  async deposit(@Req() req: { user: User }, @Body() deposit_dto: DepositDto) {
    return this.wallet_service.deposit(req.user, deposit_dto);
  }

  @Post('paystack/webhook')
  @SkipWrap()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Paystack webhook events' })
  @ApiHeader({ name: 'x-paystack-signature', required: true })
  @ApiResponseDoc({
    status: HttpStatus.OK,
    description: 'Webhook processed successfully',
  })
  async handle_webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature: string,
  ) {
    // Always pass a string to signature verification to avoid undefined errors
    let raw_body: string;
    if (req.rawBody && typeof req.rawBody !== 'undefined') {
      raw_body = req.rawBody.toString();
    } else if (req.body && typeof req.body !== 'undefined') {
      raw_body = JSON.stringify(req.body);
    } else {
      raw_body = '';
    }
    return await this.wallet_service.handle_webhook(raw_body, signature);
  }

  @Get('balance')
  @UseGuards(JwtOrApiKeyGuard)
  @RequirePermission('read')
  @ApiBearerAuth('JWT')
  @ApiSecurity('API-KEY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get wallet balance (JWT or API key with "read" permission)',
  })
  @ApiResponseDoc({
    status: HttpStatus.OK,
    description: 'Wallet balance retrieved successfully',
    type: BalanceResponseDto,
  })
  async get_balance(@Req() req: { user: User }) {
    return this.wallet_service.get_balance(req.user);
  }

  @Post('transfer')
  @UseGuards(JwtOrApiKeyGuard)
  @RequirePermission('transfer')
  @ApiBearerAuth('JWT')
  @ApiSecurity('API-KEY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Transfer funds to another wallet (JWT or API key with "transfer" permission)',
  })
  @ApiResponseDoc({
    status: HttpStatus.OK,
    description: 'Transfer completed successfully',
    type: TransferResponseDto,
  })
  async transfer(
    @Req() req: { user: User },
    @Body() transfer_dto: TransferDto,
  ) {
    return this.wallet_service.transfer(req.user, transfer_dto);
  }

  @Get('deposit/:reference/status')
  @UseGuards(JwtOrApiKeyGuard)
  @RequirePermission('read')
  @ApiBearerAuth('JWT')
  @ApiSecurity('API-KEY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get deposit transaction status (JWT or API key with "read" permission)',
  })
  @ApiResponseDoc({
    status: HttpStatus.OK,
    description: 'Transaction status retrieved successfully',
    type: TransactionStatusResponseDto,
  })
  async get_deposit_status(
    @Req() req: { user: User },
    @Param('reference') reference: string,
  ) {
    return this.wallet_service.get_transaction_status(req.user, reference);
  }

  @Get('transactions')
  @UseGuards(JwtOrApiKeyGuard)
  @RequirePermission('read')
  @ApiBearerAuth('JWT')
  @ApiSecurity('API-KEY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get transaction history (JWT or API key with "read" permission)',
  })
  @WalletTransactionHistoryDocs()
  async get_transactions(
    @Req() req: { user: User },
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('direction') direction?: string,
  ) {
    return this.wallet_service.get_transactions(
      req.user,
      page,
      limit,
      type,
      status,
      direction,
    );
  }
}
