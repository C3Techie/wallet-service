import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for Paystack webhook signature verification
  });

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, X-API-KEY, Accept',
  });

  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  const apiVersion = configService.get<string>('API_VERSION', 'v1');
  const globalPrefix = `${apiPrefix}/${apiVersion}`;

  app.setGlobalPrefix(globalPrefix, {
    exclude: ['docs'],
  });

  // Global interceptors
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new ResponseTransformInterceptor(reflector),
    new LoggingInterceptor(),
  );

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Wallet Service API')
    .setDescription('API documentation for the Wallet Service')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'JWT',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'Enter your API key',
      },
      'API-KEY',
    )
    .addTag('Authentication')
    .addTag('Wallet')
    .addTag('API Keys')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = configService.get<string>('PORT', '3000');
  const env = configService.get<string>('NODE_ENV', 'development');

  await app.listen(port);

  console.log(`\n------------\nWallet Service Started!\nEnvironment: ${env}\nAPI: http://localhost:${port}/${globalPrefix}\nAPI Docs: http://localhost:${port}/docs\n------------\n`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
