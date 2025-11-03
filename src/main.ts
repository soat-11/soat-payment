import '@core/infra/instrumentation';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PinoLoggerService } from '@core/infra/logger/pino-logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(new PinoLoggerService());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
