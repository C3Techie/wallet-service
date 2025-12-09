import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from '../transaction/entities/transaction.entity';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletModelAction } from './model-actions';
import { TransactionModelAction } from '../transaction/model-actions';
import { PaystackModule } from '../paystack/paystack.module';
import { ApikeyModule } from '../apikey/apikey.module';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, Transaction, User]),
    PaystackModule,
    ApikeyModule,
    AuthModule,
  ],
  controllers: [WalletController],
  providers: [WalletService, WalletModelAction, TransactionModelAction],
  exports: [WalletService, WalletModelAction],
})
export class WalletModule {}
