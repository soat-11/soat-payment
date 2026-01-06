import { Result } from '@core/domain/result';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';

export interface GetQRCodeByPaymentIdUseCase {
  execute(paymentId: UniqueEntityID): Promise<Result<Buffer>>;
}

export const GetQRCodeByPaymentIdUseCase = Symbol(
  'GetQRCodeByPaymentIdUseCase',
);
