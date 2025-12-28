import { createHmac } from 'crypto';

import { Injectable } from '@nestjs/common';

import { PaymentSignature, PaymentSignatureInput } from './payment-signature';

@Injectable()
export class HMACMercadoPagoSignature implements PaymentSignature {
  private readonly secret: string;

  constructor() {
    this.secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET_KEY || '';
  }

  private getSignatureData(parts: string[]): { ts?: string; hash?: string } {
    let ts: string | undefined;
    let hash: string | undefined;

    parts.forEach((part) => {
      const [key, value] = part.split('=');
      if (key && value) {
        const trimmedKey = key.trim();
        const trimmedValue = value.trim();
        if (trimmedKey === 'ts') {
          ts = trimmedValue;
        } else if (trimmedKey === 'v1') {
          hash = trimmedValue;
        }
      }
    });

    return { ts, hash };
  }

  execute(params: PaymentSignatureInput): Promise<boolean> {
    if (!this.secret) {
      return Promise.resolve(false);
    }

    if (!params.xSignature || !params.xRequestId || !params.data) {
      return Promise.resolve(false);
    }

    const { hash, ts } = this.getSignatureData(params.xSignature.split(','));

    if (!hash || !ts) {
      return Promise.resolve(false);
    }

    const manifest = `id:${params.data};request-id:${params.xRequestId};ts:${ts};`;
    const hmac = createHmac('sha256', this.secret);
    hmac.update(manifest);
    const sha = hmac.digest('hex');

    return Promise.resolve(sha === hash);
  }
}
