import { Result } from '@core/domain/result';
import { SessionIdVO } from '@payment/domain/value-objects/session-id.vo';

export interface GetQRCodeBySessionIdUseCase {
  execute(sessionId: SessionIdVO): Promise<Result<Buffer>>;
}

export const GetQRCodeBySessionIdUseCase = Symbol(
  'GetQRCodeBySessionIdUseCase',
);
