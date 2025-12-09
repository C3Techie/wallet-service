import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../entities/base-entity';
import { User } from '../../auth/entities/user.entity';

@Entity('api_keys')
export class ApiKey extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'api_key_hash', type: 'varchar', length: 255, unique: true })
  api_key_hash: string;

  @Column({ name: 'permissions', type: 'simple-array' })
  permissions: string[];

  @Column({ name: 'expires_at', type: 'timestamp with time zone' })
  expires_at: Date;

  @Column({ name: 'revoked', type: 'boolean', default: false })
  revoked: boolean;

  @ManyToOne(() => User)
  user: User;
}
