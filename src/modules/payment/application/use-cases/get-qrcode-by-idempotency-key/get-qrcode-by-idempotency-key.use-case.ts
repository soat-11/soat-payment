import { Result } from '@core/domain/result';
import { IdempotencyKeyVO } from '@payment/domain/value-objects/idempotency-key.vo';

export interface GetQRCodeByIdempotencyKeyUseCase {
  execute(idempotencyKey: IdempotencyKeyVO): Promise<Result<Buffer>>;
}

export const GetQRCodeByIdempotencyKeyUseCase = Symbol(
  'GetQRCodeByIdempotencyKeyUseCase',
);
