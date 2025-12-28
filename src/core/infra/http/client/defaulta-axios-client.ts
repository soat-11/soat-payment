import { AxiosInstance, isAxiosError } from 'axios';

import {
  DefaultHttpClientResponse,
  GetMethod,
  GetParams,
  PostMethod,
} from '@core/infra/http/client/http-client';

export class DefaultAxiosClient implements GetMethod, PostMethod {
  constructor(private readonly client: AxiosInstance) {}

  async post<TParams extends object, TReturn extends object>(
    url: string,
    data: TParams,
    headers?: Record<string, string>,
  ): Promise<DefaultHttpClientResponse<TReturn>> {
    try {
      const response = await this.client.post<TReturn>(url, data, { headers });

      return {
        headers: response.headers as Record<string, string>,
        status: response.status,
        data: response.data,
      };
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return {
          headers: error.response?.headers as Record<string, string>,
          status: error.response?.status ?? 500,
          data: error.response?.data,
        };
      }

      if (error instanceof Error) {
        return {
          headers: {},
          status: 500,
          data: { message: error.message },
        };
      }

      return {
        headers: {},
        status: 500,
        data: {
          message:
            'Ocorreu um erro inesperado, entre em contato com o suporte.',
        },
      };
    }
  }

  async get<TReturn extends object, TQueryParams extends object = object>(
    url: string,
    params: GetParams<TQueryParams>,
  ): Promise<DefaultHttpClientResponse<TReturn>> {
    try {
      const response = await this.client.get<TReturn>(url, {
        params: params.queryParams,
        headers: params.headers,
      });

      return {
        headers: response.headers as Record<string, string>,
        status: response.status,
        data: response.data,
      };
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return {
          headers: error.response?.headers as Record<string, string>,
          status: error.response?.status ?? 500,
          data: error.response?.data,
        };
      }

      if (error instanceof Error) {
        return {
          headers: {},
          status: 500,
          data: { message: error.message },
        };
      }

      return {
        headers: {},
        status: 500,
        data: {
          message:
            'Ocorreu um erro inesperado, entre em contato com o suporte.',
        },
      };
    }
  }
}
