import { InstrumentationService } from '@core/infra/instrumentation';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PinoLoggerService } from '@core/infra/logger/pino-logger';

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

  const config = new DocumentBuilder()
    .setTitle('SOAT Payment API')
    .setDescription(
      'API de pagamentos do sistema SOAT implementada com DDD e Clean Architecture',
    )
    .setVersion('1.0')
    .addTag('Payments', 'Endpoints relacionados a pagamentos')
    .build();

  const document = SwaggerModule.createDocument(app, config);
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
