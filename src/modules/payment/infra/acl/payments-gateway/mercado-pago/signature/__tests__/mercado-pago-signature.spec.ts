import { HMACMercadoPagoSignature } from '../mercado-pago-signature';

describe('HMACMercadoPagoSignature', () => {
  const headers = {
    xSignature:
      'ts=1748400112156,v1=e53b37321a75cabff441fc545f9376dbde9f61d16382b62ba280300016209f99',
    xRequestId: '9031bfbf-3602-4fb6-b722-7e48c37dc50e',
  };

  const body = {
    action: 'payment.updated',
    api_version: 'v1',
    data: { id: '123456' },
    date_created: '2021-11-01T02:02:02Z',
    id: '123456',
    live_mode: false,
    type: 'payment',
    user_id: 246696626,
  };

  beforeAll(() => {
    // Configura a variável de ambiente para o teste
    process.env.MERCADO_PAGO_WEBHOOK_SECRET_KEY =
      'c9684d90b39a4cd3845ea6a0d87a06c1';
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

  it('should return true when secret is not configured', async () => {
    const originalSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET_KEY;
    delete process.env.MERCADO_PAGO_WEBHOOK_SECRET_KEY;

    const signature = new HMACMercadoPagoSignature();
    const response = await signature.execute({
      data: body.data.id,
      xSignature: headers.xSignature,
      xRequestId: headers.xRequestId,
    });

    expect(response).toBe(true);

    process.env.MERCADO_PAGO_WEBHOOK_SECRET_KEY = originalSecret;
  });
});

