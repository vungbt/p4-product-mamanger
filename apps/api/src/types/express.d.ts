import type { ApiPaginatedSuccess, ApiSuccess, PaginationMeta } from '@p4/shared';

export type JsonApiBody<T = unknown> =
  | ApiSuccess<T>
  | ApiPaginatedSuccess<T extends unknown[] ? T[number] : T>;

declare global {
  namespace Express {
    interface Request {
      user?: import('@p4/shared').User;
      pagination?: {
        page: number;
        pageSize: number;
        offset: number;
        limit: number;
        q: string;
      };
    }

    interface Response {
      /** Envelope response — giống next-chapter `res.jsonApi(status, body)` */
      jsonApi: <T>(status: number, body: ApiSuccess<T> | ApiPaginatedSuccess<T>) => this;
    }
  }
}

export type { PaginationMeta };
