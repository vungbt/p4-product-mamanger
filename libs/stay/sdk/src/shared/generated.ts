export interface paths {
  '/api/auth/account-info': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get the account info provided by the provider
     * @description Get the account info provided by the provider
     */
    get: operations['auth_get__account_info'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/callback/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Better Auth: /callback/{id} */
    get: operations['auth_get__callback_id_'];
    put?: never;
    /** Better Auth: /callback/{id} */
    post: operations['auth_post__callback_id_'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/change-email': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Better Auth: /change-email */
    post: operations['auth_post__change_email'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/change-password': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Change the password of the user
     * @description Change the password of the user
     */
    post: operations['auth_post__change_password'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/delete-user': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Delete the user
     * @description Delete the user
     */
    post: operations['auth_post__delete_user'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/delete-user/callback': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Callback to complete user deletion with verification token
     * @description Callback to complete user deletion with verification token
     */
    get: operations['auth_get__delete_user_callback'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/error': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Displays an error page
     * @description Displays an error page
     */
    get: operations['auth_get__error'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/get-access-token': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Get a valid access token, doing a refresh if needed
     * @description Get a valid access token, doing a refresh if needed
     */
    post: operations['auth_post__get_access_token'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/get-session': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get the current session
     * @description Get the current session
     */
    get: operations['auth_get__get_session'];
    put?: never;
    /**
     * Get the current session
     * @description Get the current session
     */
    post: operations['auth_post__get_session'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/link-social': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Link a social account to the user
     * @description Link a social account to the user
     */
    post: operations['auth_post__link_social'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/list-accounts': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List all accounts linked to the user
     * @description List all accounts linked to the user
     */
    get: operations['auth_get__list_accounts'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/list-sessions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List all active sessions for the user
     * @description List all active sessions for the user
     */
    get: operations['auth_get__list_sessions'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/ok': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Check if the API is working
     * @description Check if the API is working
     */
    get: operations['auth_get__ok'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/refresh-token': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Refresh the access token using a refresh token
     * @description Refresh the access token using a refresh token
     */
    post: operations['auth_post__refresh_token'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/request-password-reset': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Send a password reset email to the user
     * @description Send a password reset email to the user
     */
    post: operations['auth_post__request_password_reset'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/reset-password': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Reset the password for a user
     * @description Reset the password for a user
     */
    post: operations['auth_post__reset_password'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/reset-password/{token}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Redirects the user to the callback URL with the token
     * @description Redirects the user to the callback URL with the token
     */
    get: operations['auth_get__reset_password_token_'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/revoke-other-sessions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Revoke all other sessions for the user except the current one
     * @description Revoke all other sessions for the user except the current one
     */
    post: operations['auth_post__revoke_other_sessions'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/revoke-session': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Revoke a single session
     * @description Revoke a single session
     */
    post: operations['auth_post__revoke_session'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/revoke-sessions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Revoke all sessions for the user
     * @description Revoke all sessions for the user
     */
    post: operations['auth_post__revoke_sessions'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/send-verification-email': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Send a verification email to the user
     * @description Send a verification email to the user
     */
    post: operations['auth_post__send_verification_email'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/sign-in/email': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Sign in with email and password
     * @description Sign in with email and password
     */
    post: operations['auth_post__sign_in_email'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/sign-in/social': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Sign in with a social provider
     * @description Sign in with a social provider
     */
    post: operations['auth_post__sign_in_social'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/sign-out': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Sign out the current user
     * @description Sign out the current user
     */
    post: operations['auth_post__sign_out'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/sign-up/email': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Sign up a user using email and password
     * @description Sign up a user using email and password
     */
    post: operations['auth_post__sign_up_email'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/unlink-account': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Unlink an account
     * @description Unlink an account
     */
    post: operations['auth_post__unlink_account'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/update-session': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Update the current session
     * @description Update the current session
     */
    post: operations['auth_post__update_session'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/update-user': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Update the current user
     * @description Update the current user
     */
    post: operations['auth_post__update_user'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/verify-email': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Verify the email of the user
     * @description Verify the email of the user
     */
    get: operations['auth_get__verify_email'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/verify-password': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Verify the current user's password
     * @description Verify the current user's password
     */
    post: operations['auth_post__verify_password'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/me': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Người dùng hiện tại
     * @description Gồm vai trò và các toà được gán (người quản lý).
     *
     *     **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_me'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/me/capabilities': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Quyền của người dùng hiện tại
     * @description Rule CASL dùng với `stayAbilityKit` của `@stay/shared`; `contractVersion` đổi khi hợp đồng API thay đổi.
     *
     *     **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_me_capabilities'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/health': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Health check
     * @description Kiểm tra kết nối database; trả 503 khi database không sẵn sàng.
     *
     *     **Công khai.**
     */
    get: operations['get_health'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/health/live': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Liveness
     * @description **Công khai.**
     */
    get: operations['get_health_live'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    ApiError: {
      code?: string;
      extensions?: {
        [key: string]: unknown;
      };
      message: string;
    };
    Auth_Account: {
      accessToken?: string;
      /** Format: date-time */
      accessTokenExpiresAt?: string;
      accountId: string;
      /** Format: date-time */
      createdAt: string;
      readonly id: string;
      idToken?: string;
      password?: string;
      providerId: string;
      refreshToken?: string;
      /** Format: date-time */
      refreshTokenExpiresAt?: string;
      scope?: string;
      /** Format: date-time */
      updatedAt: string;
      userId: string;
    };
    Auth_Session: {
      /** Format: date-time */
      createdAt: string;
      /** Format: date-time */
      expiresAt: string;
      readonly id: string;
      ipAddress?: string;
      token: string;
      /** Format: date-time */
      updatedAt: string;
      userAgent?: string;
      userId: string;
    };
    Auth_User: {
      /** @default active */
      readonly accountStatus: string;
      /** Format: date-time */
      createdAt: string;
      email: string;
      /** @default false */
      readonly emailVerified: boolean;
      readonly id: string;
      image?: string;
      name: string;
      /** @default tenant */
      readonly role: string;
      /** Format: date-time */
      updatedAt: string;
    };
    Auth_Verification: {
      /** Format: date-time */
      createdAt: string;
      /** Format: date-time */
      expiresAt: string;
      readonly id: string;
      identifier: string;
      /** Format: date-time */
      updatedAt: string;
      value: string;
    };
    StayCapabilities: {
      contractVersion: string;
      rules: components['schemas']['StayRule'][];
    };
    StayMe: {
      user: components['schemas']['StayUser'];
    };
    StayRule: {
      action:
        | 'read'
        | 'create'
        | 'update'
        | 'delete'
        | 'manage'
        | 'issue'
        | 'void'
        | 'settle'
        | '*'
        | (
            | '*'
            | 'create'
            | 'delete'
            | 'issue'
            | 'manage'
            | 'read'
            | 'settle'
            | 'update'
            | 'void'
          )[];
      conditions?: {
        [key: string]: unknown;
      };
      inverted?: boolean;
      subject:
        | 'Building'
        | 'Room'
        | 'Tenant'
        | 'Contract'
        | 'Deposit'
        | 'MeterReading'
        | 'Invoice'
        | 'Payment'
        | 'Expense'
        | 'Maintenance'
        | 'Settings'
        | 'Report'
        | 'AuditLog'
        | 'Member'
        | 'all'
        | (
            | 'AuditLog'
            | 'Building'
            | 'Contract'
            | 'Deposit'
            | 'Expense'
            | 'Invoice'
            | 'Maintenance'
            | 'Member'
            | 'MeterReading'
            | 'Payment'
            | 'Report'
            | 'Room'
            | 'Settings'
            | 'Tenant'
            | 'all'
          )[];
    };
    StayUser: {
      avatarUrl: string | null;
      buildingIds: string[];
      contractIds: string[];
      displayName: string;
      email: string;
      emailVerified: boolean;
      id: string;
      /** @enum {string} */
      role: 'manager' | 'owner' | 'tenant';
    };
  };
  responses: {
    /** @description Xung đột version, trạng thái, tồn kho, quota, quote hoặc idempotency. */
    Conflict: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['ApiError'];
      };
    };
    /** @description Không đủ quyền hoặc không sở hữu tài nguyên. */
    Forbidden: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['ApiError'];
      };
    };
    /** @description Không tìm thấy tài nguyên hoặc actor không được xem. */
    NotFound: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['ApiError'];
      };
    };
    /** @description Vượt giới hạn tần suất; làm theo header Retry-After. */
    RateLimited: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['ApiError'];
      };
    };
    /** @description Access token hoặc phiên không hợp lệ/đã hết hạn. */
    Unauthorized: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['ApiError'];
      };
    };
    /** @description Dữ liệu không hợp lệ; `extensions` map từng field với thông báo lỗi. */
    ValidationError: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['ApiError'];
      };
    };
  };
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  auth_get__account_info: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Success */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            account: {
              accountId: string;
              id: string;
              providerId: string;
            };
            data: {
              [key: string]: unknown;
            };
            user: {
              email?: string | null;
              emailVerified: boolean;
              image?: string;
              name?: string;
            };
          };
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_get__callback_id_: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_post__callback_id_: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: {
      content: {
        'application/json': {
          code?: string;
          device_id?: string;
          error?: string;
          error_description?: string;
          iss?: string;
          state?: string;
          user?: string;
        };
      };
    };
    responses: {
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_post__change_email: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          /** @description The URL to redirect to after email verification */
          callbackURL?: string;
          /** @description The new email address to set must be a valid email address */
          newEmail: string;
        };
      };
    };
    responses: {
      /** @description Email change request processed successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /**
             * @description Status message of the email change process
             * @enum {string|null}
             */
            message?: 'Email updated' | 'Verification email sent' | null;
            /** @description Indicates if the request was successful */
            status: boolean;
            user?: components['schemas']['Auth_User'];
          };
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_post__change_password: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          /** @description The current password is required */
          currentPassword: string;
          /** @description The new password to set */
          newPassword: string;
          /** @description Must be a boolean value */
          revokeOtherSessions?: boolean;
        };
      };
    };
    responses: {
      /** @description Password successfully changed */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @description New session token if other sessions were revoked */
            token?: string | null;
            user: {
              /**
               * Format: date-time
               * @description When the user was created
               */
              createdAt: string;
              /**
               * Format: email
               * @description The email address of the user
               */
              email: string;
              /** @description Whether the email has been verified */
              emailVerified: boolean;
              /** @description The unique identifier of the user */
              id: string;
              /**
               * Format: uri
               * @description The profile image URL of the user
               */
              image?: string | null;
              /** @description The name of the user */
              name: string;
              /**
               * Format: date-time
               * @description When the user was last updated
               */
              updatedAt: string;
            };
          };
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_post__delete_user: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: {
      content: {
        'application/json': {
          /** @description The callback URL to redirect to after the user is deleted */
          callbackURL?: string;
          /** @description The user's password. Required if session is not fresh */
          password?: string;
          /** @description The deletion verification token */
          token?: string;
        };
      };
    };
    responses: {
      /** @description User deletion processed successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /**
             * @description Status message of the deletion process
             * @enum {string}
             */
            message: 'User deleted' | 'Verification email sent';
            /** @description Indicates if the operation was successful */
            success: boolean;
          };
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_get__delete_user_callback: {
    parameters: {
      query?: {
        callbackURL?: string;
        token?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description User successfully deleted */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /**
             * @description Confirmation message
             * @enum {string}
             */
            message: 'User deleted';
            /** @description Indicates if the deletion was successful */
            success: boolean;
          };
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_get__error: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Success */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'text/html': string;
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_post__get_access_token: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json':
          | {
              /** @description The Better Auth account ID */
              accountId: string;
              /** @description The user ID associated with the account */
              userId?: string;
            }
          | {
              /**
               * @description Select the current OAuth account from its signed cookie
               * @enum {unknown}
               */
              useAccountCookie: true;
              /** @description The user ID associated with the account */
              userId?: string;
            };
      };
    };
    responses: {
      /** @description A Valid access token */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            accessToken?: string;
            /** Format: date-time */
            accessTokenExpiresAt?: string;
            idToken?: string;
            tokenType?: string;
          };
        };
      };
      /** @description Invalid refresh token or provider configuration */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_get__get_session: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Success */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            session: components['schemas']['Auth_Session'];
            user: components['schemas']['Auth_User'];
          } | null;
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_post__get_session: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: {
      content: {
        'application/json': Record<string, never>;
      };
    };
    responses: {
      /** @description Success */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            session: components['schemas']['Auth_Session'];
            user: components['schemas']['Auth_User'];
          } | null;
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_post__link_social: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          additionalData?: {
            [key: string]: unknown;
          };
          /** @description Extra query parameters to append to the provider authorization URL (e.g. Cognito identity_provider, Google hd). */
          additionalParams?: {
            [key: string]: string;
          };
          /** @description The URL to redirect to after the user has signed in */
          callbackURL?: string;
          /** @description Disable automatic redirection to the provider. Useful for handling the redirection yourself */
          disableRedirect?: boolean;
          /** @description The URL to redirect to if there is an error during the link process */
          errorCallbackURL?: string;
          idToken?: {
            accessToken?: string;
            nonce?: string;
            refreshToken?: string;
            token: string;
          };
          /** @description The login hint to use for the authorization code request */
          loginHint?: string;
          provider:
            | (
                | 'apple'
                | 'atlassian'
                | 'cloudflare'
                | 'cognito'
                | 'discord'
                | 'facebook'
                | 'figma'
                | 'github'
                | 'microsoft'
                | 'google'
                | 'huggingface'
                | 'slack'
                | 'spotify'
                | 'twitch'
                | 'twitter'
                | 'dropbox'
                | 'kick'
                | 'linear'
                | 'linkedin'
                | 'gitlab'
                | 'tiktok'
                | 'reddit'
                | 'roblox'
                | 'salesforce'
                | 'vk'
                | 'zoom'
                | 'notion'
                | 'kakao'
                | 'naver'
                | 'line'
                | 'paybin'
                | 'paypal'
                | 'polar'
                | 'railway'
                | 'vercel'
                | 'wechat'
              )
            | string;
          requestSignUp?: boolean;
          /** @description Additional scopes to request from the provider */
          scopes?: string[];
        };
      };
    };
    responses: {
      /** @description Success */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @description Indicates if the user should be redirected to the authorization URL */
            redirect: boolean;
            status?: boolean;
            /** @description The authorization URL to redirect the user to */
            url?: string;
          };
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_get__list_accounts: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Success */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            accountId: string;
            /** Format: date-time */
            createdAt: string;
            id: string;
            providerId: string;
            scopes: string[];
            /** Format: date-time */
            updatedAt: string;
            userId: string;
          }[];
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_get__list_sessions: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Success */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Auth_Session'][];
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_get__ok: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description API is working */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @description Indicates if the API is working */
            ok: boolean;
          };
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_post__refresh_token: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json':
          | {
              /** @description The Better Auth account ID */
              accountId: string;
              /** @description The user ID associated with the account */
              userId?: string;
            }
          | {
              /**
               * @description Select the current OAuth account from its signed cookie
               * @enum {unknown}
               */
              useAccountCookie: true;
              /** @description The user ID associated with the account */
              userId?: string;
            };
      };
    };
    responses: {
      /** @description Access token refreshed successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            accessToken?: string;
            /** Format: date-time */
            accessTokenExpiresAt?: string;
            idToken?: string;
            refreshToken?: string;
            /** Format: date-time */
            refreshTokenExpiresAt?: string;
            tokenType?: string;
          };
        };
      };
      /** @description Invalid refresh token or provider configuration */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_post__request_password_reset: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          /** @description The email address of the user to send a password reset email to */
          email: string;
          /** @description The URL to redirect the user to reset their password. If the token isn't valid or expired, it'll be redirected with a query parameter `?error=INVALID_TOKEN`. If the token is valid, it'll be redirected with a query parameter `?token=VALID_TOKEN */
          redirectTo?: string;
        };
      };
    };
    responses: {
      /** @description Success */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
            status?: boolean;
          };
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_post__reset_password: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          /** @description The new password to set */
          newPassword: string;
          /** @description The token to reset the password */
          token?: string;
        };
      };
    };
    responses: {
      /** @description Success */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            status?: boolean;
          };
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_get__reset_password_token_: {
    parameters: {
      query: {
        /** @description The URL to redirect the user to reset their password */
        callbackURL: string;
      };
      header?: never;
      path: {
        /** @description The token to reset the password */
        token: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Success */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            token?: string;
          };
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_post__revoke_other_sessions: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: {
      content: {
        'application/json': Record<string, never>;
      };
    };
    responses: {
      /** @description Success */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @description Indicates if all other sessions were revoked successfully */
            status: boolean;
          };
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_post__revoke_session: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: {
      content: {
        'application/json': {
          /** @description The token to revoke */
          token: string;
        };
      };
    };
    responses: {
      /** @description Success */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @description Indicates if the session was revoked successfully */
            status: boolean;
          };
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_post__revoke_sessions: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: {
      content: {
        'application/json': Record<string, never>;
      };
    };
    responses: {
      /** @description Success */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @description Indicates if all sessions were revoked successfully */
            status: boolean;
          };
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_post__send_verification_email: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: {
      content: {
        'application/json': {
          /**
           * @description The URL to use for email verification callback
           * @example https://example.com/callback
           */
          callbackURL?: string | null;
          /**
           * @description The email to send the verification email to
           * @example user@example.com
           */
          email: string;
        };
      };
    };
    responses: {
      /** @description Success */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /**
             * @description Indicates if the email was sent successfully
             * @example true
             */
            status?: boolean;
          };
        };
      };
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /**
             * @description Error message
             * @example Verification email isn't enabled
             */
            message?: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_post__sign_in_email: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          /** @description Callback URL to use as a redirect for email verification */
          callbackURL?: string;
          /** @description Email of the user */
          email: string;
          /** @description Password of the user */
          password: string;
          /** @description If this is false, the session will not be remembered. Default is `true`. */
          rememberMe?: boolean;
        };
      };
    };
    responses: {
      /** @description Success - Returns either session details or redirect URL */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @enum {boolean} */
            redirect: false;
            /** @description Session token */
            token: string;
            url?: string | null;
            user: components['schemas']['Auth_User'];
          };
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_post__sign_in_social: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          additionalData?: {
            [key: string]: unknown;
          };
          /** @description Extra query parameters to append to the provider authorization URL (e.g. Cognito identity_provider, Google hd). */
          additionalParams?: {
            [key: string]: string;
          };
          /** @description Callback URL to redirect to after the user has signed in */
          callbackURL?: string;
          /** @description Disable automatic redirection to the provider. Useful for handling the redirection yourself */
          disableRedirect?: boolean;
          /** @description Callback URL to redirect to if an error happens */
          errorCallbackURL?: string;
          idToken?: {
            /** @description Access token from the provider */
            accessToken?: string;
            /** @description Expiry date of the token */
            expiresAt?: number;
            /** @description Nonce used to generate the token */
            nonce?: string;
            /** @description Refresh token from the provider */
            refreshToken?: string;
            /** @description ID token from the provider */
            token: string;
            /** @description The user object from the provider. Only available for some providers like Apple. */
            user?: {
              email?: string;
              name?: {
                firstName?: string;
                lastName?: string;
              };
            };
          };
          /** @description The login hint to use for the authorization code request */
          loginHint?: string;
          newUserCallbackURL?: string;
          provider:
            | (
                | 'apple'
                | 'atlassian'
                | 'cloudflare'
                | 'cognito'
                | 'discord'
                | 'facebook'
                | 'figma'
                | 'github'
                | 'microsoft'
                | 'google'
                | 'huggingface'
                | 'slack'
                | 'spotify'
                | 'twitch'
                | 'twitter'
                | 'dropbox'
                | 'kick'
                | 'linear'
                | 'linkedin'
                | 'gitlab'
                | 'tiktok'
                | 'reddit'
                | 'roblox'
                | 'salesforce'
                | 'vk'
                | 'zoom'
                | 'notion'
                | 'kakao'
                | 'naver'
                | 'line'
                | 'paybin'
                | 'paypal'
                | 'polar'
                | 'railway'
                | 'vercel'
                | 'wechat'
              )
            | string;
          /** @description Explicitly request sign-up. Useful when disableImplicitSignUp is true for this provider */
          requestSignUp?: boolean;
          /** @description Array of scopes to request from the provider. This will override the default scopes passed. */
          scopes?: string[];
        };
      };
    };
    responses: {
      /** @description Success - Returns session details (idToken branch) or an authorize URL (redirect branch) */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            redirect: boolean;
            token?: string;
            url?: string;
            user?: components['schemas']['Auth_User'];
          };
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_post__sign_out: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: {
      content: {
        'application/json': {
          /** @description The URL to redirect to after provider logout */
          callbackURL?: string;
          /** @description Return the provider logout URL without redirecting */
          disableRedirect?: boolean;
          /** @description State to pass to the provider logout endpoint */
          state?: string;
        };
      };
    };
    responses: {
      /** @description Success */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @description Whether the client should redirect to the provider logout URL */
            redirect?: boolean;
            success?: boolean;
            /** @description Provider logout URL when RP-initiated logout is available */
            url?: string;
          };
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_post__sign_up_email: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: {
      content: {
        'application/json': {
          /** @description The URL to use for email verification callback */
          callbackURL?: string;
          /** @description The email of the user */
          email: string;
          /** @description The profile image URL of the user */
          image?: string;
          /** @description The name of the user */
          name: string;
          /** @description The password of the user */
          password: string;
          /** @description If this is false, the session will not be remembered. Default is `true`. */
          rememberMe?: boolean;
        };
      };
    };
    responses: {
      /** @description Successfully created user */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @description Authentication token for the session */
            token?: string | null;
            user: {
              /**
               * Format: date-time
               * @description When the user was created
               */
              createdAt: string;
              /**
               * Format: email
               * @description The email address of the user
               */
              email: string;
              /** @description Whether the email has been verified */
              emailVerified: boolean;
              /** @description The unique identifier of the user */
              id: string;
              /**
               * Format: uri
               * @description The profile image URL of the user
               */
              image?: string | null;
              /** @description The name of the user */
              name: string;
              /**
               * Format: date-time
               * @description When the user was last updated
               */
              updatedAt: string;
            };
          };
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Unprocessable Entity. User already exists or failed to create user. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_post__unlink_account: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          /** @description The Better Auth account ID to unlink */
          accountId: string;
        };
      };
    };
    responses: {
      /** @description Success */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            status?: boolean;
          };
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_post__update_session: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          [key: string]: unknown;
        };
      };
    };
    responses: {
      /** @description Success */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            session?: components['schemas']['Auth_Session'];
          };
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_post__update_user: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: {
      content: {
        'application/json': {
          /** @description The image of the user */
          image?: string | null;
          /** @description The name of the user */
          name?: string;
        };
      };
    };
    responses: {
      /** @description Success */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            user?: components['schemas']['Auth_User'];
          };
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_get__verify_email: {
    parameters: {
      query: {
        /** @description The URL to redirect to after email verification */
        callbackURL?: string;
        /** @description The token to verify the email */
        token: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Success */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @description Indicates if the email was verified successfully */
            status: boolean;
            user: components['schemas']['Auth_User'];
          };
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  auth_post__verify_password: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          /** @description The password to verify */
          password: string;
        };
      };
    };
    responses: {
      /** @description Success */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            status?: boolean;
          };
        };
      };
      /** @description Bad Request. Usually due to missing parameters, or invalid parameters. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Unauthorized. Due to missing or invalid authentication. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message: string;
          };
        };
      };
      /** @description Forbidden. You do not have permission to access this resource or to perform this action. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Not Found. The requested resource was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Too Many Requests. You have exceeded the rate limit. Try again later. */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
      /** @description Internal Server Error. This is a problem with the server that you cannot fix. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            message?: string;
          };
        };
      };
    };
  };
  get_api_me: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['StayMe'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_me_capabilities: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['StayCapabilities'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  get_health: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Service sẵn sàng */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @enum {string} */
            database?: 'up' | 'down';
            service?: string;
            status?: string;
          };
        };
      };
      /** @description Database không sẵn sàng */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  get_health_live: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Service sẵn sàng */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            status?: string;
          };
        };
      };
    };
  };
}
