import { Result } from '@core/domain/result';
import {
  AnyCreatePaymentType,
  CreateAnyPaymentResponse,
  CreatePaymentGateway,
} from '@payment/domain/gateways/create-payment.gateway';

export class FakeCreatePaymentGateway implements CreatePaymentGateway {
  private response: Result<CreateAnyPaymentResponse> = Result.ok({
    qrCode: 'fake-qr-code',
    externalPaymentId: 'fake-external-id-123',
  });

  async createPayment(
    _payment: AnyCreatePaymentType,
  ): Promise<Result<CreateAnyPaymentResponse>> {
    return this.response;
  }

  setResponse(response: Result<CreateAnyPaymentResponse>): void {
    this.response = response;
  }
}
