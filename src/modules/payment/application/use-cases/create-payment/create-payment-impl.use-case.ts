import { Result } from '@core/domain/result';
import { DomainEventDispatcher } from '@core/events/domain-event-dispatcher';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';

import {
  CreatePaymentUseCase,
  CreatePaymentUseCaseError,
  type CreatePaymentUseCaseInput,
  type CreatePaymentUseCaseOutput,
} from '@payment/application/use-cases/create-payment/create-payment.use-case';

import { PaymentProviders } from '@payment/domain/enum/payment-provider.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';

import { DomainExceptionGeneric } from '@core/domain/exceptions/domain.exception';
import { CreateQRCodeImage } from '@payment/application/use-cases/create-qrcode/create-qrcode.use-case';
import { PaymentAlreadyExistsException } from '@payment/domain/exceptions/payment.exception';
import { PaymentFactory } from '@payment/domain/factories/payment.factory';
import { CartGateway } from '@payment/domain/gateways/cart.gateway';
import { CreatePaymentGateway } from '@payment/domain/gateways/create-payment.gateway';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { PaymentAmountCalculator } from '@payment/domain/service/payment-amount-calculator.service';
import { IdempotencyKeyVO } from '@payment/domain/value-objects/idempotency-key.vo';
import { PixDetailVO } from '@payment/domain/value-objects/pix-detail.vo';
export type CreatePaymentUseCaseDependencies = {
  paymentFactory: PaymentFactory;
  eventDispatcher: DomainEventDispatcher;
  logger: AbstractLoggerService;
  paymentRepository: PaymentRepository;
  gateways: {
    cart: CartGateway;
    payment: CreatePaymentGateway;
  };
  useCases: {
    createQRCode: CreateQRCodeImage;
  };
  services: {
    amountCalculator: PaymentAmountCalculator;
  };
};

export class CreatePaymentUseCaseImpl implements CreatePaymentUseCase {
  constructor(private readonly deps: CreatePaymentUseCaseDependencies) {}

  async execute(
    input: CreatePaymentUseCaseInput,
  ): Promise<Result<CreatePaymentUseCaseOutput, CreatePaymentUseCaseError>> {
    try {
      this.deps.logger.log('Creating payment', {
        sessionId: input.sessionId,
        idempotencyKey: input.idempotencyKey,
      });

      const existingPayment =
        await this.deps.paymentRepository.findByIdempotencyKey(
          IdempotencyKeyVO.create(input.idempotencyKey),
        );

      if (existingPayment) {
        this.deps.logger.log('Payment already exists', {
          idempotencyKey: input.idempotencyKey,
          paymentId: existingPayment.id.value,
        });

        return Result.fail(new PaymentAlreadyExistsException());
      }

      this.deps.logger.log('Creating payment entity');

      const cart = await this.deps.gateways.cart.getCart(input.sessionId);
      const amount = this.deps.services.amountCalculator.calculate(cart);

      const payment = this.deps.paymentFactory.create({
        amount,
        type: PaymentType.PIX,
        idempotencyKey: input.idempotencyKey,
        sessionId: input.sessionId,
      });

      this.deps.logger.log('Sending payment to gateway', {
        paymentId: payment.id.value,
      });

      const createPaymentGatewayResult =
        await this.deps.gateways.payment.createPayment({
          amount: payment.amount.value,
          type: payment.type.value,
          idempotencyKey: payment.idempotencyKey.value,
          expirationTime: payment.expiresAt,
          externalReference: payment.idempotencyKey.value,
          items: cart.items.map((item) => ({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            title: item.sku,
          })),
        });

      if (createPaymentGatewayResult.isFailure) {
        this.deps.logger.error('Error creating payment', {
          error: createPaymentGatewayResult.error,
        });
        return Result.fail(createPaymentGatewayResult.error);
      }

      payment.addPaymentProvider({
        externalPaymentId: createPaymentGatewayResult.value.externalPaymentId,
        provider: PaymentProviders.MERCADO_PAGO,
      });

      this.deps.logger.log('Creating QR Code', {
        paymentId: createPaymentGatewayResult.value.qrCode,
      });

      const qrCode = await this.deps.useCases.createQRCode.execute({
        qrData: createPaymentGatewayResult.value.qrCode,
      });

      if (qrCode.isFailure) {
        this.deps.logger.error('Error creating QR Code', {
          error: qrCode.error,
        });
        return Result.fail(qrCode.error);
      }

      this.deps.logger.log('Creating payment detail');

      payment.addPaymentDetail(
        PixDetailVO.create({
          qrCode: qrCode.value.image,
        }),
      );

      await this.deps.paymentRepository.save(payment);

      this.deps.logger.log('Payment saved', { paymentId: payment.id.value });

      payment.domainEvents.forEach((event) =>
        this.deps.eventDispatcher.dispatch(event),
      );

      this.deps.logger.log('Domain events dispatched');

      return Result.ok({
        image: qrCode.value.image,
        paymentId: payment.id.value,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.deps.logger.error('Error creating payment', {
          error: error.message,
          stack: error.stack,
        });
        return Result.fail(error);
      }

      this.deps.logger.error('Unknown error creating payment', {
        error: error,
      });
      return Result.fail(
        new DomainExceptionGeneric('Unknown error creating payment'),
      );
    }
  }
}
