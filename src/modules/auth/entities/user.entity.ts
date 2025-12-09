import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from '../../../entities/base-entity';

@Entity('users')
@Unique(['email'])
export class User extends BaseEntity {
  @Column({ name: 'email', type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'google_id', type: 'varchar', length: 255, nullable: true })
  google_id: string;

  @Column({ name: 'name', type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ name: 'avatar', type: 'varchar', length: 512, nullable: true })
  avatar: string;
}
