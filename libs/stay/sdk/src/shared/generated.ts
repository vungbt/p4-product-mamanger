export interface paths {
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
