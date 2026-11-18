import type { ApiPaginatedSuccess, ApiSuccess } from '@p4/shared';
// Adds `req.t` and `req.language` from the i18next middleware every app mounts.
import type {} from 'i18next-http-middleware';

export type JsonApiBody<T = unknown> =
  | ApiSuccess<T>
  | ApiPaginatedSuccess<T extends unknown[] ? T[number] : T>;

declare global {
  namespace Express {
    /**
     * The signed-in user attached by `authRequired`. Apps add their own fields with
     * `interface User extends AppUser {}` inside `declare global { namespace Express { … } }`.
     */
    interface User {
      id: string;
    }

    interface Request {
      requestId?: string;
      user?: User;
    }

    interface Response {
      /** Envelope response `{ data, meta?, message? }`, attached by `baseMiddleware`. */
      jsonApi: <T>(status: number, body: ApiSuccess<T> | ApiPaginatedSuccess<T>) => this;
    }
  }
}
