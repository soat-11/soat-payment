import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import {
  DefaultHttpClientResponse,
  GetMethod,
  PostMethod,
} from '@core/infra/http/client/http-client';
import { MercadoPagoCancelPaymentGatewayImpl } from '@payment/infra/acl/payments-gateway/mercado-pago/gateways/mercado-pago-cancel-payment.gateway';
import { FakeLogger } from '@test/fakes';

describe('MercadoPagoCancelPaymentGatewayImpl - Unit Test', () => {
  let gateway: MercadoPagoCancelPaymentGatewayImpl;
  let mockHttpClient: jest.Mocked<GetMethod & PostMethod>;
  let logger: FakeLogger;

  const MERCADO_PAGO_API_URL = 'https://api.mercadopago.com';
  const ORDER_ID = 'ORD01J49MMW3SSBK5PSV3DFR32959';

  const createGetOrderResponse = (
    status: string,
  ): DefaultHttpClientResponse<{ id: string; status: string }> => ({
    status: 200,
    headers: {},
    data: { id: ORDER_ID, status },
  });

  const createSuccessPostResponse = (): DefaultHttpClientResponse<object> => ({
    status: 200,
    headers: {},
    data: { status: 'success' },
  });

  const createErrorResponse = (
    statusCode: number,
    message: string,
  ): DefaultHttpClientResponse<object> => ({
    status: statusCode,
    headers: {},
    data: { message },
  });

  beforeEach(() => {
    process.env.MERCADO_PAGO_API_URL = MERCADO_PAGO_API_URL;
    process.env.MERCADO_PAGO_PAYMENT_ACCESS_TOKEN = 'test-access-token';

    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
    };
    logger = new FakeLogger();
    gateway = new MercadoPagoCancelPaymentGatewayImpl(mockHttpClient, logger);
  });

  afterEach(() => {
    delete process.env.MERCADO_PAGO_API_URL;
    delete process.env.MERCADO_PAGO_PAYMENT_ACCESS_TOKEN;
  });

  describe('GET Order Status', () => {
    it('should call GET /v1/orders/{id} with correct headers', async () => {
      mockHttpClient.get.mockResolvedValue(createGetOrderResponse('created'));
      mockHttpClient.post.mockResolvedValue(createSuccessPostResponse());

      await gateway.cancelPayment(ORDER_ID);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `${MERCADO_PAGO_API_URL}/v1/orders/${ORDER_ID}`,
        {
          headers: {
            Authorization: 'Bearer test-access-token',
          },
        },
      );
    });

    it('should return error when GET returns 404 (order not found)', async () => {
      mockHttpClient.get.mockResolvedValue(
        createErrorResponse(404, 'Order not found'),
      );

      const result = await gateway.cancelPayment(ORDER_ID);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(DomainBusinessException);
      expect(result.error.message).toBe(
        'Falha ao consultar order no Mercado Pago',
      );
    });

    it('should return error when GET returns 401 (invalid credentials)', async () => {
      mockHttpClient.get.mockResolvedValue(
        createErrorResponse(401, 'Unauthorized'),
      );

      const result = await gateway.cancelPayment(ORDER_ID);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(DomainBusinessException);
    });

    it('should return error when GET returns 500 (internal error)', async () => {
      mockHttpClient.get.mockResolvedValue(
        createErrorResponse(500, 'Internal Server Error'),
      );

      const result = await gateway.cancelPayment(ORDER_ID);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(DomainBusinessException);
    });

    it('should log error when GET fails', async () => {
      mockHttpClient.get.mockResolvedValue(
        createErrorResponse(404, 'Order not found'),
      );

      await gateway.cancelPayment(ORDER_ID);

      expect(logger.errors).toContainEqual({
        message: 'Erro ao consultar order no Mercado Pago',
        context: {
          orderId: ORDER_ID,
          status: 404,
          error: { message: 'Order not found' },
        },
      });
    });
  });

  describe('Cancel Order (status: created/action_required)', () => {
    it('should call POST /cancel when status is created', async () => {
      mockHttpClient.get.mockResolvedValue(createGetOrderResponse('created'));
      mockHttpClient.post.mockResolvedValue(createSuccessPostResponse());

      await gateway.cancelPayment(ORDER_ID);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `${MERCADO_PAGO_API_URL}/v1/orders/${ORDER_ID}/cancel`,
        {},
        expect.objectContaining({
          Authorization: 'Bearer test-access-token',
          'Content-Type': 'application/json',
        }),
      );
    });

    it('should call POST /cancel when status is action_required', async () => {
      mockHttpClient.get.mockResolvedValue(
        createGetOrderResponse('action_required'),
      );
      mockHttpClient.post.mockResolvedValue(createSuccessPostResponse());

      await gateway.cancelPayment(ORDER_ID);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `${MERCADO_PAGO_API_URL}/v1/orders/${ORDER_ID}/cancel`,
        {},
        expect.objectContaining({
          Authorization: 'Bearer test-access-token',
        }),
      );
    });

    it('should return success when /cancel returns 200', async () => {
      mockHttpClient.get.mockResolvedValue(createGetOrderResponse('created'));
      mockHttpClient.post.mockResolvedValue(createSuccessPostResponse());

      const result = await gateway.cancelPayment(ORDER_ID);

      expect(result.isSuccess).toBe(true);
    });

    it('should log start and success of cancellation', async () => {
      mockHttpClient.get.mockResolvedValue(createGetOrderResponse('created'));
      mockHttpClient.post.mockResolvedValue(createSuccessPostResponse());

      await gateway.cancelPayment(ORDER_ID);

      expect(logger.logs).toContainEqual({
        message: 'Iniciando cancelamento/reembolso de order no Mercado Pago',
        context: { orderId: ORDER_ID },
      });
      expect(logger.logs).toContainEqual({
        message: 'Cancelando order no Mercado Pago',
        context: { orderId: ORDER_ID },
      });
      expect(logger.logs).toContainEqual({
        message: 'Order cancelada com sucesso no Mercado Pago',
        context: { orderId: ORDER_ID },
      });
    });

    it('should return error when /cancel returns 409 (order already canceled)', async () => {
      mockHttpClient.get.mockResolvedValue(createGetOrderResponse('created'));
      mockHttpClient.post.mockResolvedValue(
        createErrorResponse(409, 'Order already canceled'),
      );

      const result = await gateway.cancelPayment(ORDER_ID);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(DomainBusinessException);
      expect(result.error.message).toBe(
        'Falha ao cancelar order no Mercado Pago',
      );
    });

    it('should return error when /cancel returns 400 (bad request)', async () => {
      mockHttpClient.get.mockResolvedValue(createGetOrderResponse('created'));
      mockHttpClient.post.mockResolvedValue(
        createErrorResponse(400, 'Bad request'),
      );

      const result = await gateway.cancelPayment(ORDER_ID);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(DomainBusinessException);
    });

    it('should log error when /cancel fails', async () => {
      mockHttpClient.get.mockResolvedValue(createGetOrderResponse('created'));
      mockHttpClient.post.mockResolvedValue(
        createErrorResponse(409, 'Order already canceled'),
      );

      await gateway.cancelPayment(ORDER_ID);

      expect(logger.errors).toContainEqual({
        message: 'Erro ao cancelar order no Mercado Pago',
        context: {
          orderId: ORDER_ID,
          status: 409,
          error: { message: 'Order already canceled' },
        },
      });
    });
  });

  describe('Refund Order (status: paid/processed)', () => {
    it('should call POST /refund when status is paid', async () => {
      mockHttpClient.get.mockResolvedValue(createGetOrderResponse('paid'));
      mockHttpClient.post.mockResolvedValue(createSuccessPostResponse());

      await gateway.cancelPayment(ORDER_ID);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `${MERCADO_PAGO_API_URL}/v1/orders/${ORDER_ID}/refund`,
        {},
        expect.objectContaining({
          Authorization: 'Bearer test-access-token',
          'Content-Type': 'application/json',
        }),
      );
    });

    it('should call POST /refund when status is processed', async () => {
      mockHttpClient.get.mockResolvedValue(createGetOrderResponse('processed'));
      mockHttpClient.post.mockResolvedValue(createSuccessPostResponse());

      await gateway.cancelPayment(ORDER_ID);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `${MERCADO_PAGO_API_URL}/v1/orders/${ORDER_ID}/refund`,
        {},
        expect.objectContaining({
          Authorization: 'Bearer test-access-token',
        }),
      );
    });

    it('should return success when /refund returns 200', async () => {
      mockHttpClient.get.mockResolvedValue(createGetOrderResponse('paid'));
      mockHttpClient.post.mockResolvedValue(createSuccessPostResponse());

      const result = await gateway.cancelPayment(ORDER_ID);

      expect(result.isSuccess).toBe(true);
    });

    it('should log start and success of refund', async () => {
      mockHttpClient.get.mockResolvedValue(createGetOrderResponse('paid'));
      mockHttpClient.post.mockResolvedValue(createSuccessPostResponse());

      await gateway.cancelPayment(ORDER_ID);

      expect(logger.logs).toContainEqual({
        message: 'Reembolsando order no Mercado Pago',
        context: { orderId: ORDER_ID },
      });
      expect(logger.logs).toContainEqual({
        message: 'Order reembolsada com sucesso no Mercado Pago',
        context: { orderId: ORDER_ID },
      });
    });

    it('should return error when /refund returns 409 (order already refunded)', async () => {
      mockHttpClient.get.mockResolvedValue(createGetOrderResponse('paid'));
      mockHttpClient.post.mockResolvedValue(
        createErrorResponse(409, 'Order already refunded'),
      );

      const result = await gateway.cancelPayment(ORDER_ID);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(DomainBusinessException);
      expect(result.error.message).toBe(
        'Falha ao reembolsar order no Mercado Pago',
      );
    });

    it('should return error when /refund returns 400 (bad request)', async () => {
      mockHttpClient.get.mockResolvedValue(createGetOrderResponse('paid'));
      mockHttpClient.post.mockResolvedValue(
        createErrorResponse(400, 'Bad request'),
      );

      const result = await gateway.cancelPayment(ORDER_ID);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(DomainBusinessException);
    });

    it('should log error when /refund fails', async () => {
      mockHttpClient.get.mockResolvedValue(createGetOrderResponse('paid'));
      mockHttpClient.post.mockResolvedValue(
        createErrorResponse(409, 'Order already refunded'),
      );

      await gateway.cancelPayment(ORDER_ID);

      expect(logger.errors).toContainEqual({
        message: 'Erro ao reembolsar order no Mercado Pago',
        context: {
          orderId: ORDER_ID,
          status: 409,
          error: { message: 'Order already refunded' },
        },
      });
    });
  });

  describe('Invalid Status (cannot cancel/refund)', () => {
    it('should return DomainBusinessException when status is canceled', async () => {
      mockHttpClient.get.mockResolvedValue(createGetOrderResponse('canceled'));

      const result = await gateway.cancelPayment(ORDER_ID);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(DomainBusinessException);
      expect(result.error.message).toBe(
        "Order com status 'canceled' não pode ser cancelada ou reembolsada",
      );
    });

    it('should return DomainBusinessException when status is refunded', async () => {
      mockHttpClient.get.mockResolvedValue(createGetOrderResponse('refunded'));

      const result = await gateway.cancelPayment(ORDER_ID);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(DomainBusinessException);
      expect(result.error.message).toBe(
        "Order com status 'refunded' não pode ser cancelada ou reembolsada",
      );
    });

    it('should return DomainBusinessException when status is expired', async () => {
      mockHttpClient.get.mockResolvedValue(createGetOrderResponse('expired'));

      const result = await gateway.cancelPayment(ORDER_ID);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(DomainBusinessException);
      expect(result.error.message).toBe(
        "Order com status 'expired' não pode ser cancelada ou reembolsada",
      );
    });

    it('should return DomainBusinessException when status is unknown', async () => {
      mockHttpClient.get.mockResolvedValue(
        createGetOrderResponse('unknown_status'),
      );

      const result = await gateway.cancelPayment(ORDER_ID);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(DomainBusinessException);
    });

    it('should log error when status is invalid', async () => {
      mockHttpClient.get.mockResolvedValue(createGetOrderResponse('canceled'));

      await gateway.cancelPayment(ORDER_ID);

      expect(logger.errors).toContainEqual({
        message: 'Status da order não permite cancelamento/reembolso',
        context: { orderId: ORDER_ID, status: 'canceled' },
      });
    });

    it('should not call POST when status is invalid', async () => {
      mockHttpClient.get.mockResolvedValue(createGetOrderResponse('canceled'));

      await gateway.cancelPayment(ORDER_ID);

      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });
});
