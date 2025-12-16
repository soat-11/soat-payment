import { createHmac } from 'crypto';
import { HMACMercadoPagoSignature } from '../mercado-pago-signature';

describe('HMACMercadoPagoSignature', () => {
  const TEST_SECRET = 'c9684d90b39a4cd3845ea6a0d87a06c1';
  const testData = {
    id: '123456',
    requestId: '9031bfbf-3602-4fb6-b722-7e48c37dc50e',
    ts: '1748400112156',
  };

  // Calcula a assinatura correta para os dados de teste
  const computeValidSignature = () => {
    const manifest = `id:${testData.id};request-id:${testData.requestId};ts:${testData.ts};`;
    const hmac = createHmac('sha256', TEST_SECRET);
    hmac.update(manifest);
    return hmac.digest('hex');
  };

  const headers = {
    xSignature: `ts=${testData.ts},v1=${computeValidSignature()}`,
    xRequestId: testData.requestId,
  };

  const body = {
    action: 'payment.updated',
    api_version: 'v1',
    data: { id: testData.id },
    date_created: '2021-11-01T02:02:02Z',
    id: testData.id,
    live_mode: false,
    type: 'payment',
    user_id: 246696626,
  };

  beforeAll(() => {
    // Configura a variável de ambiente para o teste
    process.env.MERCADO_PAGO_WEBHOOK_SECRET_KEY = TEST_SECRET;
  });

  afterAll(() => {
    delete process.env.MERCADO_PAGO_WEBHOOK_SECRET_KEY;
  });

  it('should validate signature correctly', async () => {
    const signature = new HMACMercadoPagoSignature();
    const response = await signature.execute({
      data: body.data.id,
      xSignature: headers.xSignature,
      xRequestId: headers.xRequestId,
    });

    expect(response).toBe(true);
  });

  it('should return false for invalid signature', async () => {
    const signature = new HMACMercadoPagoSignature();
    const response = await signature.execute({
      data: body.data.id,
      xSignature: 'ts=1234567890,v1=invalidsignature',
      xRequestId: headers.xRequestId,
    });

    expect(response).toBe(false);
  });

  it('should return false for missing xSignature', async () => {
    const signature = new HMACMercadoPagoSignature();
    const response = await signature.execute({
      data: body.data.id,
      xSignature: '',
      xRequestId: headers.xRequestId,
    });

    expect(response).toBe(false);
  });

  it('should return false for missing xRequestId', async () => {
    const signature = new HMACMercadoPagoSignature();
    const response = await signature.execute({
      data: body.data.id,
      xSignature: headers.xSignature,
      xRequestId: '',
    });

    expect(response).toBe(false);
  });

  it('should return false when secret is not configured', async () => {
    const originalSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET_KEY;
    delete process.env.MERCADO_PAGO_WEBHOOK_SECRET_KEY;

    const signature = new HMACMercadoPagoSignature();
    const response = await signature.execute({
      data: body.data.id,
      xSignature: headers.xSignature,
      xRequestId: headers.xRequestId,
    });

    expect(response).toBe(false);

    process.env.MERCADO_PAGO_WEBHOOK_SECRET_KEY = originalSecret;
  });
});

