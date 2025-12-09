import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from './entities/api-key.entity';
import { ApikeyController } from './apikey.controller';
import { ApikeyService } from './apikey.service';
import { ApiKeyModelAction } from './model-actions';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey])],
  controllers: [ApikeyController],
  providers: [ApikeyService, ApiKeyModelAction],
  exports: [ApikeyService, ApiKeyModelAction],
})
export class ApikeyModule {}
