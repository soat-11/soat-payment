import {
  Controller,
  Get,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { HttpLoggerMiddleware } from '@core/infra/middleware/http-logger.middleware';


@Controller('test')
class TestController {
  @Get()
  get() {
    return { message: 'ok' };
  }

  @Get('error')
  error() {
    throw new Error('Test Error');
  }
}

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
};


@Module({
  controllers: [TestController],
  providers: [
    {
      provide: AbstractLoggerService,
      useValue: mockLogger,
    },
  ],
})
class TestModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}

describe('HttpLoggerMiddleware (Integration)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should log incoming request and outgoing response for successful request', async () => {
    await request(app.getHttpServer()).get('/test').expect(200);


    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringContaining('Incoming Request: GET /test'),
      expect.objectContaining({
        req: expect.objectContaining({
          method: 'GET',
          url: '/test',
        }),
        context: 'HttpLoggerMiddleware',
      }),
    );


    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringContaining('Outgoing Response: GET /test 200'),
      expect.objectContaining({
        res: expect.objectContaining({
          statusCode: 200,
        }),
        context: 'HttpLoggerMiddleware',
      }),
    );
  });

  it('should log outgoing response even for errors (500)', async () => {
    await request(app.getHttpServer()).get('/test/error').expect(500);


    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringContaining('Outgoing Response: GET /test/error 500'),
      expect.objectContaining({
        res: expect.objectContaining({
          statusCode: 500,
        }),
        context: 'HttpLoggerMiddleware',
      }),
    );
  });
});
