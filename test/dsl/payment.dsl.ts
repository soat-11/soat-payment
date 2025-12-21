import { CreatePaymentConsumer } from '@payment/presentation/consumers/sqs-create-payment-consumer';
import { v4 as uuidv4 } from 'uuid';
import { AbstractDSL } from './abstract.dsl';

export interface CreatePixPaymentInput {
  sessionId?: string;
  idempotencyKey?: string;
}

export interface SimulateWebhookInput {
  externalReference: string;
  paymentId?: string;
}

export class PaymentDSL extends AbstractDSL {
  private consumer: CreatePaymentConsumer | null = null;

  private getConsumer(): CreatePaymentConsumer {
    if (!this.consumer) {
      this.consumer = this.app.get(CreatePaymentConsumer);
    }

    return this.consumer!;
  }

  async createPixPayment(input: CreatePixPaymentInput = {}) {
    const payload = {
      sessionId: input.sessionId ?? uuidv4(),
      idempotencyKey: input.idempotencyKey ?? uuidv4(),
    };

    await this.getConsumer().handleMessage(payload);

    return payload;
  }

  simulateProcessedWebhook(input: SimulateWebhookInput) {
    return this.req()
      .post('webhooks/mercado-pago')
      .set(this.headers)
      .send({
        external_reference: input.externalReference,
        id: input.paymentId ?? uuidv4(),
      })
      .expect(200)
      .then((response) => {
        return response.body;
      });
  }

  simulateCanceledWebhook(input: SimulateWebhookInput) {
    return this.req()
      .post('webhooks/mercado-pago')
      .set(this.headers)
      .send({
        external_reference: input.externalReference,
        id: input.paymentId ?? uuidv4(),
      });
  }

  simulateRefundedWebhook(input: SimulateWebhookInput) {
    return this.req()
      .post('webhooks/mercado-pago')
      .set(this.headers)
      .send({
        external_reference: input.externalReference,
        id: input.paymentId ?? uuidv4(),
      });
  }

  simulateExpiredWebhook(input: SimulateWebhookInput) {
    return this.req()
      .post('webhooks/mercado-pago')
      .set(this.headers)
      .send({
        external_reference: input.externalReference,
        id: input.paymentId ?? uuidv4(),
      });
  }

  sendMercadoPagoWebhook(payload: Record<string, unknown>) {
    return this.req()
      .post('/webhooks/mercado-pago')
      .set(this.headers)
      .send(payload);
  }
}
