import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '../../../common/base';
import { Transaction } from '../entities/transaction.entity';

@Injectable()
export class TransactionModelAction extends AbstractModelAction<Transaction> {
  constructor(
    @InjectRepository(Transaction)
    private transaction_repository: Repository<Transaction>,
  ) {
    super(transaction_repository);
  }
}
