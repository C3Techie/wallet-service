import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionModelAction } from './model-actions';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction])],
  providers: [TransactionModelAction],
  exports: [TransactionModelAction],
})
export class TransactionModule {}
