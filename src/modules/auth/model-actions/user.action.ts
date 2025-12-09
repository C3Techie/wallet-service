import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '../../../common/base';
import { User } from '../entities/user.entity';

@Injectable()
export class UserModelAction extends AbstractModelAction<User> {
  constructor(
    @InjectRepository(User)
    private user_repository: Repository<User>,
  ) {
    super(user_repository);
  }
}
