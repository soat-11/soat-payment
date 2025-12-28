import { Logger, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

import { GlobalExceptionFilter } from '@core/infra/filters/global-exception.filter';
import { InstrumentationService } from '@core/infra/instrumentation';
import { PinoLoggerService } from '@core/infra/logger/pino-logger';

import { AppModule } from './app.module';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(new PinoLoggerService());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new GlobalExceptionFilter(httpAdapter, new PinoLoggerService()),
  );

  const config = new DocumentBuilder()
    .setTitle('SOAT Payment API')
    .setDescription(
      'API de pagamentos do sistema SOAT implementada com DDD e Clean Architecture',
    )
    .setVersion('1.0')
    .addTag('Payments', 'Endpoints relacionados a pagamentos')
    .addTag(
      'SQS Consumers',
      'Documentação do formato das mensagens SQS consumidas pelo serviço',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.use(
    '/api/docs',
    apiReference({
      content: document,
      darkMode: true,
      theme: 'laserwave',
    }),
  );
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  process.on('SIGTERM', async () => {
    Logger.log('SIGTERM signal received: closing HTTP server');
    await InstrumentationService.shutdown();
    await app.close();
  });

  process.on('SIGINT', async () => {
    Logger.log('SIGINT signal received: closing HTTP server');
    await InstrumentationService.shutdown();
    await app.close();
  });
}
bootstrap();
