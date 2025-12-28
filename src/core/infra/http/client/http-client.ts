import {
  DomainException,
  DomainExceptionGeneric,
} from '@core/domain/exceptions/domain.exception';

export type DefaultHttpClientSuccessResponse<T> = {
  headers: Record<string, string>;
  status: number;
  data?: T;
};

export type DefaultHttpClientErrorResponse = {
  headers: Record<string, string>;
  status: number;
  data?: { message: string };
};

export type DefaultHttpClientResponse<T> =
  | DefaultHttpClientSuccessResponse<T>
  | DefaultHttpClientErrorResponse;

export type PostMethod = {
  post<TParams extends object, TReturn extends object = object>(
    url: string,
    data: TParams,
    headers?: Record<string, string>,
  ): Promise<DefaultHttpClientResponse<TReturn>>;
};

export type GetParams<T> = {
  queryParams?: T;
  headers?: Record<string, string>;
  [key: string]: unknown;
};

export type GetMethod = {
  get<TReturn extends object, TQueryParams extends object = object>(
    url: string,
    params: GetParams<TQueryParams>,
  ): Promise<DefaultHttpClientResponse<TReturn>>;
};

export type DeleteMethod = {
  delete(url: string): Promise<DefaultHttpClientResponse<void>>;
};

export type PutMethod = {
  put<TParams extends object, TReturn extends object>(
    url: string,
    data: TParams,
  ): Promise<DefaultHttpClientResponse<TReturn>>;
};

export type PatchMethod = {
  patch<TParams extends object, TReturn extends object>(
    url: string,
    data: TParams,
  ): Promise<DefaultHttpClientResponse<TReturn>>;
};

export class HttpClientResponseUtils {
  static isErrorResponse<T = unknown>(
    response: DefaultHttpClientResponse<T>,
  ): response is DefaultHttpClientErrorResponse {
    return response.status >= 400;
  }

  static isNotEmptyResponse<T = unknown>(
    response: DefaultHttpClientResponse<T>,
  ): response is Required<DefaultHttpClientSuccessResponse<T>> {
    return (response as DefaultHttpClientSuccessResponse<T>).data !== undefined;
  }

  static isEmptyResponse<T = unknown>(
    response: DefaultHttpClientResponse<T>,
  ): response is DefaultHttpClientSuccessResponse<undefined> {
    return (
      (response as DefaultHttpClientSuccessResponse<T>).data === undefined ||
      (response as DefaultHttpClientSuccessResponse<T>).data === null
    );
  }

  static handleErrorResponse(response: unknown): Error {
    if (typeof response === 'string') {
      return new DomainExceptionGeneric(response);
    }

    if (response instanceof DomainException) {
      return response;
    }

    if (response && typeof response === 'object' && 'data' in response) {
      const resp = response as DefaultHttpClientErrorResponse;
      if (resp.data && resp.data.message) {
        return new DomainExceptionGeneric(resp.data.message);
      }
    }

    return new DomainExceptionGeneric('Ocorreu um erro desconhecido');
  }
}

export const HttpClient = Symbol.for('HttpClient');
