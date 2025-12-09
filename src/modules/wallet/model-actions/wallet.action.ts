import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '../../../common/base';
import { Wallet } from '../entities/wallet.entity';

@Injectable()
export class WalletModelAction extends AbstractModelAction<Wallet> {
  constructor(
    @InjectRepository(Wallet)
    private wallet_repository: Repository<Wallet>,
  ) {
    super(wallet_repository);
  }
}
