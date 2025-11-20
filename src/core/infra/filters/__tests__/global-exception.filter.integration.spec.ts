import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, HttpException, HttpStatus, INestApplication, Module } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import request from 'supertest';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { GlobalExceptionFilter } from '../global-exception.filter';


@Controller('test')
class TestController {
  @Get('forbidden')
  forbidden() {
    throw new HttpException('Forbidden Access', HttpStatus.FORBIDDEN);
  }

  @Get('error')
  error() {
    throw new Error('Unexpected System Error');
  }
}

const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
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
class TestModule {}

describe('GlobalExceptionFilter (Integration)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    const httpAdapter = app.get(HttpAdapterHost);
    const logger = app.get<AbstractLoggerService>(AbstractLoggerService);
    app.useGlobalFilters(new GlobalExceptionFilter(httpAdapter, logger));

    await app.init();
  });

  afterEach(async () => {
    await app.close()
  });

  it('should catch HttpException, return correct status and log as warn', async () => {
    const response = await request(app.getHttpServer())
      .get('/test/forbidden')
      .expect(403);

    // Verifica Corpo da Resposta
    expect(response.body).toMatchObject({
      statusCode: 403,
      message: 'Forbidden Access',
      path: '/test/forbidden',
    });

    // Verifica Log (Warn para erros 4xx/conhecidos)
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Global Exception Filter (Handled): Forbidden Access'),
      expect.objectContaining({
        statusCode: 403,
        context: 'GlobalExceptionFilter',
      }),
    );
  });

  it('should catch unknown Error, return 500 and log as error', async () => {
    const response = await request(app.getHttpServer())
      .get('/test/error')
      .expect(500);

    // Verifica Corpo da Resposta
    expect(response.body).toMatchObject({
      statusCode: 500,
      message: 'Internal server error',
      path: '/test/error',
    });

    // Verifica Log (Error para erros 500/desconhecidos)
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Global Exception Filter: Internal server error'),
      expect.objectContaining({
        error: expect.any(Error),
        context: 'GlobalExceptionFilter',
        req: expect.objectContaining({
          method: 'GET',
          url: '/test/error',
        }),
      }),
    );
  });
});
