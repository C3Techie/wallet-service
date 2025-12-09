import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { ApikeyModule } from './modules/apikey/apikey.module';
import { PaystackModule } from './modules/paystack/paystack.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: parseInt(configService.get<string>('DB_PORT', '5432'), 10),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASS', ''),
        database: configService.get<string>('DB_NAME', ''),
        entities: [__dirname + '/modules/**/entities/*.entity.{ts,js}'],
        synchronize: false,
        ssl:
          configService.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config_service: ConfigService) => ({
        secret: config_service.get('JWT_SECRET'),
        signOptions: {
          expiresIn: config_service.get('JWT_EXPIRATION', '7d'),
        },
      }),
    }),
    AuthModule,
    WalletModule,
    TransactionModule,
    ApikeyModule,
    PaystackModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
  ],
})
export class AppModule {}
