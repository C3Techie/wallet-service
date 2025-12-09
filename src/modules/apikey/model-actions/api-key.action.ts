import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '../../../common/base';
import { ApiKey } from '../entities/api-key.entity';

@Injectable()
export class ApiKeyModelAction extends AbstractModelAction<ApiKey> {
  constructor(
    @InjectRepository(ApiKey)
    private api_key_repository: Repository<ApiKey>,
  ) {
    super(api_key_repository);
  }
}
