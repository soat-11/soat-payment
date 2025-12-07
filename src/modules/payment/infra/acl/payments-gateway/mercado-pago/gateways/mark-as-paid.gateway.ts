import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { Result } from '@core/domain/result';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { MarkAsPaidGateway } from '@payment/domain/gateways/mark-as-paid';
import { ProcessPaymentDTOSchemaRequest } from '@payment/infra/acl/payments-gateway/mercado-pago/dtos/process-payment.dto';

export interface PaymentSignalService {
  signalPaymentConfirmed(idempotencyKey: string): Promise<void>;
  signalPaymentFailed(idempotencyKey: string, reason: string): Promise<void>;
}

export class MarkAsPaidGatewayImpl
  implements MarkAsPaidGateway<ProcessPaymentDTOSchemaRequest>
{
  constructor(
    private readonly logger: AbstractLoggerService,
    private readonly signalService: PaymentSignalService,
  ) {}

  async markAsPaid(
    paymentReference: string,
    body: ProcessPaymentDTOSchemaRequest,
  ): Promise<Result<void>> {
    this.logger.log('Webhook received', {
      paymentReference,
      action: body?.action,
      type: body?.type,
      bodyKeys: body ? Object.keys(body) : [],
    });

    // Validate webhook action
    if (!body?.action || body.action !== 'payment.created') {
      this.logger.error('Invalid action', {
        action: body?.action,
        paymentReference,
        receivedBody: JSON.stringify(body),
      });
      return Result.fail(new DomainBusinessException('Invalid action'));
    }

    try {
      await this.signalService.signalPaymentConfirmed(paymentReference);

      this.logger.log('Payment confirmed signal sent to workflow', {
        paymentReference,
        externalPaymentId: body.data?.id,
      });

      return Result.ok();
    } catch (error) {
      // If workflow not found, payment may have expired or been cancelled
      if (
        error instanceof Error &&
        error.message.includes('workflow not found')
      ) {
        this.logger.warn(
          'Workflow not found - payment may have expired or been cancelled',
          {
            paymentReference,
            error: error.message,
          },
        );
        // Return ok to acknowledge webhook (don't retry)
        return Result.ok();
      }

      this.logger.error('Failed to send signal to workflow', {
        paymentReference,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return Result.fail(
        new DomainBusinessException('Failed to process webhook'),
      );
    }
  }
}
