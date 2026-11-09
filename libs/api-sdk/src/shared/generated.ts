export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface paths {
  '/api/addresses': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách địa chỉ của tôi
     * @description **Yêu cầu đăng nhập.** Không gửi tham số phân trang thì trả toàn bộ dưới dạng mảng, không có `meta`.
     */
    get: operations['get_api_addresses'];
    put?: never;
    /**
     * Thêm địa chỉ
     * @description **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_addresses'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/addresses/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /**
     * Cập nhật địa chỉ
     * @description **Yêu cầu đăng nhập.**
     */
    put: operations['put_api_addresses_id'];
    post?: never;
    /**
     * Xoá địa chỉ
     * @description **Yêu cầu đăng nhập.**
     */
    delete: operations['delete_api_addresses_id'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/addresses/{id}/default': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Đặt địa chỉ mặc định
     * @description **Yêu cầu đăng nhập.**
     */
    patch: operations['patch_api_addresses_id_default'];
    trace?: never;
  };
  '/api/admin/audit-logs': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách nhật ký thao tác
     * @description **Quyền:** `read:AuditLog`.
     */
    get: operations['get_api_admin_audit_logs'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/audit-logs/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết nhật ký thao tác
     * @description **Quyền:** `read:AuditLog`.
     */
    get: operations['get_api_admin_audit_logs_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/banners': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách banner (Admin)
     * @description **Quyền:** `read:Content`.
     */
    get: operations['get_api_admin_banners'];
    put?: never;
    /**
     * Tạo banner
     * @description **Quyền:** `write:Content`.
     */
    post: operations['post_api_admin_banners'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/banners/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết banner (Admin)
     * @description **Quyền:** `read:Content`.
     */
    get: operations['get_api_admin_banners_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Cập nhật banner
     * @description **Quyền:** `write:Content`.
     */
    patch: operations['patch_api_admin_banners_id'];
    trace?: never;
  };
  '/api/admin/collections': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách bộ sưu tập (Admin)
     * @description **Quyền:** `read:Content`.
     */
    get: operations['get_api_admin_collections'];
    put?: never;
    /**
     * Tạo bộ sưu tập
     * @description **Quyền:** `write:Content`.
     */
    post: operations['post_api_admin_collections'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/collections/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết bộ sưu tập (Admin)
     * @description **Quyền:** `read:Content`.
     */
    get: operations['get_api_admin_collections_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Cập nhật bộ sưu tập
     * @description **Quyền:** `write:Content`.
     */
    patch: operations['patch_api_admin_collections_id'];
    trace?: never;
  };
  '/api/admin/coupons/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết coupon
     * @description **Quyền:** `read:Promotion`.
     */
    get: operations['get_api_admin_coupons_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/coupons/{id}/redemptions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Lịch sử dùng coupon
     * @description **Quyền:** `read:Promotion`.
     */
    get: operations['get_api_admin_coupons_id_redemptions'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/customers': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách khách hàng
     * @description **Quyền:** `read:Customer`.
     */
    get: operations['get_api_admin_customers'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/customers/{id}/status': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Đổi trạng thái khách hàng
     * @description **Quyền:** `manage:Customer`.
     */
    patch: operations['patch_api_admin_customers_id_status'];
    trace?: never;
  };
  '/api/admin/exchanges': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách yêu cầu đổi hàng (Admin)
     * @description **Quyền:** `read:Return`.
     */
    get: operations['get_api_admin_exchanges'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/exports': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Tạo job export (CSV/XLSX)
     * @description **Yêu cầu đăng nhập.** Bắt buộc header `Idempotency-Key`.
     */
    post: operations['post_api_admin_exports'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/home-layout': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Xem bố cục trang chủ (Admin)
     * @description **Quyền:** `read:Content`.
     */
    get: operations['get_api_admin_home_layout'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Cập nhật bố cục trang chủ
     * @description **Quyền:** `write:Content`.
     */
    patch: operations['patch_api_admin_home_layout'];
    trace?: never;
  };
  '/api/admin/import-templates/{resource}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Tải file mẫu import
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_admin_import_templates_resource'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/imports/{resource}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Tải file import (CSV/XLSX)
     * @description Worker kiểm tra file và trả preview; dữ liệu chỉ được ghi sau `confirm`.
     *
     *     **Yêu cầu đăng nhập.** Bắt buộc header `Idempotency-Key`.
     */
    post: operations['post_api_admin_imports_resource'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/inventory': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Tồn kho theo SKU
     * @description **Quyền:** `read:Inventory`.
     */
    get: operations['get_api_admin_inventory'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/inventory/adjustments': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Điều chỉnh tồn kho
     * @description **Quyền:** `write:Inventory`. Bắt buộc header `Idempotency-Key`.
     */
    post: operations['post_api_admin_inventory_adjustments'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/inventory/movements': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Lịch sử biến động kho
     * @description **Quyền:** `read:Inventory`.
     */
    get: operations['get_api_admin_inventory_movements'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/inventory/receipts': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Nhập kho
     * @description **Quyền:** `write:Inventory`. Bắt buộc header `Idempotency-Key`.
     */
    post: operations['post_api_admin_inventory_receipts'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/inventory/reconciliation': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Đối soát tồn kho với ledger
     * @description **Quyền:** `read:Inventory`.
     */
    get: operations['get_api_admin_inventory_reconciliation'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/jobs': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách job nền
     * @description **Quyền:** `read:System`.
     */
    get: operations['get_api_admin_jobs'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/jobs/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết job nền
     * @description **Quyền:** `read:System`.
     */
    get: operations['get_api_admin_jobs_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/jobs/{id}/retry': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Chạy lại job nền
     * @description **Quyền:** `manage:System`.
     */
    post: operations['post_api_admin_jobs_id_retry'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/navigation/{placement}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Xem cấu hình điều hướng (Admin)
     * @description **Quyền:** `read:Content`.
     */
    get: operations['get_api_admin_navigation_placement'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Cập nhật điều hướng
     * @description **Quyền:** `write:Content`.
     */
    patch: operations['patch_api_admin_navigation_placement'];
    trace?: never;
  };
  '/api/admin/notification-templates': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách mẫu thông báo
     * @description **Quyền:** `read:Notification`. Không gửi tham số phân trang thì trả toàn bộ dưới dạng mảng, không có `meta`.
     */
    get: operations['get_api_admin_notification_templates'];
    /**
     * Lưu mẫu thông báo
     * @description **Quyền:** `manage:Notification`.
     */
    put: operations['put_api_admin_notification_templates'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/operations/inventory-reconciliation': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Chạy đối soát tồn kho
     * @description **Quyền:** `manage:System`.
     */
    post: operations['post_api_admin_operations_inventory_reconciliation'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/pages': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách trang CMS (Admin)
     * @description **Quyền:** `read:Content`.
     */
    get: operations['get_api_admin_pages'];
    put?: never;
    /**
     * Tạo trang CMS nháp
     * @description **Quyền:** `write:Content`.
     */
    post: operations['post_api_admin_pages'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/pages/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết trang CMS (Admin)
     * @description **Quyền:** `read:Content`.
     */
    get: operations['get_api_admin_pages_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Cập nhật trang CMS nháp
     * @description Bản đang xuất bản giữ nguyên cho đến khi publish lại.
     *
     *     **Quyền:** `write:Content`.
     */
    patch: operations['patch_api_admin_pages_id'];
    trace?: never;
  };
  '/api/admin/pages/{id}/archive': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Lưu trữ trang CMS
     * @description **Quyền:** `publish:Content`.
     */
    post: operations['post_api_admin_pages_id_archive'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/pages/{id}/publish': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Xuất bản hoặc lên lịch trang CMS
     * @description Có `scheduledAt` thì lên lịch; không có thì xuất bản ngay.
     *
     *     **Quyền:** `publish:Content`.
     */
    post: operations['post_api_admin_pages_id_publish'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/pages/{id}/revisions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Lịch sử revision của trang CMS
     * @description **Quyền:** `read:Content`.
     */
    get: operations['get_api_admin_pages_id_revisions'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/payments/{id}/cod-collection': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Xác nhận đã thu tiền COD
     * @description **Quyền:** `manage:Payment`.
     */
    post: operations['post_api_admin_payments_id_cod_collection'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/payments/{id}/reconcile': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Đối soát lần thanh toán với provider
     * @description **Quyền:** `manage:Payment`.
     */
    post: operations['post_api_admin_payments_id_reconcile'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/post-categories': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Tạo chuyên mục bài viết
     * @description **Quyền:** `write:Content`.
     */
    post: operations['post_api_admin_post_categories'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/post-categories/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Cập nhật chuyên mục bài viết
     * @description **Quyền:** `write:Content`.
     */
    patch: operations['patch_api_admin_post_categories_id'];
    trace?: never;
  };
  '/api/admin/post-tags': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Tạo thẻ bài viết
     * @description **Quyền:** `write:Content`.
     */
    post: operations['post_api_admin_post_tags'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/post-tags/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Cập nhật thẻ bài viết
     * @description **Quyền:** `write:Content`.
     */
    patch: operations['patch_api_admin_post_tags_id'];
    trace?: never;
  };
  '/api/admin/posts': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách bài viết (Admin)
     * @description **Quyền:** `read:Content`.
     */
    get: operations['get_api_admin_posts'];
    put?: never;
    /**
     * Tạo bài viết nháp
     * @description **Quyền:** `write:Content`.
     */
    post: operations['post_api_admin_posts'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/posts/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết bài viết (Admin)
     * @description **Quyền:** `read:Content`.
     */
    get: operations['get_api_admin_posts_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Cập nhật bài viết nháp
     * @description Bản đang xuất bản giữ nguyên cho đến khi publish lại.
     *
     *     **Quyền:** `write:Content`.
     */
    patch: operations['patch_api_admin_posts_id'];
    trace?: never;
  };
  '/api/admin/posts/{id}/archive': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Lưu trữ bài viết
     * @description **Quyền:** `publish:Content`.
     */
    post: operations['post_api_admin_posts_id_archive'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/posts/{id}/publish': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Xuất bản hoặc lên lịch bài viết
     * @description Có `scheduledAt` thì lên lịch; không có thì xuất bản ngay.
     *
     *     **Quyền:** `publish:Content`.
     */
    post: operations['post_api_admin_posts_id_publish'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/posts/{id}/revisions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Lịch sử revision của bài viết
     * @description **Quyền:** `read:Content`.
     */
    get: operations['get_api_admin_posts_id_revisions'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/products': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách sản phẩm (Admin, gồm bản nháp)
     * @description **Quyền:** `read:Catalog`.
     */
    get: operations['get_api_admin_products'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/products/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết sản phẩm (Admin)
     * @description **Quyền:** `read:Catalog`.
     */
    get: operations['get_api_admin_products_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/products/{id}/variants': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách SKU của sản phẩm (Admin)
     * @description **Quyền:** `read:Catalog`.
     */
    get: operations['get_api_admin_products_id_variants'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/promotions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách khuyến mãi
     * @description **Quyền:** `read:Promotion`.
     */
    get: operations['get_api_admin_promotions'];
    put?: never;
    /**
     * Tạo khuyến mãi
     * @description **Quyền:** `write:Promotion`.
     */
    post: operations['post_api_admin_promotions'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/promotions/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết khuyến mãi
     * @description **Quyền:** `read:Promotion`.
     */
    get: operations['get_api_admin_promotions_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Cập nhật khuyến mãi
     * @description **Quyền:** `write:Promotion`.
     */
    patch: operations['patch_api_admin_promotions_id'];
    trace?: never;
  };
  '/api/admin/refunds/{id}/manual-confirmation': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Xác nhận đã chuyển khoản hoàn tiền
     * @description **Quyền:** `manage:Refund`.
     */
    post: operations['post_api_admin_refunds_id_manual_confirmation'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/refunds/{id}/reconcile': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Đối soát hoàn tiền với provider
     * @description **Quyền:** `manage:Refund`.
     */
    post: operations['post_api_admin_refunds_id_reconcile'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/refunds/{id}/retry': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Chạy lại hoàn tiền thất bại
     * @description Chỉ áp dụng khi provider đã xác nhận thất bại; trường hợp chưa rõ kết quả phải đối soát trước.
     *
     *     **Quyền:** `manage:Refund`.
     */
    post: operations['post_api_admin_refunds_id_retry'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/report-exports': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Tạo file export báo cáo
     * @description **Quyền:** `export:Report`. Bắt buộc header `Idempotency-Key`.
     */
    post: operations['post_api_admin_report_exports'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/report-exports/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Xem trạng thái export báo cáo
     * @description **Quyền:** `export:Report`.
     */
    get: operations['get_api_admin_report_exports_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/report-exports/{id}/download': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Tải file export báo cáo
     * @description **Quyền:** `export:Report`.
     */
    get: operations['get_api_admin_report_exports_id_download'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/reports/inventory': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Báo cáo tồn kho
     * @description **Quyền:** `read:Report`.
     */
    get: operations['get_api_admin_reports_inventory'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/reports/orders': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Báo cáo đơn hàng
     * @description **Quyền:** `read:Report`.
     */
    get: operations['get_api_admin_reports_orders'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/reports/products': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Báo cáo sản phẩm
     * @description **Quyền:** `read:Report`.
     */
    get: operations['get_api_admin_reports_products'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/reports/sales': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Báo cáo doanh thu
     * @description **Quyền:** `read:Report`.
     */
    get: operations['get_api_admin_reports_sales'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/returns': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách yêu cầu trả hàng (Admin)
     * @description **Quyền:** `read:Return`.
     */
    get: operations['get_api_admin_returns'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/reviews': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách đánh giá (Admin)
     * @description **Quyền:** `read:Review`.
     */
    get: operations['get_api_admin_reviews'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/roles': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách vai trò và quyền
     * @description **Quyền:** `read:Staff`.
     */
    get: operations['get_api_admin_roles'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/settings/commerce': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Xem cấu hình thương mại
     * @description **Quyền:** `manage:Settings`.
     */
    get: operations['get_api_admin_settings_commerce'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Cập nhật cấu hình thương mại
     * @description **Quyền:** `manage:Settings`.
     */
    patch: operations['patch_api_admin_settings_commerce'];
    trace?: never;
  };
  '/api/admin/settings/shop': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Xem cấu hình shop
     * @description **Quyền:** `manage:Settings`.
     */
    get: operations['get_api_admin_settings_shop'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Cập nhật cấu hình shop
     * @description **Quyền:** `manage:Settings`.
     */
    patch: operations['patch_api_admin_settings_shop'];
    trace?: never;
  };
  '/api/admin/shipping-methods': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách phương thức vận chuyển
     * @description **Quyền:** `manage:Settings`.
     */
    get: operations['get_api_admin_shipping_methods'];
    put?: never;
    /**
     * Tạo phương thức vận chuyển
     * @description **Quyền:** `manage:Settings`.
     */
    post: operations['post_api_admin_shipping_methods'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/shipping-methods/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết phương thức vận chuyển
     * @description **Quyền:** `manage:Settings`.
     */
    get: operations['get_api_admin_shipping_methods_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Cập nhật phương thức vận chuyển
     * @description **Quyền:** `manage:Settings`.
     */
    patch: operations['patch_api_admin_shipping_methods_id'];
    trace?: never;
  };
  '/api/admin/size-guides': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách bảng size
     * @description **Quyền:** `read:Catalog`.
     */
    get: operations['get_api_admin_size_guides'];
    put?: never;
    /**
     * Tạo bảng size
     * @description **Quyền:** `write:Catalog`.
     */
    post: operations['post_api_admin_size_guides'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/size-guides/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết bảng size
     * @description **Quyền:** `read:Catalog`.
     */
    get: operations['get_api_admin_size_guides_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Cập nhật bảng size
     * @description **Quyền:** `write:Catalog`.
     */
    patch: operations['patch_api_admin_size_guides_id'];
    trace?: never;
  };
  '/api/admin/staff': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách nhân viên
     * @description **Quyền:** `read:Staff`.
     */
    get: operations['get_api_admin_staff'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/staff/{id}/role': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Đổi vai trò nhân viên
     * @description **Quyền:** `manage:Staff`.
     */
    patch: operations['patch_api_admin_staff_id_role'];
    trace?: never;
  };
  '/api/admin/staff/{id}/status': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Đổi trạng thái nhân viên
     * @description **Quyền:** `manage:Staff`.
     */
    patch: operations['patch_api_admin_staff_id_status'];
    trace?: never;
  };
  '/api/admin/staff/invitations': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Mời nhân viên
     * @description **Quyền:** `manage:Staff`.
     */
    post: operations['post_api_admin_staff_invitations'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/support/tickets': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách ticket (Admin)
     * @description **Quyền:** `read:Support`.
     */
    get: operations['get_api_admin_support_tickets'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/support/tickets/{id}/assign': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Phân công ticket
     * @description **Quyền:** `manage:Support`.
     */
    post: operations['post_api_admin_support_tickets_id_assign'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/system/contracts': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Contract trạng thái của hệ thống
     * @description **Quyền:** `read:System`.
     */
    get: operations['get_api_admin_system_contracts'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/admin/variants': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Tìm SKU trên toàn catalog
     * @description **Quyền:** `read:Catalog`.
     */
    get: operations['get_api_admin_variants'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
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
  '/api/auth/email-verification-requests': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Gửi lại email xác minh
     * @description Luôn trả thành công để không lộ email nào đã đăng ký.
     *
     *     **Công khai.**
     */
    post: operations['post_api_auth_email_verification_requests'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/email-verifications': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Xác minh email bằng token
     * @description **Công khai.**
     */
    post: operations['post_api_auth_email_verifications'];
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
  '/api/auth/google': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Đăng nhập bằng Google ID token
     * @description **Công khai.**
     */
    post: operations['post_api_auth_google'];
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
  '/api/auth/login': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Đăng nhập bằng email và mật khẩu
     * @description **Công khai.**
     */
    post: operations['post_api_auth_login'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/logout': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Đăng xuất và thu hồi refresh token
     * @description **Công khai.**
     */
    post: operations['post_api_auth_logout'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/me': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Thông tin người dùng hiện tại
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_auth_me'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Cập nhật thông tin người dùng hiện tại
     * @description **Yêu cầu đăng nhập.**
     */
    patch: operations['patch_api_auth_me'];
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
  '/api/auth/password': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Đặt hoặc đổi mật khẩu
     * @description **Yêu cầu đăng nhập.**
     */
    patch: operations['patch_api_auth_password'];
    trace?: never;
  };
  '/api/auth/password-reset-requests': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Yêu cầu đặt lại mật khẩu
     * @description Luôn trả thành công để không lộ email nào đã đăng ký.
     *
     *     **Công khai.**
     */
    post: operations['post_api_auth_password_reset_requests'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/password-resets': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Đặt lại mật khẩu bằng token
     * @description **Công khai.**
     */
    post: operations['post_api_auth_password_resets'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/auth/refresh': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Lấy access token mới từ refresh token
     * @description **Công khai.**
     */
    post: operations['post_api_auth_refresh'];
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
  '/api/auth/register': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Đăng ký tài khoản khách hàng
     * @description **Công khai.**
     */
    post: operations['post_api_auth_register'];
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
  '/api/cancellation-requests/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Xem yêu cầu huỷ
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_cancellation_requests_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/cancellation-requests/{id}/approve': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Duyệt yêu cầu huỷ
     * @description **Quyền:** `manage:Order`.
     */
    post: operations['post_api_cancellation_requests_id_approve'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/cancellation-requests/{id}/reject': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Từ chối yêu cầu huỷ
     * @description **Quyền:** `manage:Order`.
     */
    post: operations['post_api_cancellation_requests_id_reject'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/cart': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Xem giỏ hàng
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_cart'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/cart/items': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Thêm SKU vào giỏ
     * @description **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_cart_items'];
    /**
     * Xoá toàn bộ giỏ
     * @description **Yêu cầu đăng nhập.**
     */
    delete: operations['delete_api_cart_items'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/cart/items/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /**
     * Xoá một dòng trong giỏ
     * @description **Yêu cầu đăng nhập.**
     */
    delete: operations['delete_api_cart_items_id'];
    options?: never;
    head?: never;
    /**
     * Đổi số lượng một dòng trong giỏ
     * @description **Yêu cầu đăng nhập.**
     */
    patch: operations['patch_api_cart_items_id'];
    trace?: never;
  };
  '/api/cart/merge': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Gộp giỏ khách vãng lai sau khi đăng nhập
     * @description **Yêu cầu đăng nhập.** Bắt buộc header `Idempotency-Key`.
     */
    post: operations['post_api_cart_merge'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/categories': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách danh mục
     * @description **Công khai.** Không gửi tham số phân trang thì trả toàn bộ dưới dạng mảng, không có `meta`.
     */
    get: operations['get_api_categories'];
    put?: never;
    /**
     * Tạo danh mục
     * @description **Quyền:** `write:Catalog`.
     */
    post: operations['post_api_categories'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/categories/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết danh mục
     * @description **Công khai.**
     */
    get: operations['get_api_categories_id'];
    /**
     * Cập nhật danh mục
     * @description **Quyền:** `write:Catalog`.
     */
    put: operations['put_api_categories_id'];
    post?: never;
    /**
     * Xoá danh mục
     * @description **Quyền:** `write:Catalog`.
     */
    delete: operations['delete_api_categories_id'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/checkout/quotes': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Tạo báo giá checkout
     * @description Không gửi `items` thì dùng giỏ hàng hiện tại. Giá, giảm giá và phí ship đều do server tính.
     *
     *     **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_checkout_quotes'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/checkout/quotes/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Xem báo giá checkout
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_checkout_quotes_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/collections': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách bộ sưu tập đang hiển thị
     * @description **Công khai.** Không gửi tham số phân trang thì trả toàn bộ dưới dạng mảng, không có `meta`.
     */
    get: operations['get_api_collections'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/collections/{slug}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Xem bộ sưu tập
     * @description **Công khai.**
     */
    get: operations['get_api_collections_slug'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/coupons': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách coupon
     * @description **Quyền:** `read:Promotion`. Không gửi tham số phân trang thì trả toàn bộ dưới dạng mảng, không có `meta`.
     */
    get: operations['get_api_coupons'];
    put?: never;
    /**
     * Tạo coupon
     * @description **Quyền:** `write:Promotion`.
     */
    post: operations['post_api_coupons'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/coupons/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /**
     * Cập nhật coupon
     * @description **Quyền:** `write:Promotion`.
     */
    put: operations['put_api_coupons_id'];
    post?: never;
    /**
     * Xoá coupon
     * @description **Quyền:** `write:Promotion`.
     */
    delete: operations['delete_api_coupons_id'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/coupons/preview': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Xem trước số tiền giảm của coupon
     * @description **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_coupons_preview'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/dashboard/stats': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Số liệu tổng quan
     * @description **Quyền:** `read:Report`.
     */
    get: operations['get_api_dashboard_stats'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/exchanges/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết yêu cầu đổi hàng
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_exchanges_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/exchanges/{id}/approve': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Duyệt đổi hàng
     * @description **Quyền:** `manage:Return`.
     */
    post: operations['post_api_exchanges_id_approve'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/exchanges/{id}/create-replacement': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Tạo đơn thay thế
     * @description Gọi lặp không tạo đơn thứ hai.
     *
     *     **Quyền:** `manage:Return`.
     */
    post: operations['post_api_exchanges_id_create_replacement'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/exchanges/{id}/reject': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Từ chối đổi hàng
     * @description **Quyền:** `manage:Return`.
     */
    post: operations['post_api_exchanges_id_reject'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/exchanges/mine': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Yêu cầu đổi hàng của tôi
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_exchanges_mine'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/files/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /**
     * Xoá file
     * @description **Yêu cầu đăng nhập.**
     */
    delete: operations['delete_api_files_id'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/files/{id}/download': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Tải file riêng tư
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_files_id_download'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/files/sign-upload-url': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Lấy URL ký upload Cloudinary
     * @description **Quyền:** `write:Catalog`.
     */
    get: operations['get_api_files_sign_upload_url'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/files/sign-upload-urls': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Lấy nhiều URL ký upload Cloudinary
     * @description **Quyền:** `write:Catalog`.
     */
    get: operations['get_api_files_sign_upload_urls'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/files/uploads': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Tạo upload ticket
     * @description **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_files_uploads'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/files/uploads/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Xem upload ticket
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_files_uploads_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/files/uploads/{id}/complete': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Hoàn tất upload
     * @description Server kiểm tra file trên Cloudinary khớp ticket về owner, purpose và kích thước.
     *
     *     **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_files_uploads_id_complete'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/files/uploads/batch': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Tạo upload ticket cho nhiều file
     * @description **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_files_uploads_batch'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/files/uploads/batch/complete': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Hoàn tất upload nhiều file
     * @description Worker kiểm tra từng file; file lỗi không ảnh hưởng các file còn lại.
     *
     *     **Yêu cầu đăng nhập.** Bắt buộc header `Idempotency-Key`.
     */
    post: operations['post_api_files_uploads_batch_complete'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/internal/metrics': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Metrics vận hành
     * @description **Quyền:** `read:System`.
     */
    get: operations['get_api_internal_metrics'];
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
     * Quyền của tôi
     * @description **Yêu cầu đăng nhập.**
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
  '/api/me/email-change-requests': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Yêu cầu đổi email
     * @description **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_me_email_change_requests'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/me/email-changes/confirm': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Xác nhận đổi email bằng token
     * @description **Công khai.**
     */
    post: operations['post_api_me_email_changes_confirm'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/me/notification-preferences': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Xem tuỳ chọn nhận thông báo
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_me_notification_preferences'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Cập nhật tuỳ chọn nhận thông báo
     * @description **Yêu cầu đăng nhập.**
     */
    patch: operations['patch_api_me_notification_preferences'];
    trace?: never;
  };
  '/api/me/preferences': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Xem tuỳ chọn của tôi
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_me_preferences'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Cập nhật tuỳ chọn của tôi
     * @description **Yêu cầu đăng nhập.**
     */
    patch: operations['patch_api_me_preferences'];
    trace?: never;
  };
  '/api/me/profile': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Xem hồ sơ của tôi
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_me_profile'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Cập nhật hồ sơ của tôi
     * @description **Yêu cầu đăng nhập.**
     */
    patch: operations['patch_api_me_profile'];
    trace?: never;
  };
  '/api/me/sessions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách phiên đăng nhập của tôi
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_me_sessions'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/me/sessions/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /**
     * Thu hồi một phiên đăng nhập
     * @description **Yêu cầu đăng nhập.**
     */
    delete: operations['delete_api_me_sessions_id'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/me/sessions/revoke-others': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Thu hồi mọi phiên khác
     * @description **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_me_sessions_revoke_others'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/navigation/{placement}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Xem điều hướng đang hiển thị
     * @description **Công khai.**
     */
    get: operations['get_api_navigation_placement'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/notifications': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Hộp thư thông báo của tôi
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_notifications'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/notifications/{id}/read': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Đánh dấu đã đọc một thông báo
     * @description **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_notifications_id_read'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/notifications/read-all': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Đánh dấu đã đọc tất cả
     * @description **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_notifications_read_all'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/notifications/unread-count': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Số thông báo chưa đọc
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_notifications_unread_count'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/order-items/{id}/reviews': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Đánh giá sản phẩm đã mua
     * @description Item phải đã giao và thuộc người mua; đánh giá chờ kiểm duyệt.
     *
     *     **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_order_items_id_reviews'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/orders': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách đơn hàng (Admin)
     * @description **Quyền:** `read:Order`.
     */
    get: operations['get_api_orders'];
    put?: never;
    /**
     * Đặt đơn
     * @description Nên gửi `quoteId` từ `POST /api/checkout/quotes`: server khoá tồn kho, kiểm tra lại quote và chống tạo đơn trùng. Luồng cũ gửi `items` theo `productId` vẫn được giữ cho client hiện tại; khi có `quoteId` các field khác bị bỏ qua.
     *
     *     **Vai trò:** user. Bắt buộc header `Idempotency-Key`.
     */
    post: operations['post_api_orders'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/orders/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết đơn hàng
     * @description **Vai trò:** user, admin.
     */
    get: operations['get_api_orders_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/orders/{id}/cancel': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Huỷ đơn
     * @description **Vai trò:** user, admin.
     */
    post: operations['post_api_orders_id_cancel'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/orders/{id}/cancellation-requests': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Yêu cầu huỷ một phần hoặc toàn bộ đơn
     * @description **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_orders_id_cancellation_requests'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/orders/{id}/confirm': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Xác nhận đơn
     * @description **Quyền:** `manage:Order`.
     */
    post: operations['post_api_orders_id_confirm'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/orders/{id}/events': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Lịch sử trạng thái đơn
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_orders_id_events'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/orders/{id}/exchanges': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Tạo yêu cầu đổi hàng
     * @description **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_orders_id_exchanges'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/orders/{id}/payment-attempts': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Tạo lần thanh toán
     * @description **Yêu cầu đăng nhập.** Bắt buộc header `Idempotency-Key`.
     */
    post: operations['post_api_orders_id_payment_attempts'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/orders/{id}/payments': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách lần thanh toán của đơn
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_orders_id_payments'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/orders/{id}/refunds': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Tạo yêu cầu hoàn tiền
     * @description Chỉ tạo yêu cầu `pending`; tiền và tồn kho được xử lý ở bước riêng.
     *
     *     **Quyền:** `manage:Refund`. Bắt buộc header `Idempotency-Key`.
     */
    post: operations['post_api_orders_id_refunds'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/orders/{id}/returns': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Tạo yêu cầu trả hàng
     * @description **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_orders_id_returns'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/orders/{id}/shipments': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách kiện hàng của đơn
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_orders_id_shipments'];
    put?: never;
    /**
     * Tạo kiện hàng
     * @description Một đơn có thể tách nhiều kiện; không chia vượt số lượng đã đặt.
     *
     *     **Quyền:** `manage:Fulfillment`.
     */
    post: operations['post_api_orders_id_shipments'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/orders/{id}/start-processing': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Bắt đầu xử lý đơn
     * @description **Quyền:** `manage:Order`.
     */
    post: operations['post_api_orders_id_start_processing'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/orders/mine': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Đơn hàng của tôi
     * @description **Vai trò:** user, admin.
     */
    get: operations['get_api_orders_mine'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/pages/{slug}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Xem trang CMS đã xuất bản
     * @description **Công khai.**
     */
    get: operations['get_api_pages_slug'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/payments/{id}/mock-pay': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Giả lập thanh toán (mock)
     * @description Chỉ có ngoài production.
     *
     *     **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_payments_id_mock_pay'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/payments/webhook/stripe': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Webhook Stripe
     * @description Yêu cầu raw body và `Stripe-Signature`. Event trùng được bỏ qua.
     *
     *     **Xác thực bằng chữ ký Stripe**, không dùng bearer token.
     */
    post: operations['post_api_payments_webhook_stripe'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/policies/current': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chính sách đang hiệu lực
     * @description **Công khai.**
     */
    get: operations['get_api_policies_current'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/post-categories': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách chuyên mục bài viết
     * @description **Công khai.** Không gửi tham số phân trang thì trả toàn bộ dưới dạng mảng, không có `meta`.
     */
    get: operations['get_api_post_categories'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/post-tags': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách thẻ bài viết
     * @description **Công khai.** Không gửi tham số phân trang thì trả toàn bộ dưới dạng mảng, không có `meta`.
     */
    get: operations['get_api_post_tags'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/posts': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách bài viết đã xuất bản
     * @description **Công khai.**
     */
    get: operations['get_api_posts'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/posts/{slug}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Xem bài viết đã xuất bản
     * @description **Công khai.**
     */
    get: operations['get_api_posts_slug'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/processes': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách process của tôi
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_processes'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/processes/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Xem trạng thái process
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_processes_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/processes/{id}/cancel': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Huỷ process
     * @description **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_processes_id_cancel'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/processes/{id}/confirm': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Xác nhận áp dụng import
     * @description **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_processes_id_confirm'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/processes/{id}/download': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Tải file kết quả của process
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_processes_id_download'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/processes/{id}/items': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Kết quả và lỗi từng dòng/từng file
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_processes_id_items'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/products': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách sản phẩm
     * @description **Công khai.**
     */
    get: operations['get_api_products'];
    put?: never;
    /**
     * Tạo sản phẩm
     * @description **Quyền:** `write:Catalog`.
     */
    post: operations['post_api_products'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/products/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết sản phẩm
     * @description **Công khai.**
     */
    get: operations['get_api_products_id'];
    /**
     * Cập nhật sản phẩm
     * @description **Quyền:** `write:Catalog`.
     */
    put: operations['put_api_products_id'];
    post?: never;
    /**
     * Xoá sản phẩm
     * @description **Quyền:** `write:Catalog`.
     */
    delete: operations['delete_api_products_id'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/products/{id}/images': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Thêm ảnh sản phẩm
     * @description **Quyền:** `write:Catalog`.
     */
    post: operations['post_api_products_id_images'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/products/{id}/images/{imageId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /**
     * Xoá ảnh sản phẩm
     * @description **Quyền:** `write:Catalog`.
     */
    delete: operations['delete_api_products_id_images_imageId'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/products/{id}/publication': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Đổi trạng thái xuất bản sản phẩm
     * @description **Quyền:** `write:Catalog`.
     */
    patch: operations['patch_api_products_id_publication'];
    trace?: never;
  };
  '/api/products/{id}/review-summary': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Tổng hợp điểm đánh giá của sản phẩm
     * @description **Công khai.**
     */
    get: operations['get_api_products_id_review_summary'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/products/{id}/reviews': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách đánh giá của sản phẩm
     * @description **Công khai.** Không gửi tham số phân trang thì trả toàn bộ dưới dạng mảng, không có `meta`.
     */
    get: operations['get_api_products_id_reviews'];
    put?: never;
    /**
     * Đánh giá sản phẩm (luồng cũ)
     * @description **Vai trò:** user, admin.
     */
    post: operations['post_api_products_id_reviews'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/products/{id}/reviews/{reviewId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /**
     * Xoá đánh giá
     * @description **Vai trò:** user, admin.
     */
    delete: operations['delete_api_products_id_reviews_reviewId'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/products/{id}/variants': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách SKU đang bán của sản phẩm
     * @description **Công khai.**
     */
    get: operations['get_api_products_id_variants'];
    put?: never;
    /**
     * Tạo SKU
     * @description **Quyền:** `write:Catalog`.
     */
    post: operations['post_api_products_id_variants'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/products/{id}/variants/{variantId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Cập nhật SKU
     * @description Không nhận `stock`, `onHand`, `reserved`: tồn kho chỉ đổi qua ledger ở nhóm inventory.
     *
     *     **Quyền:** `write:Catalog`.
     */
    patch: operations['patch_api_products_id_variants_variantId'];
    trace?: never;
  };
  '/api/products/{id}/variants/{variantId}/images': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Gán ảnh cho SKU
     * @description **Quyền:** `write:Catalog`.
     */
    patch: operations['patch_api_products_id_variants_variantId_images'];
    trace?: never;
  };
  '/api/products/by-slug/{slug}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Xem sản phẩm theo slug
     * @description Slug cũ được chuyển sang sản phẩm hiện tại qua bản ghi redirect.
     *
     *     **Công khai.**
     */
    get: operations['get_api_products_by_slug_slug'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/products/facets': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Bộ lọc khả dụng của sản phẩm
     * @description **Công khai.**
     */
    get: operations['get_api_products_facets'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/refunds': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách hoàn tiền
     * @description **Quyền:** `read:Refund`. Không gửi tham số phân trang thì trả toàn bộ dưới dạng mảng, không có `meta`.
     */
    get: operations['get_api_refunds'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/refunds/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết hoàn tiền
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_refunds_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/returns/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết yêu cầu trả hàng
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_returns_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/returns/{id}/approve': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Duyệt trả hàng
     * @description **Quyền:** `manage:Return`.
     */
    post: operations['post_api_returns_id_approve'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/returns/{id}/complete': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Hoàn tất trả hàng
     * @description **Quyền:** `manage:Return`.
     */
    post: operations['post_api_returns_id_complete'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/returns/{id}/in-transit': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Đánh dấu hàng trả đang về
     * @description **Quyền:** `manage:Return`.
     */
    post: operations['post_api_returns_id_in_transit'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/returns/{id}/inspect': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Kiểm tra hàng trả
     * @description Chỉ số lượng `saleableQuantity` được cộng lại tồn kho.
     *
     *     **Quyền:** `manage:Return`.
     */
    post: operations['post_api_returns_id_inspect'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/returns/{id}/receive': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Đánh dấu đã nhận hàng trả
     * @description **Quyền:** `manage:Return`.
     */
    post: operations['post_api_returns_id_receive'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/returns/{id}/reject': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Từ chối trả hàng
     * @description **Quyền:** `manage:Return`.
     */
    post: operations['post_api_returns_id_reject'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/returns/mine': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Yêu cầu trả hàng của tôi
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_returns_mine'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/reviews/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Sửa đánh giá của tôi
     * @description **Yêu cầu đăng nhập.**
     */
    patch: operations['patch_api_reviews_id'];
    trace?: never;
  };
  '/api/reviews/{id}/moderation': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Kiểm duyệt đánh giá
     * @description **Quyền:** `moderate:Review`.
     */
    post: operations['post_api_reviews_id_moderation'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/reviews/{id}/reply': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /**
     * Phản hồi đánh giá
     * @description **Quyền:** `reply:Review`.
     */
    put: operations['put_api_reviews_id_reply'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/reviews/{id}/reports': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Báo cáo đánh giá vi phạm
     * @description **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_reviews_id_reports'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/search/suggestions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Gợi ý tìm kiếm
     * @description **Công khai.**
     */
    get: operations['get_api_search_suggestions'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/shipments/{id}/cancel': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Huỷ kiện hàng
     * @description **Quyền:** `manage:Fulfillment`.
     */
    post: operations['post_api_shipments_id_cancel'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/shipments/{id}/deliver': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Đánh dấu đã giao
     * @description Với COD, giao xong chưa đồng nghĩa đã thu tiền; xác nhận riêng qua `cod-collection`.
     *
     *     **Quyền:** `manage:Fulfillment`.
     */
    post: operations['post_api_shipments_id_deliver'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/shipments/{id}/events': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Lịch sử trạng thái kiện hàng
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_shipments_id_events'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/shipments/{id}/fail': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Đánh dấu giao thất bại
     * @description **Quyền:** `manage:Fulfillment`.
     */
    post: operations['post_api_shipments_id_fail'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/shipments/{id}/handover': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Bàn giao cho đơn vị vận chuyển
     * @description **Quyền:** `manage:Fulfillment`.
     */
    post: operations['post_api_shipments_id_handover'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/shipments/{id}/lose': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Đánh dấu thất lạc
     * @description **Quyền:** `manage:Fulfillment`.
     */
    post: operations['post_api_shipments_id_lose'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/shipments/{id}/out-for-delivery': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Đánh dấu đang giao
     * @description **Quyền:** `manage:Fulfillment`.
     */
    post: operations['post_api_shipments_id_out_for_delivery'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/shipments/{id}/pack': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Đóng gói kiện hàng
     * @description **Quyền:** `manage:Fulfillment`.
     */
    post: operations['post_api_shipments_id_pack'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/shipments/{id}/ready': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Đánh dấu sẵn sàng giao
     * @description **Quyền:** `manage:Fulfillment`.
     */
    post: operations['post_api_shipments_id_ready'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/shipments/{id}/return': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Đánh dấu hoàn về
     * @description **Quyền:** `manage:Fulfillment`.
     */
    post: operations['post_api_shipments_id_return'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/shipping/quotes': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Tính phí vận chuyển
     * @description **Công khai.**
     */
    post: operations['post_api_shipping_quotes'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/shop/config': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Cấu hình shop công khai
     * @description **Công khai.**
     */
    get: operations['get_api_shop_config'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/staff/invitations/accept': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Chấp nhận lời mời nhân viên
     * @description **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_staff_invitations_accept'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/stock-alert-subscriptions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Đăng ký báo còn hàng
     * @description **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_stock_alert_subscriptions'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/stock-alert-subscriptions/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /**
     * Huỷ đăng ký báo còn hàng
     * @description **Yêu cầu đăng nhập.**
     */
    delete: operations['delete_api_stock_alert_subscriptions_id'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/stock-alert-subscriptions/mine': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Đăng ký báo còn hàng của tôi
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_stock_alert_subscriptions_mine'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/storefront/home': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Dữ liệu trang chủ Storefront
     * @description **Công khai.**
     */
    get: operations['get_api_storefront_home'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/support/tickets': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Tạo ticket hỗ trợ
     * @description **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_support_tickets'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/support/tickets/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết ticket
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_support_tickets_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/support/tickets/{id}/close': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Đóng ticket
     * @description **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_support_tickets_id_close'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/support/tickets/{id}/messages': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Tin nhắn của ticket
     * @description Khách không thấy ghi chú nội bộ.
     *
     *     **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_support_tickets_id_messages'];
    put?: never;
    /**
     * Gửi tin nhắn vào ticket
     * @description **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_support_tickets_id_messages'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/support/tickets/mine': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Ticket của tôi
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_support_tickets_mine'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/wishlist': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách yêu thích của tôi
     * @description **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_wishlist'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/wishlist/items/{productId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /**
     * Thêm sản phẩm vào yêu thích
     * @description **Yêu cầu đăng nhập.**
     */
    put: operations['put_api_wishlist_items_productId'];
    post?: never;
    /**
     * Bỏ sản phẩm khỏi yêu thích
     * @description **Yêu cầu đăng nhập.**
     */
    delete: operations['delete_api_wishlist_items_productId'];
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
     * Kiểm tra sức khoẻ service
     * @description **Công khai.**
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
     * Liveness probe
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
  '/health/ready': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Readiness probe (kiểm tra kết nối DB)
     * @description **Công khai.**
     */
    get: operations['get_health_ready'];
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
    AbilityRule: {
      action:
        | 'read'
        | 'write'
        | 'manage'
        | 'publish'
        | 'moderate'
        | 'reply'
        | 'export'
        | '*'
        | ('*' | 'export' | 'manage' | 'moderate' | 'publish' | 'read' | 'reply' | 'write')[];
      conditions?: {
        [key: string]: components['schemas']['JsonValue'];
      };
      inverted?: boolean;
      subject:
        | 'System'
        | 'Staff'
        | 'Customer'
        | 'AuditLog'
        | 'Catalog'
        | 'Inventory'
        | 'Settings'
        | 'Promotion'
        | 'Order'
        | 'Payment'
        | 'Fulfillment'
        | 'Return'
        | 'Refund'
        | 'Review'
        | 'Content'
        | 'Support'
        | 'Notification'
        | 'Report'
        | 'all'
        | (
            | 'AuditLog'
            | 'Catalog'
            | 'Content'
            | 'Customer'
            | 'Fulfillment'
            | 'Inventory'
            | 'Notification'
            | 'Order'
            | 'Payment'
            | 'Promotion'
            | 'Refund'
            | 'Report'
            | 'Return'
            | 'Review'
            | 'Settings'
            | 'Staff'
            | 'Support'
            | 'System'
            | 'all'
          )[];
    };
    /** @enum {string} */
    AccountStatus: 'active' | 'blocked' | 'closed';
    Address: {
      city: string;
      fullName: string;
      id: string;
      isDefault: boolean;
      line1: string;
      phone: string;
      userId: string;
    };
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
      /** @default user */
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
    CancellationRequest: {
      createdAt: string;
      id: string;
      items: components['schemas']['OrderQuantityInput'][];
      orderId: string;
      reason: string;
      resolution: string | null;
      /** @enum {string} */
      status: 'approved' | 'rejected' | 'requested';
      version: number;
    };
    Cart: {
      currency: string;
      id: string;
      items: components['schemas']['CartItem'][];
      subtotal: number;
      version: number;
    };
    CartItem: {
      available: number;
      color: string;
      id: string;
      productId: string | null;
      productName: string;
      quantity: number;
      size: string;
      sku: string;
      unitPrice: number;
      variantId: string;
      warnings: components['schemas']['CartWarning'][];
    };
    CartLineInput: {
      quantity: number;
      variantId: string;
    };
    /** @enum {string} */
    CartWarning: 'insufficient_stock' | 'price_changed' | 'unavailable';
    CatalogProduct: {
      brand: string;
      careInstructions: string;
      category?: components['schemas']['Category'] | null;
      categoryId?: string | null;
      description: string;
      id: string;
      imageId?: string | null;
      images?: components['schemas']['ProductImage'][];
      imageUrl: string;
      material: string;
      name: string;
      price: number;
      seoDescription: string;
      seoTitle: string;
      sizeGuideId: string | null;
      slug: string;
      status: components['schemas']['ProductPublicationStatus'];
      stock: number;
      version: number;
    };
    Category: {
      description: string;
      id: string;
      name: string;
      slug: string;
    };
    CategoryInput: {
      description?: string;
      name: string;
      slug: string;
    };
    CheckoutQuote: {
      addressId: string | null;
      currency: string;
      discount: components['schemas']['DiscountResult'];
      discountAmount: number;
      expiresAt: string;
      id: string;
      items: components['schemas']['QuoteItemSnapshot'][];
      policyVersion: number;
      reservationTtlSeconds: number;
      returnWindowDays: number;
      shipping: components['schemas']['ShippingQuote'];
      shippingAddress: components['schemas']['ShippingAddressInput'];
      shippingFee: number;
      /** @enum {string} */
      status: 'active' | 'consumed' | 'expired';
      subtotal: number;
      total: number;
    };
    CheckoutQuoteSnapshot: {
      addressId: string | null;
      currency: string;
      discount: components['schemas']['DiscountResult'];
      discountAmount: number;
      items: components['schemas']['QuoteItemSnapshot'][];
      policyVersion: number;
      reservationTtlSeconds: number;
      returnWindowDays: number;
      shipping: components['schemas']['ShippingQuote'];
      shippingAddress: components['schemas']['ShippingAddressInput'];
      shippingFee: number;
      subtotal: number;
      total: number;
    };
    CommerceSettings: {
      quoteTtlSeconds: number;
      reservationTtlSeconds: number;
      returnWindowDays: number;
      version: number;
    };
    ContentBlock:
      | {
          text: string;
          /** @enum {string} */
          type: 'heading' | 'paragraph';
        }
      | {
          alt: string;
          fileId: string;
          /** @enum {string} */
          type: 'image';
        }
      | {
          href: string;
          label: string;
          /** @enum {string} */
          type: 'link';
        };
    ContentEntry: {
      body: components['schemas']['ContentBlock'][];
      coverFileId: string | null;
      excerpt: string;
      id: string;
      kind: components['schemas']['ContentKind'];
      publishedAt: string | null;
      scheduledAt: string | null;
      seoDescription: string;
      seoTitle: string;
      slug: string;
      status: components['schemas']['ContentStatus'];
      taxonomyIds: string[];
      title: string;
      version: number;
    };
    /** @enum {string} */
    ContentKind: 'page' | 'post';
    /** @enum {string} */
    ContentStatus: 'archived' | 'draft' | 'published' | 'scheduled';
    Coupon: {
      categoryIds?: string[];
      code: string;
      endsAt?: string | null;
      id: string;
      isActive: boolean;
      maxDiscount?: number | null;
      minOrderAmount: number;
      perUserLimit?: number | null;
      startsAt?: string | null;
      type: components['schemas']['CouponType'];
      usageLimit?: number | null;
      usedCount: number;
      value: number;
      variantIds?: string[];
      version?: number;
    };
    /** @enum {string} */
    CouponType: 'fixed' | 'percent';
    DashboardStats: {
      lowStockProducts: components['schemas']['Product'][];
      orderCount: number;
      totalRevenue: number;
    };
    DiscountResult: {
      allocations: number[];
      amount: number;
      code: string | null;
      couponId: string | null;
      promotionId: string | null;
      ruleVersion: number | null;
    };
    ExchangeLine: {
      orderItemId: string;
      quantity: number;
      variantId: string;
    };
    ExchangeRequest: {
      id: string;
      items: components['schemas']['ExchangeLine'][];
      orderId: string;
      originalRefundAmount: number | null;
      priceDifference: number | null;
      quoteId: string | null;
      reason: string;
      refundId: string | null;
      replacementOrderId: string | null;
      returnId: string;
      /** @enum {string} */
      settlementPolicy: 'refund_and_repurchase';
      status: components['schemas']['ExchangeStatus'];
      version: number;
    };
    /** @enum {string} */
    ExchangeStatus:
      | 'approved'
      | 'awaiting_return'
      | 'cancelled'
      | 'completed'
      | 'rejected'
      | 'replacement_processing'
      | 'requested'
      | 'return_received';
    FulfillmentShipment: {
      carrier: string | null;
      deliveredAt: string | null;
      fulfillmentStatus: components['schemas']['FulfillmentStatus'];
      id: string;
      items: {
        id: string;
        orderItemId: string;
        quantity: number;
      }[];
      orderId: string;
      shippedAt: string | null;
      trackingCode: string | null;
      version: number;
    };
    /** @enum {string} */
    FulfillmentStatus:
      | 'cancelled'
      | 'delivered'
      | 'delivery_failed'
      | 'in_transit'
      | 'lost'
      | 'out_for_delivery'
      | 'packed'
      | 'pending_pack'
      | 'ready_for_pickup'
      | 'returned';
    InventoryBalance: {
      available: number;
      barcode: string | null;
      color: string;
      id: string;
      imageIds: string[];
      isDefault: boolean;
      onHand: number;
      price: number;
      productId: string;
      reserved: number;
      size: string;
      sku: string;
      /** @enum {string} */
      status: 'active' | 'inactive';
      version: number;
    };
    /** @enum {string} */
    InventoryMovementKind:
      | 'adjust'
      | 'commit'
      | 'opening'
      | 'receipt'
      | 'release'
      | 'reserve'
      | 'return';
    JsonValue: JsonValue;
    LoginResponse: {
      refreshToken: string;
      token: string;
      user: components['schemas']['User'];
    };
    MerchandisingEntry: {
      active: boolean;
      endsAt: string | null;
      id: string;
      key: string;
      payload: components['schemas']['MerchandisingPayload'];
      startsAt: string | null;
      version: number;
    };
    MerchandisingPayload:
      | {
          /** @enum {string} */
          kind: 'collection';
          productIds: string[];
          title: string;
        }
      | {
          href: string;
          imageFileId: string;
          /** @enum {string} */
          kind: 'banner';
          /** @enum {string} */
          placement: 'home' | 'shop';
          title: string;
        }
      | {
          items: components['schemas']['NavigationItem'][];
          /** @enum {string} */
          kind: 'navigation';
        }
      | {
          /** @enum {string} */
          kind: 'home';
          sections: {
            entryId: string;
            id: string;
            /** @enum {string} */
            type: 'banner' | 'collection';
          }[];
        };
    NavigationItem: {
      children: components['schemas']['NavigationItem'][];
      href: string;
      id: string;
      label: string;
    };
    Notification: {
      body: string;
      createdAt: string;
      href: string;
      id: string;
      readAt: string | null;
      title: string;
      type: string;
    };
    NotificationPreferences: {
      marketingEmail: boolean;
      stockEmail: boolean;
      transactionalEmail: boolean;
      version: number;
    };
    Order: {
      coupon?: components['schemas']['OrderCouponInfo'] | null;
      createdAt: string;
      currency?: string;
      discountAmount: number;
      id: string;
      items: components['schemas']['OrderItem'][];
      /** @enum {string} */
      lifecycleStatus?:
        | 'cancelled'
        | 'completed'
        | 'confirmed'
        | 'pending_confirmation'
        | 'processing';
      payment?: components['schemas']['Payment'] | null;
      shipment?: components['schemas']['Shipment'] | null;
      shippingAddress?: components['schemas']['ShippingAddressInput'] | null;
      shippingFee: number;
      snapshot?: components['schemas']['CheckoutQuoteSnapshot'] | null;
      status: components['schemas']['OrderStatus'];
      subtotal: number;
      total: number;
      userEmail: string;
      userId: string;
      version?: number;
    };
    OrderCouponInfo: {
      code: string;
      couponId: string;
      discountAmount: number;
    };
    OrderItem: {
      cancelledQuantity?: number;
      color?: string;
      discountAmount?: number;
      fulfilledQuantity?: number;
      id?: string;
      imageUrl?: string;
      lineTotal?: number;
      productId: string;
      productName: string;
      quantity: number;
      returnedQuantity?: number;
      size?: string;
      sku?: string;
      unitPrice: number;
      variantId?: string | null;
    };
    /** @enum {string} */
    OrderLifecycleStatus:
      | 'cancelled'
      | 'completed'
      | 'confirmed'
      | 'pending_confirmation'
      | 'processing';
    OrderQuantityInput: {
      orderItemId: string;
      quantity: number;
    };
    /** @enum {string} */
    OrderStatus: 'cancelled' | 'completed' | 'paid' | 'pending' | 'shipping';
    PaginationMeta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    Payment: {
      amount: number;
      checkoutUrl?: string;
      externalId?: string | null;
      id: string;
      orderId: string;
      paidAt?: string | null;
      provider: components['schemas']['PaymentProvider'];
      status: components['schemas']['PaymentStatus'];
    };
    PaymentAttempt: {
      amount: number;
      checkoutUrl: string | null;
      currency: string;
      expiresAt: string;
      id: string;
      orderId: string;
      paidAt: string | null;
      provider: components['schemas']['PaymentProvider'];
      /** @enum {string} */
      reconciliation: 'duplicate_charge' | 'late_paid' | 'matched' | 'mismatch' | 'unreconciled';
      status: components['schemas']['PaymentAttemptStatus'];
      version: number;
    };
    /** @enum {string} */
    PaymentAttemptStatus: 'cancelled' | 'expired' | 'failed' | 'paid' | 'pending' | 'processing';
    /** @enum {string} */
    PaymentProvider: 'cod' | 'mock' | 'stripe';
    /** @enum {string} */
    PaymentStatus: 'failed' | 'paid' | 'pending';
    Product: {
      category?: components['schemas']['Category'] | null;
      categoryId?: string | null;
      description: string;
      id: string;
      imageId?: string | null;
      images?: components['schemas']['ProductImage'][];
      imageUrl: string;
      name: string;
      price: number;
      stock: number;
    };
    ProductImage: {
      fileId: string;
      id: string;
      sortOrder: number;
      url: string;
    };
    /** @enum {string} */
    ProductPublicationStatus: 'active' | 'archived' | 'draft' | 'inactive';
    ProductVariant: {
      available: number;
      barcode: string | null;
      color: string;
      id: string;
      imageIds: string[];
      isDefault: boolean;
      price: number;
      productId: string;
      size: string;
      sku: string;
      /** @enum {string} */
      status: 'active' | 'inactive';
      version: number;
    };
    Promotion: {
      categoryIds: string[];
      endsAt: string | null;
      id: string;
      isActive: boolean;
      maxDiscount: number | null;
      minOrderAmount: number;
      name: string;
      priority: number;
      startsAt: string | null;
      type: components['schemas']['CouponType'];
      value: number;
      variantIds: string[];
      version: number;
    };
    PublishedContent: {
      body: components['schemas']['ContentBlock'][];
      coverFileId: string | null;
      excerpt: string;
      id: string;
      kind: components['schemas']['ContentKind'];
      publishedAt: string;
      seoDescription: string;
      seoTitle: string;
      slug: string;
      taxonomyIds: string[];
      title: string;
      version: number;
    };
    QuoteItemSnapshot: {
      categoryId: string | null;
      color: string;
      discountAmount: number;
      imageUrl: string;
      lineTotal: number;
      productId: string;
      productName: string;
      quantity: number;
      size: string;
      sku: string;
      unitPrice: number;
      variantId: string;
    };
    Refund: {
      amount: number;
      createdAt: string;
      id: string;
      orderId: string;
      paymentId: string;
      reason?: string | null;
      status: components['schemas']['RefundStatus'];
    };
    /** @enum {string} */
    RefundAttemptStatus: 'cancelled' | 'failed' | 'processing' | 'requested' | 'succeeded';
    /** @enum {string} */
    RefundStatus: 'completed' | 'failed' | 'pending';
    ReportExport: {
      downloadUrl: string | null;
      expiresAt: string;
      id: string;
      report: components['schemas']['ReportKind'];
      /** @enum {string} */
      status: 'failed' | 'pending' | 'ready';
    };
    /** @enum {string} */
    ReportKind: 'inventory' | 'orders' | 'products' | 'sales';
    ReportQuery: {
      from: string;
      timezone: string;
      to: string;
    };
    ReturnInspection: {
      damagedQuantity: number;
      orderItemId: string;
      saleableQuantity: number;
    };
    ReturnRequest: {
      createdAt: string;
      evidenceIds: string[];
      id: string;
      inspection: components['schemas']['ReturnInspection'][] | null;
      items: components['schemas']['OrderQuantityInput'][];
      orderId: string;
      reason: string;
      resolution: string | null;
      status: components['schemas']['ReturnStatus'];
      version: number;
    };
    /** @enum {string} */
    ReturnStatus:
      | 'approved'
      | 'cancelled'
      | 'completed'
      | 'in_transit'
      | 'inspected'
      | 'received'
      | 'rejected'
      | 'requested';
    Review: {
      comment: string;
      createdAt: string;
      id: string;
      mediaIds?: string[];
      /** @enum {string} */
      moderationStatus?: 'hidden' | 'pending' | 'published';
      productId: string;
      rating: number;
      reply?: string | null;
      userEmail?: string;
      userId: string;
      verifiedPurchase?: boolean;
      version?: number;
    };
    /** @enum {string} */
    Role: 'admin' | 'user';
    Shipment: {
      carrier?: string | null;
      deliveredAt?: string | null;
      id: string;
      orderId: string;
      shippedAt?: string | null;
      status: components['schemas']['ShipmentStatus'];
      trackingCode?: string | null;
    };
    /** @enum {string} */
    ShipmentStatus: 'cancelled' | 'delivered' | 'pending' | 'shipped';
    ShippingAddressInput: {
      city: string;
      fullName: string;
      line1: string;
      phone: string;
    };
    ShippingMethod: {
      active: boolean;
      cities: string[];
      codEnabled: boolean;
      estimatedDays: number;
      fee: number;
      freeAbove: number | null;
      id: string;
      name: string;
      version: number;
    };
    ShippingQuote: {
      codEnabled: boolean;
      currency: string;
      estimatedDays: number;
      fee: number;
      methodId: string;
      methodName: string;
      methodVersion: number;
    };
    ShopSettings: {
      currency: string;
      defaultLocale: string;
      logoFileId: string | null;
      name: string;
      supportEmail: string;
      supportPhone: string;
      timezone: string;
      version: number;
    };
    SizeGuide: {
      id: string;
      measurements: components['schemas']['JsonValue'];
      name: string;
      version: number;
    };
    SupportMessage: {
      attachmentIds: string[];
      body: string;
      createdAt: string;
      id: string;
      internal: boolean;
    };
    SupportTicket: {
      assigneeId: string | null;
      category: string;
      createdAt: string;
      id: string;
      orderId: string | null;
      status: components['schemas']['SupportTicketStatus'];
      subject: string;
      version: number;
    };
    /** @enum {string} */
    SupportTicketStatus: 'closed' | 'in_progress' | 'open' | 'resolved';
    UpdatePasswordInput: {
      currentPassword?: string;
      newPassword: string;
    };
    UpdateProfileInput: {
      displayName?: string;
      imageStorageId?: string;
      phone?: string | null;
    };
    UploadTicket: {
      expiresAt: string;
      fileId: string | null;
      id: string;
      maxBytes: number;
      private: boolean;
      /** @enum {string} */
      purpose: 'avatar' | 'blog' | 'product' | 'return' | 'review' | 'support';
      resourceId: string | null;
      /** @enum {string} */
      status: 'completed' | 'pending' | 'rejected';
    };
    User: {
      /** @enum {string} */
      accountStatus?: 'active' | 'blocked' | 'closed';
      avatarId?: string | null;
      avatarUrl?: string;
      displayName?: string | null;
      email: string;
      emailVerified?: boolean;
      hasPassword?: boolean;
      id: string;
      locale?: string;
      phone?: string | null;
      role: components['schemas']['Role'];
      /** @enum {string|null} */
      staffRole?:
        | 'administrator'
        | 'catalog'
        | 'content'
        | 'fulfillment'
        | 'owner'
        | 'support'
        | null;
      timezone?: string;
      version?: number;
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
  get_api_addresses: {
    parameters: {
      query?: {
        city?: string;
        isDefault?: 'false' | 'true';
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'fullName' | 'city' | 'isDefault' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
      };
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
            data: components['schemas']['Address'][];
            message?: string;
            meta?: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_addresses: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          city: string;
          fullName: string;
          isDefault?: boolean;
          line1: string;
          phone: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Address'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  put_api_addresses_id: {
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
          city?: string;
          fullName?: string;
          isDefault?: boolean;
          line1?: string;
          phone?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Address'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  delete_api_addresses_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Address'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_addresses_id_default: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Address'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_audit_logs: {
    parameters: {
      query?: {
        action?: string;
        actorId?: string;
        createdFrom?: string;
        createdTo?: string;
        outcome?: 'failure' | 'success';
        page?: number;
        pageSize?: number;
        q?: string;
        requestId?: string;
        resourceId?: string;
        resourceType?: string;
        sortBy?: 'createdAt' | 'action' | 'resourceType';
        sortOrder?: 'asc' | 'desc';
      };
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
            data: {
              action: string;
              actorId: string | null;
              changes: components['schemas']['JsonValue'];
              createdAt: string;
              id: string;
              /** @enum {string} */
              outcome: 'failure' | 'success';
              reason: string | null;
              requestId: string | null;
              resourceId: string;
              resourceType: string;
            }[];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_audit_logs_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              action: string;
              actorId: string | null;
              changes: components['schemas']['JsonValue'];
              createdAt: string;
              id: string;
              /** @enum {string} */
              outcome: 'failure' | 'success';
              reason: string | null;
              requestId: string | null;
              resourceId: string;
              resourceType: string;
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_banners: {
    parameters: {
      query?: {
        active?: 'false' | 'true';
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'key' | 'active' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
      };
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
            data: components['schemas']['MerchandisingEntry'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_banners: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          active: boolean;
          href: string;
          imageFileId: string;
          key: string;
          /** @enum {string} */
          placement: 'home' | 'shop';
          title: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['MerchandisingEntry'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_banners_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['MerchandisingEntry'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_admin_banners_id: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          active: boolean;
          expectedVersion: number;
          href: string;
          imageFileId: string;
          key: string;
          /** @enum {string} */
          placement: 'home' | 'shop';
          title: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['MerchandisingEntry'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_collections: {
    parameters: {
      query?: {
        active?: 'false' | 'true';
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'key' | 'active' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
      };
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
            data: components['schemas']['MerchandisingEntry'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_collections: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          active: boolean;
          key: string;
          productIds: string[];
          title: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['MerchandisingEntry'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_collections_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['MerchandisingEntry'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_admin_collections_id: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          active: boolean;
          expectedVersion: number;
          key: string;
          productIds: string[];
          title: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['MerchandisingEntry'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_coupons_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Coupon'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_coupons_id_redemptions: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'createdAt' | 'amount';
        sortOrder?: 'asc' | 'desc';
      };
      header?: never;
      path: {
        id: string;
      };
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
            data: {
              amount: number;
              couponId: string;
              createdAt: string;
              id: string;
              orderId: string;
              ruleVersion: number;
              /** @enum {string} */
              status: 'committed' | 'released' | 'reserved';
              userId: string;
            }[];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_customers: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'email' | 'displayName' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
      };
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
            data: {
              accountStatus: components['schemas']['AccountStatus'];
              displayName: string | null;
              email: string;
              id: string;
              role: components['schemas']['Role'];
              /** @enum {string|null} */
              staffRole:
                | 'administrator'
                | 'catalog'
                | 'content'
                | 'fulfillment'
                | 'owner'
                | 'support'
                | null;
              version: number;
            }[];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_admin_customers_id_status: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          /** @enum {string} */
          accountStatus: 'active' | 'blocked';
          expectedVersion: number;
          reason: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              accountStatus: components['schemas']['AccountStatus'];
              id: string;
              /** @enum {string|null} */
              staffRole:
                | 'administrator'
                | 'catalog'
                | 'content'
                | 'fulfillment'
                | 'owner'
                | 'support'
                | null;
              version: number;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_exchanges: {
    parameters: {
      query?: {
        orderId?: string;
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'createdAt' | 'status';
        sortOrder?: 'asc' | 'desc';
        status?:
          | 'approved'
          | 'awaiting_return'
          | 'cancelled'
          | 'completed'
          | 'rejected'
          | 'replacement_processing'
          | 'requested'
          | 'return_received';
      };
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
            data: components['schemas']['ExchangeRequest'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_exports: {
    parameters: {
      query?: never;
      header: {
        /** @description Dùng lại đúng key khi retry cùng payload; khác payload sẽ trả 409. */
        'Idempotency-Key': string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody?: {
      content: {
        'application/json': {
          /** @enum {string} */
          format?: 'csv' | 'xlsx';
          /** @description Bộ lọc theo allowlist của từng resource; field lạ bị từ chối. */
          query?: {
            [key: string]: string | number | boolean | null;
          };
          /** @enum {string} */
          resource?:
            | 'categories'
            | 'inventory'
            | 'orders'
            | 'products'
            | 'sales-report'
            | 'variants';
        };
      };
    };
    responses: {
      /** @description Đã nhận; theo dõi qua process trả về. */
      202: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              createdAt: string;
              errorCode: string | null;
              expiresAt: string;
              failed: number;
              id: string;
              /** @enum {string} */
              kind: 'data.export' | 'data.import' | 'media.batch';
              /** @enum {string} */
              phase: 'apply' | 'generate' | 'validate' | 'verify';
              processed: number;
              progress: number;
              result: {
                downloadUrl: string | null;
                failed: number;
                resourceIds: string[];
                succeeded: number;
                total: number;
              } | null;
              /** @enum {string} */
              state:
                | 'awaiting_confirmation'
                | 'cancelled'
                | 'completed'
                | 'completed_with_errors'
                | 'failed'
                | 'queued'
                | 'running';
              succeeded: number;
              total: number;
              updatedAt: string;
              version: number;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_home_layout: {
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
            data: components['schemas']['MerchandisingEntry'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_admin_home_layout: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion?: number;
          sections: {
            entryId: string;
            id: string;
            /** @enum {string} */
            type: 'banner' | 'collection';
          }[];
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['MerchandisingEntry'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_import_templates_resource: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        resource: string;
      };
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
            data: {
              columns: string[];
              format: string;
              notes: string;
              /** @enum {string} */
              resource: 'categories' | 'inventory' | 'products' | 'variants';
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_imports_resource: {
    parameters: {
      query?: never;
      header: {
        /** @description Dùng lại đúng key khi retry cùng payload; khác payload sẽ trả 409. */
        'Idempotency-Key': string;
      };
      path: {
        resource: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'multipart/form-data': {
          /** Format: binary */
          file: string;
        };
      };
    };
    responses: {
      /** @description Đã nhận; theo dõi qua process trả về. */
      202: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              createdAt: string;
              errorCode: string | null;
              expiresAt: string;
              failed: number;
              id: string;
              /** @enum {string} */
              kind: 'data.export' | 'data.import' | 'media.batch';
              /** @enum {string} */
              phase: 'apply' | 'generate' | 'validate' | 'verify';
              processed: number;
              progress: number;
              result: {
                downloadUrl: string | null;
                failed: number;
                resourceIds: string[];
                succeeded: number;
                total: number;
              } | null;
              /** @enum {string} */
              state:
                | 'awaiting_confirmation'
                | 'cancelled'
                | 'completed'
                | 'completed_with_errors'
                | 'failed'
                | 'queued'
                | 'running';
              succeeded: number;
              total: number;
              updatedAt: string;
              version: number;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_inventory: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        productId?: string;
        q?: string;
        sortBy?: 'sku' | 'price' | 'onHand' | 'reserved' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
        status?: 'active' | 'inactive';
      };
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
            data: components['schemas']['InventoryBalance'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_inventory_adjustments: {
    parameters: {
      query?: never;
      header: {
        /** @description Dùng lại đúng key khi retry cùng payload; khác payload sẽ trả 409. */
        'Idempotency-Key': string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          quantity: number;
          reason: string;
          variantId: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              replayed: boolean;
              result: components['schemas']['JsonValue'];
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_inventory_movements: {
    parameters: {
      query?: {
        createdFrom?: string;
        createdTo?: string;
        kind?: 'adjust' | 'commit' | 'opening' | 'receipt' | 'release' | 'reserve' | 'return';
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'createdAt' | 'quantity';
        sortOrder?: 'asc' | 'desc';
        variantId?: string;
      };
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
            data: {
              actorId: string | null;
              createdAt: string;
              id: string;
              kind: components['schemas']['InventoryMovementKind'];
              onHandAfter: number;
              onHandDelta: number;
              quantity: number;
              reason: string;
              reference: string;
              reservedAfter: number;
              reservedDelta: number;
              variantId: string;
            }[];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_inventory_receipts: {
    parameters: {
      query?: never;
      header: {
        /** @description Dùng lại đúng key khi retry cùng payload; khác payload sẽ trả 409. */
        'Idempotency-Key': string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          quantity: number;
          reason: string;
          variantId: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              replayed: boolean;
              result: components['schemas']['JsonValue'];
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_inventory_reconciliation: {
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
            data: {
              consistent: boolean;
              discrepancies: {
                id: string;
              }[];
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_jobs: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'createdAt' | 'attempts';
        sortOrder?: 'asc' | 'desc';
        status?: 'dead_letter' | 'delivered' | 'pending' | 'processing';
      };
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
            data: {
              aggregateId: string;
              aggregateType: string;
              attempts: number;
              availableAt: string;
              createdAt: string;
              deliveredAt: string | null;
              id: string;
              lastErrorCode: string | null;
              leaseUntil: string | null;
              /** @enum {string} */
              status: 'dead_letter' | 'delivered' | 'pending' | 'processing';
              type: string;
            }[];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_jobs_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              aggregateId: string;
              aggregateType: string;
              attempts: {
                attempt: number;
                /** Format: date-time */
                created_at: string;
                error_code: string | null;
                id: string;
                status: string;
              }[];
              availableAt: string;
              createdAt: string;
              deliveredAt: string | null;
              id: string;
              lastErrorCode: string | null;
              leaseUntil: string | null;
              /** @enum {string} */
              status: 'dead_letter' | 'delivered' | 'pending' | 'processing';
              type: string;
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_jobs_id_retry: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              aggregateId: string;
              aggregateType: string;
              attempts: number;
              availableAt: string;
              createdAt: string;
              deliveredAt: string | null;
              id: string;
              lastErrorCode: string | null;
              leaseUntil: string | null;
              /** @enum {string} */
              status: 'dead_letter' | 'delivered' | 'pending' | 'processing';
              type: string;
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_navigation_placement: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        placement: string;
      };
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
            data: components['schemas']['MerchandisingEntry'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_admin_navigation_placement: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        placement: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion?: number;
          items: components['schemas']['NavigationItem'][];
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['MerchandisingEntry'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_notification_templates: {
    parameters: {
      query?: {
        locale?: 'en' | 'vi';
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'type' | 'locale' | 'updatedAt';
        sortOrder?: 'asc' | 'desc';
        type?: string;
      };
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
            data: {
              body: string;
              id: string;
              locale: string;
              subject: string;
              type: string;
              version: number;
            }[];
            message?: string;
            meta?: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  put_api_admin_notification_templates: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          body: string;
          expectedVersion?: number;
          /** @enum {string} */
          locale: 'en' | 'vi';
          subject: string;
          /** @enum {string} */
          type:
            | 'order.confirmed'
            | 'order.placed'
            | 'order.shipment_delivered'
            | 'refund.succeeded'
            | 'stock.available'
            | 'support.message';
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              body: string;
              id: string;
              locale: string;
              subject: string;
              type: string;
              version: number;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_operations_inventory_reconciliation: {
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
            data: {
              consistent: boolean;
              discrepancies: {
                id: string;
              }[];
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_pages: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'title' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
        status?: 'archived' | 'draft' | 'published' | 'scheduled';
        taxonomyId?: string;
      };
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
            data: components['schemas']['ContentEntry'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_pages: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          body: components['schemas']['ContentBlock'][];
          coverFileId?: string;
          excerpt?: string;
          seoDescription?: string;
          seoTitle?: string;
          slug: string;
          taxonomyIds?: string[];
          title: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ContentEntry'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_pages_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ContentEntry'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_admin_pages_id: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          body: components['schemas']['ContentBlock'][];
          coverFileId?: string;
          excerpt?: string;
          expectedVersion: number;
          seoDescription?: string;
          seoTitle?: string;
          slug: string;
          taxonomyIds?: string[];
          title: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ContentEntry'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_pages_id_archive: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ContentEntry'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_pages_id_publish: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          scheduledAt?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ContentEntry'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_pages_id_revisions: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'version' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
      };
      header?: never;
      path: {
        id: string;
      };
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
            data: {
              createdAt: string;
              id: string;
              snapshot: components['schemas']['ContentEntry'];
              version: number;
            }[];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_payments_id_cod_collection: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          amount: number;
          reference: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data:
              | {
                  accepted: boolean;
                  duplicate?: null;
                  late?: null;
                  reason: string;
                  replayed?: null;
                }
              | {
                  accepted: boolean;
                  duplicate?: null;
                  late?: null;
                  reason?: null;
                  replayed: boolean;
                }
              | {
                  accepted: boolean;
                  duplicate: boolean;
                  late: boolean;
                  reason?: null;
                  replayed?: null;
                };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_payments_id_reconcile: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data:
              | {
                  accepted: boolean;
                  duplicate?: null;
                  late?: null;
                  reason: string;
                  replayed?: null;
                }
              | {
                  accepted: boolean;
                  duplicate?: null;
                  late?: null;
                  reason?: null;
                  replayed: boolean;
                }
              | {
                  accepted: boolean;
                  duplicate: boolean;
                  late: boolean;
                  reason?: null;
                  replayed?: null;
                };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_post_categories: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          name: string;
          slug: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              id: string;
              name: string;
              slug: string;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_admin_post_categories_id: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          name: string;
          slug: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              id: string;
              name: string;
              slug: string;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_post_tags: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          name: string;
          slug: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              id: string;
              name: string;
              slug: string;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_admin_post_tags_id: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          name: string;
          slug: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              id: string;
              name: string;
              slug: string;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_posts: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'title' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
        status?: 'archived' | 'draft' | 'published' | 'scheduled';
        taxonomyId?: string;
      };
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
            data: components['schemas']['ContentEntry'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_posts: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          body: components['schemas']['ContentBlock'][];
          coverFileId?: string;
          excerpt?: string;
          seoDescription?: string;
          seoTitle?: string;
          slug: string;
          taxonomyIds?: string[];
          title: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ContentEntry'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_posts_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ContentEntry'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_admin_posts_id: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          body: components['schemas']['ContentBlock'][];
          coverFileId?: string;
          excerpt?: string;
          expectedVersion: number;
          seoDescription?: string;
          seoTitle?: string;
          slug: string;
          taxonomyIds?: string[];
          title: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ContentEntry'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_posts_id_archive: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ContentEntry'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_posts_id_publish: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          scheduledAt?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ContentEntry'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_posts_id_revisions: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'version' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
      };
      header?: never;
      path: {
        id: string;
      };
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
            data: {
              createdAt: string;
              id: string;
              snapshot: components['schemas']['ContentEntry'];
              version: number;
            }[];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_products: {
    parameters: {
      query?: {
        availability?: 'in_stock' | 'out_of_stock';
        categoryId?: string;
        color?: string;
        maxPrice?: number;
        maxStock?: number;
        minPrice?: number;
        minRating?: number;
        minStock?: number;
        page?: number;
        pageSize?: number;
        q?: string;
        size?: string;
        sortBy?: 'name' | 'price' | 'stock' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
      };
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
            data: components['schemas']['Product'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_products_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['CatalogProduct'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_products_id_variants: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ProductVariant'][];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_promotions: {
    parameters: {
      query?: {
        isActive?: 'false' | 'true';
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'name' | 'priority' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
      };
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
            data: components['schemas']['Promotion'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_promotions: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          isActive?: boolean;
          maxDiscount?: number;
          minOrderAmount?: number;
          name: string;
          priority?: number;
          /** @enum {string} */
          type: 'fixed' | 'percent';
          value: number;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Promotion'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_promotions_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Promotion'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_admin_promotions_id: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          isActive?: boolean;
          maxDiscount?: number;
          minOrderAmount?: number;
          name: string;
          priority?: number;
          /** @enum {string} */
          type: 'fixed' | 'percent';
          value: number;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Promotion'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_refunds_id_manual_confirmation: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          amount: number;
          expectedVersion: number;
          reference: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              amount: number;
              createdAt: string;
              id: string;
              orderId: string;
              processingStatus: components['schemas']['RefundAttemptStatus'];
              reason: string | null;
              returnId: string | null;
              status: components['schemas']['RefundStatus'];
              version: number;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_refunds_id_reconcile: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              amount: number;
              createdAt: string;
              id: string;
              orderId: string;
              processingStatus: components['schemas']['RefundAttemptStatus'];
              reason: string | null;
              returnId: string | null;
              status: components['schemas']['RefundStatus'];
              version: number;
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_refunds_id_retry: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              amount: number;
              createdAt: string;
              id: string;
              orderId: string;
              processingStatus: components['schemas']['RefundAttemptStatus'];
              reason: string | null;
              returnId: string | null;
              status: components['schemas']['RefundStatus'];
              version: number;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_report_exports: {
    parameters: {
      query?: never;
      header: {
        /** @description Dùng lại đúng key khi retry cùng payload; khác payload sẽ trả 409. */
        'Idempotency-Key': string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          /** @enum {string} */
          report: 'inventory' | 'orders' | 'products' | 'sales';
        };
      };
    };
    responses: {
      /** @description Đã nhận; theo dõi qua process trả về. */
      202: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ReportExport'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_report_exports_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ReportExport'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_report_exports_id_download: {
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
      /** @description File riêng tư, chỉ chủ sở hữu tải được. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/octet-stream': string;
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_reports_inventory: {
    parameters: {
      query: {
        /** @description Thời điểm bắt đầu theo UTC, ví dụ 2026-01-01T00:00:00Z. */
        from: string;
        /** @description Múi giờ IANA để nhóm dữ liệu. */
        timezone?: string;
        /** @description Thời điểm kết thúc theo UTC, sau `from` và cách tối đa 366 ngày. */
        to: string;
      };
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
            data: {
              definition: string;
              range: components['schemas']['ReportQuery'];
              rows: {
                [key: string]: (string | number) | null;
              }[];
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_reports_orders: {
    parameters: {
      query: {
        /** @description Thời điểm bắt đầu theo UTC, ví dụ 2026-01-01T00:00:00Z. */
        from: string;
        /** @description Múi giờ IANA để nhóm dữ liệu. */
        timezone?: string;
        /** @description Thời điểm kết thúc theo UTC, sau `from` và cách tối đa 366 ngày. */
        to: string;
      };
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
            data: {
              definition: string;
              range: components['schemas']['ReportQuery'];
              rows: {
                [key: string]: (string | number) | null;
              }[];
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_reports_products: {
    parameters: {
      query: {
        /** @description Thời điểm bắt đầu theo UTC, ví dụ 2026-01-01T00:00:00Z. */
        from: string;
        /** @description Múi giờ IANA để nhóm dữ liệu. */
        timezone?: string;
        /** @description Thời điểm kết thúc theo UTC, sau `from` và cách tối đa 366 ngày. */
        to: string;
      };
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
            data: {
              definition: string;
              range: components['schemas']['ReportQuery'];
              rows: {
                [key: string]: (string | number) | null;
              }[];
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_reports_sales: {
    parameters: {
      query: {
        /** @description Thời điểm bắt đầu theo UTC, ví dụ 2026-01-01T00:00:00Z. */
        from: string;
        /** @description Múi giờ IANA để nhóm dữ liệu. */
        timezone?: string;
        /** @description Thời điểm kết thúc theo UTC, sau `from` và cách tối đa 366 ngày. */
        to: string;
      };
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
            data: {
              definition: string;
              range: components['schemas']['ReportQuery'];
              rows: {
                [key: string]: (string | number) | null;
              }[];
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_returns: {
    parameters: {
      query?: {
        orderId?: string;
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'createdAt' | 'status';
        sortOrder?: 'asc' | 'desc';
        status?:
          | 'approved'
          | 'cancelled'
          | 'completed'
          | 'in_transit'
          | 'inspected'
          | 'received'
          | 'rejected'
          | 'requested';
      };
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
            data: components['schemas']['ReturnRequest'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_reviews: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        productId?: string;
        q?: string;
        rating?: number;
        sortBy?: 'rating' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
        status?: 'hidden' | 'pending' | 'published';
      };
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
            data: components['schemas']['Review'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_roles: {
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
            /** @description Map từ vai trò sang danh sách quyền. */
            data: {
              [key: string]: string[];
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_settings_commerce: {
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
            data: components['schemas']['CommerceSettings'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_admin_settings_commerce: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          quoteTtlSeconds: number;
          reservationTtlSeconds: number;
          returnWindowDays: number;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['CommerceSettings'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_settings_shop: {
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
            data: components['schemas']['ShopSettings'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_admin_settings_shop: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          /** @enum {string} */
          defaultLocale: 'en' | 'vi';
          expectedVersion: number;
          logoFileId?: string;
          name: string;
          supportEmail: string;
          supportPhone: string;
          timezone: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ShopSettings'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_shipping_methods: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'name' | 'fee' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
      };
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
            data: components['schemas']['ShippingMethod'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_shipping_methods: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          active: boolean;
          cities: string[];
          codEnabled: boolean;
          estimatedDays: number;
          fee: number;
          freeAbove?: number;
          name: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ShippingMethod'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_shipping_methods_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ShippingMethod'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_admin_shipping_methods_id: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          active: boolean;
          cities: string[];
          codEnabled: boolean;
          estimatedDays: number;
          expectedVersion: number;
          fee: number;
          freeAbove?: number;
          name: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ShippingMethod'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_size_guides: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'name' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
      };
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
            data: components['schemas']['SizeGuide'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_size_guides: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          measurements: ({
            size: string;
          } & {
            [key: string]: number;
          })[];
          name: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['SizeGuide'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_size_guides_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['SizeGuide'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_admin_size_guides_id: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          measurements: ({
            size: string;
          } & {
            [key: string]: number;
          })[];
          name: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['SizeGuide'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_staff: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'email' | 'displayName' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
      };
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
            data: {
              accountStatus: components['schemas']['AccountStatus'];
              displayName: string | null;
              email: string;
              id: string;
              role: components['schemas']['Role'];
              /** @enum {string|null} */
              staffRole:
                | 'administrator'
                | 'catalog'
                | 'content'
                | 'fulfillment'
                | 'owner'
                | 'support'
                | null;
              version: number;
            }[];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_admin_staff_id_role: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          reason: string;
          /** @enum {string} */
          staffRole: 'administrator' | 'catalog' | 'content' | 'fulfillment' | 'owner' | 'support';
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              accountStatus: components['schemas']['AccountStatus'];
              id: string;
              /** @enum {string|null} */
              staffRole:
                | 'administrator'
                | 'catalog'
                | 'content'
                | 'fulfillment'
                | 'owner'
                | 'support'
                | null;
              version: number;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_admin_staff_id_status: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          /** @enum {string} */
          accountStatus: 'active' | 'blocked';
          expectedVersion: number;
          reason: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              accountStatus: components['schemas']['AccountStatus'];
              id: string;
              /** @enum {string|null} */
              staffRole:
                | 'administrator'
                | 'catalog'
                | 'content'
                | 'fulfillment'
                | 'owner'
                | 'support'
                | null;
              version: number;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_staff_invitations: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          /** Format: email */
          email: string;
          /** @enum {string} */
          staffRole: 'administrator' | 'catalog' | 'content' | 'fulfillment' | 'owner' | 'support';
        };
      };
    };
    responses: {
      /** @description Đã nhận; theo dõi qua process trả về. */
      202: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              accepted: boolean;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_support_tickets: {
    parameters: {
      query?: {
        assigneeId?: string;
        category?: 'order' | 'other' | 'payment' | 'product' | 'return';
        orderId?: string;
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'createdAt' | 'subject' | 'status';
        sortOrder?: 'asc' | 'desc';
        status?: 'closed' | 'in_progress' | 'open' | 'resolved';
      };
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
            data: components['schemas']['SupportTicket'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_admin_support_tickets_id_assign: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          assigneeId: string;
          expectedVersion: number;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['SupportTicket'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_system_contracts: {
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
            data: {
              policy: {
                currency: string;
                idempotencyTtlHours: number;
                maxPageSize: number;
                moneyUnit: string;
                quoteTtlSeconds: number;
                reservationTtlSeconds: number;
                returnWindowDays: number;
                timezone: string;
              };
              /** @description Theo từng loại: map từ trạng thái hiện tại sang các trạng thái được chuyển tới. */
              transitions: {
                [key: string]: {
                  [key: string]: string[];
                };
              };
              version: string;
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_admin_variants: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        productId?: string;
        q?: string;
        sortBy?: 'sku' | 'price' | 'onHand' | 'reserved' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
        status?: 'active' | 'inactive';
      };
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
            data: components['schemas']['InventoryBalance'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
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
  post_api_auth_email_verification_requests: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          /** Format: email */
          email: string;
        };
      };
    };
    responses: {
      /** @description Đã nhận; theo dõi qua process trả về. */
      202: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              accepted: boolean;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_auth_email_verifications: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          token: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              verified: boolean;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
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
  post_api_auth_google: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          credential: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['LoginResponse'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
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
  post_api_auth_login: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          email: string;
          password: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['LoginResponse'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_auth_logout: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: {
      content: {
        'application/json': {
          refreshToken?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              ok: boolean;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_auth_me: {
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
            data: {
              user: components['schemas']['User'];
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_auth_me: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UpdateProfileInput'];
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              user: components['schemas']['User'];
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
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
  patch_api_auth_password: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UpdatePasswordInput'];
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              changed: boolean;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_auth_password_reset_requests: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          /** Format: email */
          email: string;
        };
      };
    };
    responses: {
      /** @description Đã nhận; theo dõi qua process trả về. */
      202: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              accepted: boolean;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_auth_password_resets: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          password: string;
          token: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              changed: boolean;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_auth_refresh: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          refreshToken: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['LoginResponse'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
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
  post_api_auth_register: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          displayName: string;
          /** Format: email */
          email: string;
          password: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              accepted: boolean;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
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
  get_api_cancellation_requests_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['CancellationRequest'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_cancellation_requests_id_approve: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          reason?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['CancellationRequest'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_cancellation_requests_id_reject: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          reason?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['CancellationRequest'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_cart: {
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
            data: components['schemas']['Cart'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_cart_items: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          quantity: number;
          /** Format: uuid */
          variantId: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Cart'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  delete_api_cart_items: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Cart'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  delete_api_cart_items_id: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Cart'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_cart_items_id: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          quantity: number;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Cart'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_cart_merge: {
    parameters: {
      query?: never;
      header: {
        /** @description Dùng lại đúng key khi retry cùng payload; khác payload sẽ trả 409. */
        'Idempotency-Key': string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody?: {
      content: {
        'application/json': {
          items?: components['schemas']['CartLineInput'][];
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              replayed: boolean;
              result: components['schemas']['JsonValue'];
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_categories: {
    parameters: {
      query?: {
        description?: 'all' | 'has' | 'none';
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'name' | 'slug' | 'description';
        sortOrder?: 'asc' | 'desc';
      };
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
            data: components['schemas']['Category'][];
            message?: string;
            meta?: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_categories: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['CategoryInput'] & {
          description?: string;
          name: string;
          slug: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Category'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_categories_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Category'];
            message?: string;
          };
        };
      };
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  put_api_categories_id: {
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
          description?: string;
          name?: string;
          slug?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Category'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  delete_api_categories_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Category'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_checkout_quotes: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: {
      content: {
        'application/json': {
          addressId?: string;
          couponCode?: string;
          items?: components['schemas']['CartLineInput'][];
          shippingMethodId?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['CheckoutQuote'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_checkout_quotes_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['CheckoutQuote'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_collections: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'key' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
      };
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
            data: (
              | {
                  href?: null;
                  id: string;
                  imageUrl?: null;
                  items?: null;
                  placement?: null;
                  products: components['schemas']['CatalogProduct'][];
                  sections?: null;
                  slug: string;
                  title: string;
                }
              | {
                  href: string;
                  id: string;
                  imageUrl: string;
                  items?: null;
                  /** @enum {string} */
                  placement: 'home' | 'shop';
                  products?: null;
                  sections?: null;
                  slug?: null;
                  title: string;
                }
              | {
                  href?: null;
                  id?: null;
                  imageUrl?: null;
                  items: components['schemas']['NavigationItem'][];
                  placement: string;
                  products?: null;
                  sections?: null;
                  slug?: null;
                  title?: null;
                }
              | {
                  href?: null;
                  id?: null;
                  imageUrl?: null;
                  items?: null;
                  placement?: null;
                  products?: null;
                  sections: {
                    entryId: string;
                    id: string;
                    /** @enum {string} */
                    type: 'banner' | 'collection';
                  }[];
                  slug?: null;
                  title?: null;
                }
            )[];
            message?: string;
            meta?: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_collections_slug: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        slug: string;
      };
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
            data:
              | {
                  href?: null;
                  id: string;
                  imageUrl?: null;
                  items?: null;
                  placement?: null;
                  products: components['schemas']['CatalogProduct'][];
                  sections?: null;
                  slug: string;
                  title: string;
                }
              | {
                  href: string;
                  id: string;
                  imageUrl: string;
                  items?: null;
                  /** @enum {string} */
                  placement: 'home' | 'shop';
                  products?: null;
                  sections?: null;
                  slug?: null;
                  title: string;
                }
              | {
                  href?: null;
                  id?: null;
                  imageUrl?: null;
                  items: components['schemas']['NavigationItem'][];
                  placement: string;
                  products?: null;
                  sections?: null;
                  slug?: null;
                  title?: null;
                }
              | {
                  href?: null;
                  id?: null;
                  imageUrl?: null;
                  items?: null;
                  placement?: null;
                  products?: null;
                  sections: {
                    entryId: string;
                    id: string;
                    /** @enum {string} */
                    type: 'banner' | 'collection';
                  }[];
                  slug?: null;
                  title?: null;
                };
            message?: string;
          };
        };
      };
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_coupons: {
    parameters: {
      query?: {
        isActive?: 'false' | 'true';
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'code' | 'type' | 'value' | 'usedCount' | 'startsAt' | 'endsAt' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
        type?: 'fixed' | 'percent';
      };
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
            data: components['schemas']['Coupon'][];
            message?: string;
            meta?: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_coupons: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          code: string;
          expectedVersion?: number;
          isActive?: boolean;
          maxDiscount?: number;
          minOrderAmount?: number;
          perUserLimit?: number;
          type: string;
          usageLimit?: number;
          value: number;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Coupon'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  put_api_coupons_id: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          code: string;
          expectedVersion?: number;
          isActive?: boolean;
          maxDiscount?: number;
          minOrderAmount?: number;
          perUserLimit?: number;
          /** @enum {string} */
          type: 'fixed' | 'percent';
          usageLimit?: number;
          value: number;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Coupon'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  delete_api_coupons_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Coupon'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_coupons_preview: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          code: string;
          items: unknown[];
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              allocations: number[];
              code: string | null;
              couponId: string | null;
              discountAmount: number;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_dashboard_stats: {
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
            data: components['schemas']['DashboardStats'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_exchanges_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ExchangeRequest'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_exchanges_id_approve: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ExchangeRequest'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_exchanges_id_create_replacement: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ExchangeRequest'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_exchanges_id_reject: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          reason: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ExchangeRequest'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_exchanges_mine: {
    parameters: {
      query?: {
        orderId?: string;
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'createdAt' | 'status';
        sortOrder?: 'asc' | 'desc';
        status?:
          | 'approved'
          | 'awaiting_return'
          | 'cancelled'
          | 'completed'
          | 'rejected'
          | 'replacement_processing'
          | 'requested'
          | 'return_received';
      };
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
            data: components['schemas']['ExchangeRequest'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  delete_api_files_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              id: string;
              ok: boolean;
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_files_id_download: {
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
      /** @description File riêng tư, chỉ chủ sở hữu tải được. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/octet-stream': string;
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_files_sign_upload_url: {
    parameters: {
      query?: {
        name?: string;
      };
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
            data: {
              allowedMimeTypes: string[];
              expiresAt: string;
              fileId: string | null;
              id: string;
              maxBytes: number;
              private: boolean;
              publicId: string;
              /** @enum {string} */
              purpose: 'avatar' | 'blog' | 'product' | 'return' | 'review' | 'support';
              resourceId: string | null;
              /** @enum {string} */
              status: 'completed' | 'pending' | 'rejected';
              uploadUrl: string;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_files_sign_upload_urls: {
    parameters: {
      query?: {
        names?: string;
      };
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
            data: {
              allowedMimeTypes: string[];
              expiresAt: string;
              fileId: string | null;
              id: string;
              maxBytes: number;
              private: boolean;
              publicId: string;
              /** @enum {string} */
              purpose: 'avatar' | 'blog' | 'product' | 'return' | 'review' | 'support';
              resourceId: string | null;
              /** @enum {string} */
              status: 'completed' | 'pending' | 'rejected';
              uploadUrl: string;
            }[];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_files_uploads: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          /** @enum {string} */
          purpose: 'avatar' | 'blog' | 'product' | 'return' | 'review' | 'support';
          resourceId?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              allowedMimeTypes: string[];
              expiresAt: string;
              fileId: string | null;
              id: string;
              maxBytes: number;
              private: boolean;
              publicId: string;
              /** @enum {string} */
              purpose: 'avatar' | 'blog' | 'product' | 'return' | 'review' | 'support';
              resourceId: string | null;
              /** @enum {string} */
              status: 'completed' | 'pending' | 'rejected';
              uploadUrl: string;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_files_uploads_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['UploadTicket'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_files_uploads_id_complete: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['UploadTicket'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_files_uploads_batch: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          names: string[];
          /** @enum {string} */
          purpose: 'avatar' | 'blog' | 'product' | 'return' | 'review' | 'support';
          resourceId?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              batchId: string;
              tickets: {
                allowedMimeTypes: string[];
                expiresAt: string;
                fileId: string | null;
                id: string;
                maxBytes: number;
                name: string;
                private: boolean;
                publicId: string;
                /** @enum {string} */
                purpose: 'avatar' | 'blog' | 'product' | 'return' | 'review' | 'support';
                resourceId: string | null;
                /** @enum {string} */
                status: 'completed' | 'pending' | 'rejected';
                uploadUrl: string;
              }[];
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_files_uploads_batch_complete: {
    parameters: {
      query?: never;
      header: {
        /** @description Dùng lại đúng key khi retry cùng payload; khác payload sẽ trả 409. */
        'Idempotency-Key': string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          ticketIds: string[];
        };
      };
    };
    responses: {
      /** @description Đã nhận; theo dõi qua process trả về. */
      202: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              createdAt: string;
              errorCode: string | null;
              expiresAt: string;
              failed: number;
              id: string;
              /** @enum {string} */
              kind: 'data.export' | 'data.import' | 'media.batch';
              /** @enum {string} */
              phase: 'apply' | 'generate' | 'validate' | 'verify';
              processed: number;
              progress: number;
              result: {
                downloadUrl: string | null;
                failed: number;
                resourceIds: string[];
                succeeded: number;
                total: number;
              } | null;
              /** @enum {string} */
              state:
                | 'awaiting_confirmation'
                | 'cancelled'
                | 'completed'
                | 'completed_with_errors'
                | 'failed'
                | 'queued'
                | 'running';
              succeeded: number;
              total: number;
              updatedAt: string;
              version: number;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_internal_metrics: {
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
            data: {
              outbox: {
                deadLetter: number;
                overdue: number;
                pending: number;
              };
              workerLastSeenAt: string | null;
            };
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
            data: {
              contractVersion: string;
              rules: components['schemas']['AbilityRule'][];
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_me_email_change_requests: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          currentPassword: string;
          /** Format: email */
          email: string;
        };
      };
    };
    responses: {
      /** @description Đã nhận; theo dõi qua process trả về. */
      202: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              accepted: boolean;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_me_email_changes_confirm: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          token: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              changed: boolean;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_me_notification_preferences: {
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
            data: components['schemas']['NotificationPreferences'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_me_notification_preferences: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          marketingEmail: boolean;
          stockEmail: boolean;
          transactionalEmail: boolean;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['NotificationPreferences'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_me_preferences: {
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
            data: {
              locale: string;
              timezone: string;
              version: number;
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_me_preferences: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          /** @enum {string} */
          locale: 'en' | 'vi';
          timezone: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              locale: string;
              timezone: string;
              version: number;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_me_profile: {
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
            data: components['schemas']['User'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_me_profile: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          displayName?: string;
          expectedVersion: number;
          imageStorageId?: string;
          phone?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['User'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_me_sessions: {
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
            data: {
              createdAt: string;
              expiresAt: string;
              id: string;
              revokedAt: null;
            }[];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  delete_api_me_sessions_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              revoked: boolean;
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_me_sessions_revoke_others: {
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
            data: {
              revoked: boolean;
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_navigation_placement: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        placement: string;
      };
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
            data: {
              items: components['schemas']['NavigationItem'][];
              placement: string;
            };
            message?: string;
          };
        };
      };
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_notifications: {
    parameters: {
      query?: {
        createdFrom?: string;
        createdTo?: string;
        page?: number;
        pageSize?: number;
        q?: string;
        readStatus?: 'all' | 'read' | 'unread';
        sortBy?: 'createdAt' | 'title' | 'type';
        sortOrder?: 'asc' | 'desc';
        type?: string;
      };
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
            data: components['schemas']['Notification'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_notifications_id_read: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              read: boolean;
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_notifications_read_all: {
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
            data: {
              read: boolean;
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_notifications_unread_count: {
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
            data: {
              count: number;
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_order_items_id_reviews: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          comment: string;
          mediaIds?: string[];
          rating: number;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Review'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_orders: {
    parameters: {
      query?: {
        createdFrom?: string;
        createdTo?: string;
        maxTotal?: number;
        minTotal?: number;
        page?: number;
        pageSize?: number;
        paymentStatus?: 'failed' | 'paid' | 'pending';
        q?: string;
        shipmentStatus?: 'cancelled' | 'delivered' | 'pending' | 'shipped';
        sortBy?: 'id' | 'userEmail' | 'status' | 'total' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
        status?: 'cancelled' | 'completed' | 'paid' | 'pending' | 'shipping';
      };
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
            data: components['schemas']['Order'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_orders: {
    parameters: {
      query?: never;
      header: {
        /** @description Dùng lại đúng key khi retry cùng payload; khác payload sẽ trả 409. */
        'Idempotency-Key': string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody?: {
      content: {
        'application/json': {
          addressId?: string;
          couponCode?: string;
          items?: {
            productId: string;
            quantity: number;
          }[];
          quoteId?: string;
          shippingAddress?: components['schemas']['ShippingAddressInput'];
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Order'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_orders_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Order'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_orders_id_cancel: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Order'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_orders_id_cancellation_requests: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          items?: components['schemas']['OrderQuantityInput'][];
          reason: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['CancellationRequest'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_orders_id_confirm: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              id: string;
              lifecycleStatus: components['schemas']['OrderLifecycleStatus'];
              version: number;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_orders_id_events: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'createdAt';
        sortOrder?: 'asc' | 'desc';
      };
      header?: never;
      path: {
        id: string;
      };
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
            data: {
              createdAt: string;
              detail: components['schemas']['JsonValue'];
              id: string;
              type: string;
            }[];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_orders_id_exchanges: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          items: {
            /** Format: uuid */
            orderItemId: string;
            quantity: number;
            /** Format: uuid */
            variantId: string;
          }[];
          reason: string;
          returnId: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ExchangeRequest'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_orders_id_payment_attempts: {
    parameters: {
      query?: never;
      header: {
        /** @description Dùng lại đúng key khi retry cùng payload; khác payload sẽ trả 409. */
        'Idempotency-Key': string;
      };
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          /** @enum {string} */
          provider: 'cod' | 'mock' | 'stripe';
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              amount: number;
              checkoutUrl: string | null;
              currency: string;
              expiresAt: string;
              id: string;
              orderId: string;
              paidAt: string | null;
              provider: components['schemas']['PaymentProvider'];
              /** @enum {string} */
              reconciliation:
                | 'duplicate_charge'
                | 'late_paid'
                | 'matched'
                | 'mismatch'
                | 'unreconciled';
              replayed: boolean;
              status: components['schemas']['PaymentAttemptStatus'];
              version: number;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_orders_id_payments: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['PaymentAttempt'][];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_orders_id_refunds: {
    parameters: {
      query?: never;
      header: {
        /** @description Dùng lại đúng key khi retry cùng payload; khác payload sẽ trả 409. */
        'Idempotency-Key': string;
      };
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          amount?: number;
          reason: string;
          returnId?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              amount: number;
              createdAt: string;
              id: string;
              orderId: string;
              processingStatus: components['schemas']['RefundAttemptStatus'];
              reason: string | null;
              replayed: boolean;
              returnId: string | null;
              status: components['schemas']['RefundStatus'];
              version: number;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_orders_id_returns: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          evidenceIds?: string[];
          expectedVersion: number;
          items?: components['schemas']['OrderQuantityInput'][];
          reason: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ReturnRequest'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_orders_id_shipments: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['FulfillmentShipment'][];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_orders_id_shipments: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          carrier: string;
          expectedVersion: number;
          items?: components['schemas']['OrderQuantityInput'][];
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['FulfillmentShipment'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_orders_id_start_processing: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              id: string;
              lifecycleStatus: components['schemas']['OrderLifecycleStatus'];
              version: number;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_orders_mine: {
    parameters: {
      query?: {
        createdFrom?: string;
        createdTo?: string;
        maxTotal?: number;
        minTotal?: number;
        page?: number;
        pageSize?: number;
        paymentStatus?: 'failed' | 'paid' | 'pending';
        q?: string;
        shipmentStatus?: 'cancelled' | 'delivered' | 'pending' | 'shipped';
        sortBy?: 'id' | 'userEmail' | 'status' | 'total' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
        status?: 'cancelled' | 'completed' | 'paid' | 'pending' | 'shipping';
      };
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
            data: components['schemas']['Order'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_pages_slug: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        slug: string;
      };
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
            data: {
              body: components['schemas']['ContentBlock'][];
              coverFileId: string | null;
              excerpt: string;
              id: string;
              kind: components['schemas']['ContentKind'];
              publishedAt: string;
              redirect: string | null;
              seoDescription: string;
              seoTitle: string;
              slug: string;
              taxonomyIds: string[];
              title: string;
              version: number;
            };
            message?: string;
          };
        };
      };
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_payments_id_mock_pay: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data:
              | {
                  accepted: boolean;
                  duplicate?: null;
                  late?: null;
                  reason: string;
                  replayed?: null;
                }
              | {
                  accepted: boolean;
                  duplicate?: null;
                  late?: null;
                  reason?: null;
                  replayed: boolean;
                }
              | {
                  accepted: boolean;
                  duplicate: boolean;
                  late: boolean;
                  reason?: null;
                  replayed?: null;
                };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_payments_webhook_stripe: {
    parameters: {
      query?: never;
      header: {
        'Stripe-Signature': string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': Record<string, never>;
      };
    };
    responses: {
      /** @description Đã nhận event (event trùng được bỏ qua). */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      400: components['responses']['ValidationError'];
    };
  };
  get_api_policies_current: {
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
            data: (components['schemas']['PublishedContent'] | null)[];
            message?: string;
          };
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  get_api_post_categories: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'name' | 'slug' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
      };
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
            data: {
              id: string;
              name: string;
              slug: string;
            }[];
            message?: string;
            meta?: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_post_tags: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'name' | 'slug' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
      };
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
            data: {
              id: string;
              name: string;
              slug: string;
            }[];
            message?: string;
            meta?: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_posts: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'title' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
        taxonomyId?: string;
      };
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
            data: (components['schemas']['PublishedContent'] | null)[];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_posts_slug: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        slug: string;
      };
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
            data: {
              body: components['schemas']['ContentBlock'][];
              coverFileId: string | null;
              excerpt: string;
              id: string;
              kind: components['schemas']['ContentKind'];
              publishedAt: string;
              redirect: string | null;
              seoDescription: string;
              seoTitle: string;
              slug: string;
              taxonomyIds: string[];
              title: string;
              version: number;
            };
            message?: string;
          };
        };
      };
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_processes: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'createdAt';
        sortOrder?: 'asc' | 'desc';
      };
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
            data: {
              createdAt: string;
              errorCode: string | null;
              expiresAt: string;
              failed: number;
              id: string;
              /** @enum {string} */
              kind: 'data.export' | 'data.import' | 'media.batch';
              /** @enum {string} */
              phase: 'apply' | 'generate' | 'validate' | 'verify';
              processed: number;
              progress: number;
              result: {
                downloadUrl: string | null;
                failed: number;
                resourceIds: string[];
                succeeded: number;
                total: number;
              } | null;
              /** @enum {string} */
              state:
                | 'awaiting_confirmation'
                | 'cancelled'
                | 'completed'
                | 'completed_with_errors'
                | 'failed'
                | 'queued'
                | 'running';
              succeeded: number;
              total: number;
              updatedAt: string;
              version: number;
            }[];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_processes_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              createdAt: string;
              errorCode: string | null;
              expiresAt: string;
              failed: number;
              id: string;
              /** @enum {string} */
              kind: 'data.export' | 'data.import' | 'media.batch';
              /** @enum {string} */
              phase: 'apply' | 'generate' | 'validate' | 'verify';
              processed: number;
              progress: number;
              result: {
                downloadUrl: string | null;
                failed: number;
                resourceIds: string[];
                succeeded: number;
                total: number;
              } | null;
              /** @enum {string} */
              state:
                | 'awaiting_confirmation'
                | 'cancelled'
                | 'completed'
                | 'completed_with_errors'
                | 'failed'
                | 'queued'
                | 'running';
              succeeded: number;
              total: number;
              updatedAt: string;
              version: number;
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_processes_id_cancel: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              createdAt: string;
              errorCode: string | null;
              expiresAt: string;
              failed: number;
              id: string;
              /** @enum {string} */
              kind: 'data.export' | 'data.import' | 'media.batch';
              /** @enum {string} */
              phase: 'apply' | 'generate' | 'validate' | 'verify';
              processed: number;
              progress: number;
              result: {
                downloadUrl: string | null;
                failed: number;
                resourceIds: string[];
                succeeded: number;
                total: number;
              } | null;
              /** @enum {string} */
              state:
                | 'awaiting_confirmation'
                | 'cancelled'
                | 'completed'
                | 'completed_with_errors'
                | 'failed'
                | 'queued'
                | 'running';
              succeeded: number;
              total: number;
              updatedAt: string;
              version: number;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_processes_id_confirm: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
        };
      };
    };
    responses: {
      /** @description Đã nhận; theo dõi qua process trả về. */
      202: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              createdAt: string;
              errorCode: string | null;
              expiresAt: string;
              failed: number;
              id: string;
              /** @enum {string} */
              kind: 'data.export' | 'data.import' | 'media.batch';
              /** @enum {string} */
              phase: 'apply' | 'generate' | 'validate' | 'verify';
              processed: number;
              progress: number;
              result: {
                downloadUrl: string | null;
                failed: number;
                resourceIds: string[];
                succeeded: number;
                total: number;
              } | null;
              /** @enum {string} */
              state:
                | 'awaiting_confirmation'
                | 'cancelled'
                | 'completed'
                | 'completed_with_errors'
                | 'failed'
                | 'queued'
                | 'running';
              succeeded: number;
              total: number;
              updatedAt: string;
              version: number;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_processes_id_download: {
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
      /** @description File riêng tư, chỉ chủ sở hữu tải được. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/octet-stream': string;
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_processes_id_items: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'index' | 'state' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
      };
      header?: never;
      path: {
        id: string;
      };
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
            data: {
              data: components['schemas']['JsonValue'];
              index: number;
              issues: {
                code: string;
                field?: string;
                fileName?: string;
                item: number;
                message: string;
              }[];
              result: components['schemas']['JsonValue'];
              /** @enum {string} */
              state: 'applied' | 'failed' | 'invalid' | 'valid';
            }[];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_products: {
    parameters: {
      query?: {
        availability?: 'in_stock' | 'out_of_stock';
        categoryId?: string;
        color?: string;
        maxPrice?: number;
        maxStock?: number;
        minPrice?: number;
        minRating?: number;
        minStock?: number;
        page?: number;
        pageSize?: number;
        q?: string;
        size?: string;
        sortBy?: 'name' | 'price' | 'stock' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
      };
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
            data: components['schemas']['Product'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_products: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          brand?: string;
          careInstructions?: string;
          categoryId?: string;
          description?: string;
          expectedVersion?: number;
          imageStorageId?: string;
          imageStorageIds?: string[];
          material?: string;
          name: string;
          price: number;
          seoDescription?: string;
          seoTitle?: string;
          sizeGuideId?: string;
          slug?: string;
          stock: number;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Product'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_products_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Product'];
            message?: string;
          };
        };
      };
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  put_api_products_id: {
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
          brand?: string;
          careInstructions?: string;
          categoryId?: string;
          description?: string;
          expectedVersion?: number;
          imageStorageId?: string;
          imageStorageIds?: string[];
          material?: string;
          name?: string;
          price?: number;
          seoDescription?: string;
          seoTitle?: string;
          sizeGuideId?: string;
          slug?: string;
          stock?: number;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Product'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  delete_api_products_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Product'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_products_id_images: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          imageStorageId: string;
          sortOrder?: number;
        } & {
          imageStorageId: string;
          sortOrder?: number;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ProductImage'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  delete_api_products_id_images_imageId: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
        imageId: string;
      };
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
            data: {
              ok: boolean;
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_products_id_publication: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          /** @enum {string} */
          status: 'active' | 'archived' | 'draft' | 'inactive';
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['CatalogProduct'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_products_id_review_summary: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              average: number;
              count: number;
              distribution: {
                count: number;
                rating: number;
              }[];
            };
            message?: string;
          };
        };
      };
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_products_id_reviews: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        q?: string;
        rating?: number;
        sortBy?: 'rating' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
      };
      header?: never;
      path: {
        id: string;
      };
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
            data: components['schemas']['Review'][];
            message?: string;
            meta?: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_products_id_reviews: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          comment: string;
          mediaIds?: string[];
          orderItemId?: string;
          rating: number;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Review'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  delete_api_products_id_reviews_reviewId: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
        reviewId: string;
      };
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
            data: {
              ok: boolean;
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_products_id_variants: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ProductVariant'][];
            message?: string;
          };
        };
      };
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_products_id_variants: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          barcode?: string;
          color: string;
          isDefault?: boolean;
          price: number;
          size: string;
          sku: string;
          /** @enum {string} */
          status?: 'active' | 'inactive';
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ProductVariant'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_products_id_variants_variantId: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
        variantId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          barcode?: string;
          color?: string;
          expectedVersion: number;
          isDefault?: boolean;
          price?: number;
          size?: string;
          sku?: string;
          /** @enum {string} */
          status?: 'active' | 'inactive';
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ProductVariant'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_products_id_variants_variantId_images: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
        variantId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          imageIds: string[];
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ProductVariant'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_products_by_slug_slug: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        slug: string;
      };
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
            data:
              | {
                  product: components['schemas']['CatalogProduct'];
                  redirect: null;
                }
              | {
                  product: components['schemas']['CatalogProduct'];
                  redirect: string;
                };
            message?: string;
          };
        };
      };
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_products_facets: {
    parameters: {
      query?: {
        availability?: 'in_stock' | 'out_of_stock';
        categoryId?: string;
        color?: string;
        maxPrice?: number;
        maxStock?: number;
        minPrice?: number;
        minRating?: number;
        minStock?: number;
        page?: number;
        pageSize?: number;
        q?: string;
        size?: string;
        sortBy?: 'name' | 'price' | 'stock' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
      };
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
            data: {
              categories: {
                count: number;
                id: string;
                name: string;
              }[];
              colors: {
                count: number;
                value: string;
              }[];
              range: unknown | null;
              sizes: {
                count: number;
                value: string;
              }[];
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_refunds: {
    parameters: {
      query?: {
        createdFrom?: string;
        createdTo?: string;
        maxAmount?: number;
        minAmount?: number;
        orderId?: string;
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'amount' | 'status' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
        status?: 'completed' | 'failed' | 'pending';
      };
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
            data: components['schemas']['Refund'][];
            message?: string;
            meta?: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_refunds_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              amount: number;
              createdAt: string;
              id: string;
              orderId: string;
              processingStatus: components['schemas']['RefundAttemptStatus'];
              reason: string | null;
              returnId: string | null;
              status: components['schemas']['RefundStatus'];
              version: number;
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_returns_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ReturnRequest'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_returns_id_approve: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          reason?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ReturnRequest'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_returns_id_complete: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          reason?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ReturnRequest'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_returns_id_in_transit: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          reason?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ReturnRequest'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_returns_id_inspect: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          inspection: components['schemas']['ReturnInspection'][];
          reason?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ReturnRequest'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_returns_id_receive: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          reason?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ReturnRequest'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_returns_id_reject: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          reason?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ReturnRequest'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_returns_mine: {
    parameters: {
      query?: {
        orderId?: string;
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'createdAt' | 'status';
        sortOrder?: 'asc' | 'desc';
        status?:
          | 'approved'
          | 'cancelled'
          | 'completed'
          | 'in_transit'
          | 'inspected'
          | 'received'
          | 'rejected'
          | 'requested';
      };
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
            data: components['schemas']['ReturnRequest'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  patch_api_reviews_id: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          comment: string;
          expectedVersion: number;
          rating: number;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Review'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_reviews_id_moderation: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          reason: string;
          /** @enum {string} */
          status: 'hidden' | 'published';
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Review'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  put_api_reviews_id_reply: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          reply: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['Review'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_reviews_id_reports: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          reason: string;
        };
      };
    };
    responses: {
      /** @description Đã nhận; theo dõi qua process trả về. */
      202: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              accepted: boolean;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_search_suggestions: {
    parameters: {
      query: {
        q: string;
      };
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
            data: {
              categories: {
                id: string;
                name: string;
                slug: string;
              }[];
              products: {
                id: string;
                name: string;
                price: number;
                slug: string;
              }[];
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_shipments_id_cancel: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          reference: string;
          trackingCode?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['FulfillmentShipment'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_shipments_id_deliver: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          reference: string;
          trackingCode?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['FulfillmentShipment'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_shipments_id_events: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              id: string;
              occurredAt: string;
              type: components['schemas']['FulfillmentStatus'];
            }[];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_shipments_id_fail: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          reference: string;
          trackingCode?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['FulfillmentShipment'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_shipments_id_handover: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          reference: string;
          trackingCode?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['FulfillmentShipment'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_shipments_id_lose: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          reference: string;
          trackingCode?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['FulfillmentShipment'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_shipments_id_out_for_delivery: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          reference: string;
          trackingCode?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['FulfillmentShipment'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_shipments_id_pack: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          reference: string;
          trackingCode?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['FulfillmentShipment'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_shipments_id_ready: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          reference: string;
          trackingCode?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['FulfillmentShipment'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_shipments_id_return: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          reference: string;
          trackingCode?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['FulfillmentShipment'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_shipping_quotes: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          city: string;
          items?: components['schemas']['CartLineInput'][];
          shippingMethodId?: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['ShippingQuote'][];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_shop_config: {
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
            data: components['schemas']['ShopSettings'];
            message?: string;
          };
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  post_api_staff_invitations_accept: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          token: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              accepted: boolean;
              loginRequired: boolean;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_stock_alert_subscriptions: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          variantId: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              id: string;
              /** @enum {string} */
              status: 'active' | 'cancelled' | 'notified';
              variantId: string;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  delete_api_stock_alert_subscriptions_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              cancelled: boolean;
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_stock_alert_subscriptions_mine: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'createdAt';
        sortOrder?: 'asc' | 'desc';
      };
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
            data: {
              id: string;
              /** @enum {string} */
              status: 'active' | 'cancelled' | 'notified';
              variantId: string;
            }[];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_storefront_home: {
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
            data: {
              sections: {
                data:
                  | {
                      href?: null;
                      id: string;
                      imageUrl?: null;
                      items?: null;
                      placement?: null;
                      products: components['schemas']['CatalogProduct'][];
                      sections?: null;
                      slug: string;
                      title: string;
                    }
                  | {
                      href: string;
                      id: string;
                      imageUrl: string;
                      items?: null;
                      /** @enum {string} */
                      placement: 'home' | 'shop';
                      products?: null;
                      sections?: null;
                      slug?: null;
                      title: string;
                    }
                  | {
                      href?: null;
                      id?: null;
                      imageUrl?: null;
                      items: components['schemas']['NavigationItem'][];
                      placement: string;
                      products?: null;
                      sections?: null;
                      slug?: null;
                      title?: null;
                    }
                  | {
                      href?: null;
                      id?: null;
                      imageUrl?: null;
                      items?: null;
                      placement?: null;
                      products?: null;
                      sections: {
                        entryId: string;
                        id: string;
                        /** @enum {string} */
                        type: 'banner' | 'collection';
                      }[];
                      slug?: null;
                      title?: null;
                    };
                id: string;
                /** @enum {string} */
                type: 'banner' | 'collection';
              }[];
            };
            message?: string;
          };
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  post_api_support_tickets: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          attachmentIds?: string[];
          body: string;
          /** @enum {string} */
          category: 'order' | 'other' | 'payment' | 'product' | 'return';
          orderId?: string;
          subject: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['SupportTicket'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_support_tickets_id: {
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['SupportTicket'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_support_tickets_id_close: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          expectedVersion: number;
          reason: string;
        };
      };
    };
    responses: {
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['SupportTicket'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_support_tickets_id_messages: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'createdAt';
        sortOrder?: 'asc' | 'desc';
      };
      header?: never;
      path: {
        id: string;
      };
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
            data: components['schemas']['SupportMessage'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_support_tickets_id_messages: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          attachmentIds?: string[];
          body: string;
          expectedVersion: number;
          internal?: boolean;
        };
      };
    };
    responses: {
      /** @description Thành công */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['SupportMessage'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_support_tickets_mine: {
    parameters: {
      query?: {
        assigneeId?: string;
        category?: 'order' | 'other' | 'payment' | 'product' | 'return';
        orderId?: string;
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'createdAt' | 'subject' | 'status';
        sortOrder?: 'asc' | 'desc';
        status?: 'closed' | 'in_progress' | 'open' | 'resolved';
      };
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
            data: components['schemas']['SupportTicket'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_wishlist: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'createdAt';
        sortOrder?: 'asc' | 'desc';
      };
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
            data: {
              id: string;
              product: components['schemas']['CatalogProduct'] | null;
              productId: string;
            }[];
            message?: string;
            meta: components['schemas']['PaginationMeta'];
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  put_api_wishlist_items_productId: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        productId: string;
      };
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
            data: {
              id: string;
              productId: string;
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  delete_api_wishlist_items_productId: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        productId: string;
      };
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
            data: {
              removed: boolean;
            };
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
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
            status?: string;
          };
        };
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
  get_health_ready: {
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
      /** @description Chưa sẵn sàng */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
}
