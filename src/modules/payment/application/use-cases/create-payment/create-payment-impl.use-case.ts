import { DomainPersistenceException } from '@core/domain/exceptions/domain.exception';
import { DomainEventDispatcher } from '@core/events/domain-event-dispatcher';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';

import {
  CreatePaymentUseCase,
  type CreatePaymentUseCaseInput,
  type CreatePaymentUseCaseOutput,
} from '@payment/application/use-cases/create-payment/create-payment.use-case';

import { PaymentType } from '@payment/domain/enum/payment-type.enum';

import { PaymentFactory } from '@payment/domain/factories/payment.factory';
import { CreateQRCodeImage } from '@payment/application/use-cases/create-qrcode/create-qrcode.use-case';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { PixDetailVO } from '@payment/domain/value-objects/pix-detail.vo';
import { IdempotencyKeyVO } from '@payment/domain/value-objects/idempotency-key.vo';
import { PaymentAlreadyExistsException } from '@payment/domain/exceptions/payment.exception';
import { CartGateway } from '@payment/domain/gateways/cart.gateway';
import { PaymentAmountCalculator } from '@payment/domain/service/payment-amount-calculator.service';
import { CreatePaymentGateway } from '@payment/domain/gateways/create-payment.gateway';

export class CreatePaymentUseCaseImpl implements CreatePaymentUseCase {
  constructor(
    private readonly paymentFactory: PaymentFactory,
    private readonly eventDispatcher: DomainEventDispatcher,
    private readonly logger: AbstractLoggerService,
    private readonly createQRCodeUseCase: CreateQRCodeImage,
    private readonly paymentRepository: PaymentRepository,
    private readonly cartGateway: CartGateway,
    private readonly paymentAmountCalculator: PaymentAmountCalculator,
    private readonly createPaymentGateway: CreatePaymentGateway
  ) {}

  async execute(
    input: CreatePaymentUseCaseInput,
  ): Promise<CreatePaymentUseCaseOutput> {
    this.logger.log('Creating payment', {
      sessionId: input.sessionId,
      idempotencyKey: input.idempotencyKey,
    });

    try {
      const existingPayment = await this.paymentRepository.findByIdempotencyKey(
        IdempotencyKeyVO.create(input.idempotencyKey),
      );

      if (existingPayment) throw new PaymentAlreadyExistsException();

      this.logger.log('Creating payment entity');

      const cart = await this.cartGateway.getCart(input.sessionId);
      const amount = this.paymentAmountCalculator.calculate(cart);

      const payment = this.paymentFactory.create({
        amount,
        type: PaymentType.PIX,
        idempotencyKey: input.idempotencyKey,
        sessionId: input.sessionId,
      });

      this.logger.log('Sending payment to gateway', { paymentId: payment.id.value });

      const createPaymentGatewayResult = await this.createPaymentGateway.createPayment({
        amount: payment.amount.value,
        type: payment.type.value,
        idempotencyKey: payment.idempotencyKey.value,
        expirationTime: payment.expiresAt,
        externalReference: payment.idempotencyKey.value,
        items: cart.items.map(item => ({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          title: item.sku
        })),
      });

      if (createPaymentGatewayResult.isFailure) {
        this.logger.error('Error creating payment', { error: createPaymentGatewayResult.error });
        throw createPaymentGatewayResult.error;
      }

      this.logger.log('Creating QR Code', { paymentId: createPaymentGatewayResult.value.qrCode });


      const qrCode = await this.createQRCodeUseCase.execute({
        qrData: createPaymentGatewayResult.value.qrCode,
      });

      if (qrCode.isFailure) {
        this.logger.error('Error creating QR Code', { error: qrCode.error });
        throw qrCode.error;
      }

      this.logger.log('Creating payment detail');

      payment.addPaymentDetail(
        PixDetailVO.create({
          qrCode: qrCode.value.image,
        }),
      );

      await this.paymentRepository.save(payment);

      this.logger.log('Payment saved', { paymentId: payment.id.value });

      payment.domainEvents.forEach((event) =>
        this.eventDispatcher.dispatch(event),
      );

      this.logger.log('Domain events dispatched');

      return {
        image: qrCode.value.image,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error creating payment', {
          message: error.message,
          trace: error.stack,
        });
        throw error;
      }

      this.logger.error('Error creating payment', {
        message: 'Unknown error creating payment',
        trace: 'Unknown error creating payment',
      });

      throw new DomainPersistenceException(
        'Erro desconhecido ao salvar pagamento',
      );
    }
  }
}
