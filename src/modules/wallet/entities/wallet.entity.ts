import { Entity, Column, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../entities/base-entity';
import { User } from '../../auth/entities/user.entity';

@Entity('wallets')
@Unique(['wallet_number'])
export class Wallet extends BaseEntity {
  @Column({ name: 'wallet_number', type: 'varchar', length: 20 })
  wallet_number: string;

  @Column({ name: 'balance', type: 'bigint', default: 0 })
  balance: number;

  @ManyToOne(() => User)
  user: User;
}
