import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { ValueObject } from '@core/domain/value-objects/value-object.vo';

export type PixDetailProps = {
  pixKey: string;
  expiresAt: Date;
  qrCode: string;
};

export class PixDetail extends ValueObject<PixDetailProps> {
  protected constructor(props: PixDetailProps) {
    super(props);
  }

  protected validate(input: PixDetailProps): void {
    if (typeof input.pixKey !== 'string' || input.pixKey.trim() === '') {
      throw new DomainBusinessException(
        'Chave PIX inválida: deve ser uma string não vazia',
      );
    }
    if (!(input.expiresAt instanceof Date)) {
      throw new DomainBusinessException(
        'Data de expiração inválida: deve ser um objeto Date',
      );
    }
    if (typeof input.qrCode !== 'string' || input.qrCode.trim() === '') {
      throw new DomainBusinessException(
        'Código QR inválido: deve ser uma string não vazia',
      );
    }
  }

  static create(props: PixDetailProps): PixDetail {
    return new PixDetail(props);
  }
}
