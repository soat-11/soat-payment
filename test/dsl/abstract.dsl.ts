import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';

export abstract class AbstractDSL {
  constructor(
    protected readonly app: INestApplication,
    protected headers: Record<string, string> = {},
  ) {}

  protected req() {
    return supertest(this.app.getHttpServer());
  }

  public withHeader(key: string, value: string): this {
    return new (this.constructor as new (...args: unknown[]) => this)(
      this.app,
      {
        ...this.headers,
        [key]: value,
      },
    );
  }

  public withHeaders(headers: Record<string, string>): this {
    return new (this.constructor as new (...args: unknown[]) => this)(
      this.app,
      {
        ...this.headers,
        ...headers,
      },
    );
  }

  public usingHMAC(signature: string, headerName = 'x-signature'): this {
    return new (this.constructor as new (...args: unknown[]) => this)(
      this.app,
      {
        ...this.headers,
        [headerName]: signature,
      },
    );
  }
}
