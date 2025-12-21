import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { v4 as uuidv4 } from 'uuid';
import { DSL } from './dsl.factory';

export const workflows = (dsl: DSL) =>
  ({
    async createAndFetchPixPayment(sessionId?: string) {
      const input = {
        sessionId: sessionId ?? uuidv4(),
        idempotencyKey: uuidv4(),
      };

      await dsl.payment.createPixPayment(input);

      const payment = await dsl.repositories.payment.findOne({
        where: { idempotencyKey: input.idempotencyKey },
      });

      if (!payment) {
        throw new Error(
          `Payment not found for idempotencyKey: ${input.idempotencyKey}`,
        );
      }

      return { input, payment };
    },

    async createAndProcessPixPayment(sessionId?: string) {
      const { input, payment } = await this.createAndFetchPixPayment(sessionId);

      await dsl.payment.simulateProcessedWebhook({
        externalReference: payment.idempotencyKey,
      });

      const updatedPayment = await dsl.repositories.payment.findOne({
        where: { idempotencyKey: input.idempotencyKey },
      });

      return { input, payment: updatedPayment };
    },

    async createAndCancelPixPayment(sessionId?: string) {
      const { input, payment } = await this.createAndFetchPixPayment(sessionId);

      await dsl.payment
        .simulateCanceledWebhook({
          externalReference: payment.idempotencyKey,
        })
        .expect(200);

      const updatedPayment = await dsl.repositories.payment.findOne({
        where: { idempotencyKey: input.idempotencyKey },
      });

      return { input, payment: updatedPayment };
    },

    async validatePaymentStatus(
      idempotencyKey: string,
      expectedStatus: PaymentStatus,
    ) {
      const payment = await dsl.repositories.payment.findOne({
        where: { idempotencyKey },
      });

      if (!payment) {
        throw new Error(
          `Payment not found for idempotencyKey: ${idempotencyKey}`,
        );
      }

      if (payment.status !== expectedStatus) {
        throw new Error(
          `Expected payment status to be ${expectedStatus}, but got ${payment.status}`,
        );
      }

      return payment;
    },

    async validatePaymentAmount(
      idempotencyKey: string,
      expectedAmount: number,
    ) {
      const payment = await dsl.repositories.payment.findOne({
        where: { idempotencyKey },
      });

      if (!payment) {
        throw new Error(
          `Payment not found for idempotencyKey: ${idempotencyKey}`,
        );
      }

      if (payment.amount !== expectedAmount) {
        throw new Error(
          `Expected payment amount to be ${expectedAmount}, but got ${payment.amount}`,
        );
      }

      return payment;
    },

    async completePaymentFlow(sessionId?: string) {
      const { input, payment } =
        await this.createAndProcessPixPayment(sessionId);

      await this.validatePaymentStatus(
        input.idempotencyKey,
        PaymentStatus.PAID,
      );

      return { input, payment };
    },
  }) as const;

export type Workflows = ReturnType<typeof workflows>;
