import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../entities/base-entity';
import { Wallet } from '../../wallet/entities/wallet.entity';

@Entity('transactions')
export class Transaction extends BaseEntity {
  @Column({ name: 'type', type: 'varchar', length: 20 })
  type: string; // deposit, transfer

  @Column({ name: 'amount', type: 'bigint' })
  amount: number;

  @Column({ name: 'status', type: 'varchar', length: 20 })
  status: string; // success, failed, pending

  @Column({ name: 'reference', type: 'varchar', length: 255, nullable: true })
  reference: string;

  @ManyToOne(() => Wallet)
  wallet: Wallet;

  @Column({
    name: 'recipient_wallet_number',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  recipient_wallet_number: string;
}
