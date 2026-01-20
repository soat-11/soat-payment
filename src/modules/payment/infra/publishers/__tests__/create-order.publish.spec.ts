/* eslint-disable @typescript-eslint/no-explicit-any */

import { Test, TestingModule } from '@nestjs/testing';

import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { CreateOrderPublish } from '@payment/infra/publishers/create-order.publish';

describe('CreateOrderPublish', () => {
  let service: CreateOrderPublish;

  const originalEnv = process.env;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  const mockSqsClient = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...originalEnv };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrderPublish,

        {
          provide: AbstractLoggerService,
          useValue: mockLogger,
        },

        {
          provide: 'SQS_CLIENT',
          useValue: mockSqsClient,
        },
      ],
    }).compile();

    service = module.get<CreateOrderPublish>(CreateOrderPublish);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  describe('queueUrl', () => {
    it('deve retornar a URL correta quando a variável de ambiente estiver definida', () => {
      // Arrange
      const expectedUrl = 'https://sqs.us-east-1.amazonaws.com/123/order-queue';
      process.env['AWS_SQS_CREATE_ORDER_QUEUE_URL'] = expectedUrl;

      const result = (service as any).queueUrl;

      expect(result).toBe(expectedUrl);
    });

    it('deve lançar um erro quando a variável de ambiente NÃO estiver definida', () => {
      delete process.env['AWS_SQS_CREATE_ORDER_QUEUE_URL'];

      expect(() => {
        return (service as any).queueUrl;
      }).toThrow('AWS_SQS_CREATE_ORDER_QUEUE_URL is not set');
    });

    it('deve lançar um erro quando a variável de ambiente estiver vazia', () => {
      process.env['AWS_SQS_CREATE_ORDER_QUEUE_URL'] = '';

      expect(() => {
        return (service as any).queueUrl;
      }).toThrow('AWS_SQS_CREATE_ORDER_QUEUE_URL is not set');
    });
  });
});
