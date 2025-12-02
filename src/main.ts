import { InstrumentationService } from '@core/infra/instrumentation';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PinoLoggerService } from '@core/infra/logger/pino-logger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { GlobalExceptionFilter } from '@core/infra/filters/global-exception.filter';
import { HttpAdapterHost } from '@nestjs/core';
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

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(
    `📚 Swagger docs available at: http://localhost:${port}/api/docs`,
  );

  process.on('SIGTERM', async () => {
    console.log('⚠️  SIGTERM signal received: closing HTTP server');
    await InstrumentationService.shutdown();
    await app.close();
  });

  process.on('SIGINT', async () => {
    console.log('⚠️  SIGINT signal received: closing HTTP server');
    await InstrumentationService.shutdown();
    await app.close();
  });
}
bootstrap();
