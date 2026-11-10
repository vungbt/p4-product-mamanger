export interface paths {
  '/api/audit-logs': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Lịch sử thay đổi
     * @description Người quản lý chỉ xem các toà được gán. from/to gồm cả ngày kết thúc.
     *
     *     **Quyền:** `read:AuditLog`.
     */
    get: operations['get_api_audit_logs'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/audit-logs/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết thay đổi
     * @description Ngoài phạm vi trả 404; nội dung được redact khi đọc.
     *
     *     **Quyền:** `read:AuditLog`.
     */
    get: operations['get_api_audit_logs_id'];
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
  '/api/buildings': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách toà
     * @description Chỉ các toà người dùng được xem (người quản lý: toà được gán). Mặc định ẩn toà đã lưu trữ (`status=active`).
     *
     *     **Quyền:** `read:Building`.
     */
    get: operations['get_api_buildings'];
    put?: never;
    /**
     * Tạo toà
     * @description Mã A–Z, 0–9, tối đa 6 ký tự, duy nhất. Kỳ thu, làm tròn, hoàn tiền phòng để `null` = theo hệ thống. Ngày trong tháng `1`–`28`, hoặc `31` = cuối tháng. Hạn thanh toán phải ≥ ngày phát hành. Tài khoản ngân hàng nhập đủ cả ba trường (BIN VietQR 6 số, số tài khoản, tên chủ tài khoản in hoa không dấu) hoặc bỏ trống.
     *
     *     **Quyền:** `manage:Building`.
     */
    post: operations['post_api_buildings'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/buildings/{buildingId}/rooms': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách phòng của toà (sơ đồ phòng)
     * @description Phòng chưa lưu trữ, mặc định theo tầng rồi mã. Lọc `floor`, `status` (trạng thái suy ra: `vacant`, `reserved`, `occupied`, `maintenance`), tìm `q` theo mã phòng. Kèm hợp đồng hiện tại, số người ở, công nợ (rỗng/0 cho tới khi có hợp đồng và hoá đơn). Toà ngoài phạm vi trả 404.
     *
     *     **Quyền:** `read:Room`.
     */
    get: operations['get_api_buildings_buildingId_rooms'];
    put?: never;
    /**
     * Tạo phòng
     * @description Mã A–Z, 0–9, `.`, `-` (tối đa 12, tự viết hoa), duy nhất trong các phòng chưa lưu trữ của toà. Tạo kèm một đồng hồ điện và một đồng hồ nước với chỉ số ban đầu là số nguyên ≥ 0 (mặc định 0). Toà đã lưu trữ trả 409.
     *
     *     **Quyền:** `manage:Room`.
     */
    post: operations['post_api_buildings_buildingId_rooms'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/buildings/{buildingId}/rooms/bulk': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Tạo nhanh nhiều phòng
     * @description Tạo các mã sinh từ mẫu trong một giao dịch, bỏ qua mã đã có (`skipped`). Giá niêm yết chung, sửa từng phòng qua `prices` (mã phải thuộc danh sách sinh ra). Gọi lại cùng `Idempotency-Key` và cùng nội dung trả lại kết quả lần đầu, không tạo trùng; khác nội dung trả 409 `idempotency_conflict`.
     *
     *     **Quyền:** `manage:Room`. Bắt buộc header `Idempotency-Key`.
     */
    post: operations['post_api_buildings_buildingId_rooms_bulk'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/buildings/{buildingId}/rooms/bulk/preview': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Xem trước tạo nhanh nhiều phòng
     * @description Sinh mã theo mẫu (`{floor}` = số tầng, `{number}` = số phòng 2 chữ số, ví dụ `{floor}{number}` → 101…104) và đánh dấu mã đã có (`exists`, sẽ bỏ qua). Tối đa 200 phòng mỗi lần.
     *
     *     **Quyền:** `manage:Room`.
     */
    post: operations['post_api_buildings_buildingId_rooms_bulk_preview'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/buildings/{buildingId}/rooms/summary': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Tổng số phòng theo trạng thái
     * @description Đếm phòng chưa lưu trữ theo trạng thái suy ra và danh sách tầng, dùng cho đầu sơ đồ phòng và bộ lọc tầng.
     *
     *     **Quyền:** `read:Room`.
     */
    get: operations['get_api_buildings_buildingId_rooms_summary'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/buildings/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết toà
     * @description Kèm thống kê nhanh, kỳ thu đang áp dụng (`billing`) và `codeLocked`. Toà ngoài phạm vi của người dùng trả 404.
     *
     *     **Quyền:** `read:Building`.
     */
    get: operations['get_api_buildings_id'];
    /**
     * Sửa toà
     * @description Gửi đủ các trường như khi tạo (trường bỏ trống = `null`). Không đổi được mã khi toà đã có hoá đơn (`codeLocked`). Toà đã lưu trữ trả 409. Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`.
     *
     *     **Quyền:** `manage:Building`.
     */
    put: operations['put_api_buildings_id'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/buildings/{id}/archive': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Lưu trữ toà
     * @description Trả 409 `building_has_active_contracts` kèm `extensions.rooms` khi còn phòng có hợp đồng hiệu lực.
     *
     *     **Quyền:** `manage:Building`.
     */
    post: operations['post_api_buildings_id_archive'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/buildings/{id}/prices': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Đơn giá của toà
     * @description Giá từng dịch vụ tại ngày `date` (`YYYY-MM-DD`, mặc định hôm nay theo Asia/Ho_Chi_Minh): bản ghi ghi đè có `effectiveFrom` lớn nhất ≤ ngày đó, không có thì giá mặc định. Kèm lịch sử ghi đè.
     *
     *     **Quyền:** `read:Building`.
     */
    get: operations['get_api_buildings_id_prices'];
    /**
     * Đặt giá riêng từ một ngày
     * @description `price: null` = quay về giá mặc định từ `effectiveFrom`. Đã có bản ghi cùng ngày thì thay thế, trừ khi hoá đơn đã phát hành dùng giá đó (409 `price_history_locked`).
     *
     *     **Quyền:** `manage:Building`.
     */
    put: operations['put_api_buildings_id_prices'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/expense-categories': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh mục chi phí
     * @description Gồm các danh mục đã tắt. Chỉ tắt thay vì xoá để giữ lịch sử.
     *
     *     **Quyền:** `manage:Expense`.
     */
    get: operations['get_api_expense_categories'];
    put?: never;
    /**
     * Thêm danh mục chi phí
     * @description **Quyền:** `manage:Expense`.
     */
    post: operations['post_api_expense_categories'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/expense-categories/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /**
     * Sửa hoặc tắt danh mục chi phí
     * @description Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`.
     *
     *     **Quyền:** `manage:Expense`.
     */
    put: operations['put_api_expense_categories_id'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/expenses': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi phí vận hành
     * @description Lọc buildingId, period, categoryId, roomId. meta.totalsByCategory tính trên toàn bộ kết quả lọc, trước phân trang.
     *
     *     **Quyền:** `read:Expense`.
     */
    get: operations['get_api_expenses'];
    put?: never;
    /**
     * Thêm chi phí
     * @description Số nguyên VND > 0; kỳ suy ra từ ngày chi theo Asia/Ho_Chi_Minh. Ảnh private cùng toà, purpose expense_receipt.
     *
     *     **Quyền:** `manage:Expense`.
     */
    post: operations['post_api_expenses'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/expenses/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /**
     * Sửa chi phí
     * @description Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`.
     *
     *     **Quyền:** `manage:Expense`.
     */
    put: operations['put_api_expenses_id'];
    post?: never;
    /**
     * Xoá chi phí
     * @description **Quyền:** `manage:Expense`.
     */
    delete: operations['delete_api_expenses_id'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/files/{id}/stub': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Xem ảnh private (kho stub)
     * @description Chỉ khi máy chủ chạy kho stub. Cần `expires` và `signature` từ URL ký trong hồ sơ người thuê; thiếu/sai/hết hạn trả 403.
     *
     *     **Công khai.**
     */
    get: operations['get_api_files_id_stub'];
    put?: never;
    post?: never;
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
  '/api/rooms/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết phòng
     * @description Thông tin phòng, dịch vụ mặc định, đồng hồ đang dùng (chỉ số ban đầu, chỉ số gần nhất), hợp đồng hiện tại, người ở và 6 hoá đơn gần nhất (rỗng cho tới khi có hợp đồng, chốt số và hoá đơn). Phòng thuộc toà ngoài phạm vi trả 404.
     *
     *     **Quyền:** `read:Room`.
     */
    get: operations['get_api_rooms_id'];
    /**
     * Sửa phòng
     * @description Gửi đủ các trường như khi tạo (trừ chỉ số/seri đồng hồ: thay đồng hồ ở ST-13). Không sửa tay trạng thái thuê. Phòng đã lưu trữ trả 409 `room_archived`. Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`.
     *
     *     **Quyền:** `manage:Room`.
     */
    put: operations['put_api_rooms_id'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/rooms/{id}/archive': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Lưu trữ phòng
     * @description Ẩn phòng khỏi sơ đồ và giải phóng mã phòng. Phòng đang có hợp đồng hiệu lực trả 409 `room_has_contract`.
     *
     *     **Quyền:** `manage:Room`.
     */
    post: operations['post_api_rooms_id_archive'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/rooms/{id}/maintenance': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Bật/tắt bảo trì phòng
     * @description Bật cần `reason`, `until` (tuỳ chọn) không trước hôm nay. Phòng đang có hợp đồng hiệu lực trả 409 `room_has_contract`. Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`.
     *
     *     **Quyền:** `manage:Room`.
     */
    post: operations['post_api_rooms_id_maintenance'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/services': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh mục dịch vụ
     * @description Mọi dịch vụ (cả đã tắt, xem `active`), theo `sortOrder`.
     *
     *     **Quyền:** `read:Settings`.
     */
    get: operations['get_api_services'];
    put?: never;
    /**
     * Thêm dịch vụ
     * @description Tên không trùng (không phân biệt hoa thường); đơn giá số nguyên VND ≥ 0. Chỉ một dịch vụ `electricity` và một `water` đang bật. `code` sinh từ tên; `kind` không đổi được sau khi tạo.
     *
     *     **Quyền:** `manage:Settings`.
     */
    post: operations['post_api_services'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/services/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /**
     * Sửa dịch vụ
     * @description Sửa tên, đơn vị, đơn giá mặc định, thứ tự, bật/tắt. Không xoá dịch vụ: chỉ tắt. Đổi giá không ảnh hưởng hoá đơn đã phát hành. Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`.
     *
     *     **Quyền:** `manage:Settings`.
     */
    put: operations['put_api_services_id'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/settings': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Kỳ thu mặc định
     * @description Ngày chốt số, ngày phát hành, hạn thanh toán, đơn vị làm tròn, hoàn tiền phòng và mẫu nội dung chuyển khoản. Toà để trống trường nào thì theo giá trị ở đây.
     *
     *     **Quyền:** `read:Settings`.
     */
    get: operations['get_api_settings'];
    /**
     * Cập nhật kỳ thu mặc định
     * @description Ngày trong tháng `1`–`28`, hoặc `31` = cuối tháng. Hạn thanh toán phải ≥ ngày phát hành. Làm tròn 1, 100 hoặc 1.000đ. Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`.
     *
     *     **Quyền:** `manage:Settings`.
     */
    put: operations['put_api_settings'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/tenants': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách người thuê
     * @description Người quản lý chỉ thấy người thuê của toà được gán. `q` tìm theo tên, SĐT; 4 chữ số cũng khớp 4 số cuối CCCD. `status`: `all` (mặc định, ẩn hồ sơ đã lưu trữ), `living` (đang ở), `left` (đã rời), `no_contract` (chưa có hợp đồng), `archived`. Trạng thái suy ra từ hợp đồng (ST-10). CCCD luôn che giữa.
     *
     *     **Quyền:** `read:Tenant`.
     */
    get: operations['get_api_tenants'];
    put?: never;
    /**
     * Tạo người thuê
     * @description Gửi `buildingId` của toà. Chỉ bắt buộc `fullName` và `phone` (10 số, bắt đầu 0; nhận cả `+84`, khoảng trắng, dấu chấm và tự chuẩn hoá). CCCD 12 số, duy nhất toàn hệ thống: trùng → 400 với `extensions.idNumber` và `extensions.duplicateTenant` (`tenantId` chỉ có khi người dùng được xem hồ sơ đó). Ngày dạng `YYYY-MM-DD` (hoặc `dd/MM/yyyy`), không sau hôm nay. Không tự điền giá trị nào.
     *
     *     **Quyền:** `create:Tenant`.
     */
    post: operations['post_api_tenants'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/tenants/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Hồ sơ người thuê
     * @description Kèm xe, ảnh CCCD (`url` ký, hết hạn sau 5 phút: đọc lại hồ sơ để lấy URL mới), hợp đồng đã/đang ở. CCCD che giữa; xem đủ qua `reveal-id`. Người thuê ngoài phạm vi trả 404.
     *
     *     **Quyền:** `read:Tenant`.
     */
    get: operations['get_api_tenants_id'];
    /**
     * Sửa người thuê
     * @description Gửi đủ các trường như khi tạo (bỏ trống = `null`), trừ `idNumber`: không gửi thì giữ CCCD đang lưu, `null` để xoá. Chỉ bắt buộc `fullName` và `phone` (10 số, bắt đầu 0; nhận cả `+84`, khoảng trắng, dấu chấm và tự chuẩn hoá). CCCD 12 số, duy nhất toàn hệ thống: trùng → 400 với `extensions.idNumber` và `extensions.duplicateTenant` (`tenantId` chỉ có khi người dùng được xem hồ sơ đó). Ngày dạng `YYYY-MM-DD` (hoặc `dd/MM/yyyy`), không sau hôm nay. Không tự điền giá trị nào. Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`.
     *
     *     **Quyền:** `update:Tenant`.
     */
    put: operations['put_api_tenants_id'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/tenants/{id}/archive': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Lưu trữ người thuê
     * @description Hồ sơ đã lưu trữ không sửa được (409 `tenant_archived`). 409 `tenant_has_active_contract` khi còn ở trong hợp đồng hiệu lực.
     *
     *     **Quyền:** `delete:Tenant`.
     */
    post: operations['post_api_tenants_id_archive'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/tenants/{id}/documents': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Gắn ảnh CCCD
     * @description `fileId` từ `POST /api/uploads/{id}/complete` (mục đích `tenant_document`, cùng toà, do chính người dùng tải lên). Mặt trước/sau mới thay ảnh cũ.
     *
     *     **Quyền:** `update:Tenant`.
     */
    post: operations['post_api_tenants_id_documents'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/tenants/{id}/reveal-id': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Xem đủ số CCCD
     * @description Mỗi lần gọi ghi một dòng audit `tenant.reveal_id_number` (không chứa số CCCD).
     *
     *     **Quyền:** `read:Tenant`.
     */
    post: operations['post_api_tenants_id_reveal_id'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/tenants/{id}/vehicles': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Thêm xe
     * @description Biển số viết hoa; không trùng (bỏ qua dấu gạch, chấm, khoảng trắng) trong các xe của người thuê.
     *
     *     **Quyền:** `update:Tenant`.
     */
    post: operations['post_api_tenants_id_vehicles'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/tenants/{id}/vehicles/{vehicleId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /**
     * Sửa xe
     * @description **Quyền:** `update:Tenant`.
     */
    put: operations['put_api_tenants_id_vehicles_vehicleId'];
    post?: never;
    /**
     * Xoá xe
     * @description **Quyền:** `update:Tenant`.
     */
    delete: operations['delete_api_tenants_id_vehicles_vehicleId'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/tenants/import': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Nhập người thuê từ bản xem trước
     * @description Gửi lại `values` của các dòng đã xem trước; máy chủ kiểm tra lại và chỉ tạo dòng hợp lệ trong một transaction. Gọi lại cùng `Idempotency-Key` và cùng nội dung trả kết quả cũ (`replayed: true`), không tạo trùng.
     *
     *     **Quyền:** `manage:Tenant`. Bắt buộc header `Idempotency-Key`.
     */
    post: operations['post_api_tenants_import'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/tenants/import/preview': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Xem trước file import
     * @description Gửi `file` (CSV UTF-8 hoặc XLSX, tối đa 2 MB, 1.000 dòng) và `?buildingId=`. Trả trạng thái từng dòng: `valid`, `error` (lỗi theo cột) hoặc `duplicate` (SĐT đã có trong toà hoặc CCCD đã có, hoặc lặp dòng trước trong file). Không ghi DB, không tự gán phòng.
     *
     *     **Quyền:** `manage:Tenant`.
     */
    post: operations['post_api_tenants_import_preview'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/tenants/import/template': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * File mẫu import người thuê
     * @description `format=xlsx` (mặc định, các cột định dạng văn bản để giữ số 0 đầu) hoặc `csv` (UTF-8). Chỉ có dòng tiêu đề.
     *
     *     **Quyền:** `manage:Tenant`.
     */
    get: operations['get_api_tenants_import_template'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/uploads': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Xin ticket tải ảnh private
     * @description Cần quyền tạo/sửa người thuê ở `buildingId`. Ticket hết hạn sau 10 phút; ảnh JPG/PNG/WEBP tối đa 10 MB.
     *
     *     **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_uploads'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/uploads/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Trạng thái ticket tải ảnh
     * @description Chỉ người tạo ticket xem được.
     *
     *     **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_uploads_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/uploads/{id}/complete': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Xác nhận đã tải ảnh
     * @description Máy chủ kiểm tra ảnh trên kho lưu trữ (định dạng, dung lượng) rồi tạo file private. Gọi lại trả cùng kết quả.
     *
     *     **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_uploads_id_complete'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/uploads/{id}/stub': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Nhận ảnh (kho stub)
     * @description Chỉ khi máy chủ chạy kho stub (dev/test/CI, không cấu hình Cloudinary). URL có chữ ký nằm trong `uploadUrl` của ticket; không dùng cookie.
     *
     *     **Công khai.**
     */
    post: operations['post_api_uploads_id_stub'];
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
    BillingSettings: {
      dueDay: number;
      issueDay: number;
      readingDay: number;
      refundUnusedRent: boolean;
      roundingUnit: 1 | 1000 | 100;
    };
    BuildingPriceList: {
      buildingId: string;
      date: string;
      items: components['schemas']['BuildingServicePrice'][];
    };
    BuildingPriceOverride: {
      createdAt: string;
      effectiveFrom: string;
      id: string;
      price: number | null;
      serviceId: string;
    };
    BuildingServicePrice: {
      active: boolean;
      code: string;
      defaultPrice: number;
      effectiveFrom: string | null;
      history: components['schemas']['BuildingPriceOverride'][];
      /** @enum {string} */
      kind: 'electricity' | 'per_person' | 'per_room' | 'per_vehicle' | 'water';
      name: string;
      price: number;
      serviceId: string;
      /** @enum {string} */
      source: 'default' | 'override';
      unit: string;
    };
    BuildingStats: {
      occupiedRoomCount: number;
      roomCount: number;
    };
    DuplicateTenantRef: {
      /** @enum {string} */
      field: 'idNumber' | 'phone';
      tenantId: string | null;
    };
    PaginationMeta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    RoomBulkPreview: {
      createCount: number;
      items: components['schemas']['RoomBulkPreviewItem'][];
      skipCount: number;
    };
    RoomBulkPreviewItem: {
      code: string;
      exists: boolean;
      floor: number;
    };
    RoomBulkResult: {
      buildingId: string;
      created: components['schemas']['StayRoom'][];
      skipped: components['schemas']['RoomBulkSkipped'][];
    };
    RoomBulkSkipped: {
      code: string;
      floor: number;
      /** @enum {string} */
      reason: 'exists';
    };
    RoomContractSummary: {
      code: string;
      depositHeld: number;
      endDate: string | null;
      id: string;
      primaryTenantName: string | null;
      rent: number;
      startDate: string;
      /** @enum {string} */
      status: 'active' | 'cancelled' | 'draft' | 'ended' | 'ending';
    };
    RoomInvoiceSummary: {
      code: string | null;
      dueOn: string | null;
      id: string;
      /** @enum {string} */
      kind: 'monthly' | 'move_in' | 'settlement';
      paidTotal: number;
      period: string;
      /** @enum {string} */
      status: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'void';
      total: number;
    };
    RoomMeter: {
      id: string;
      initialReading: number;
      installedOn: string;
      /** @enum {string} */
      kind: 'electricity' | 'water';
      latestPeriod: string | null;
      latestReading: number | null;
      serial: string | null;
    };
    RoomOccupant: {
      fromDate: string;
      fullName: string;
      isPrimary: boolean;
      phone: string | null;
      tenantId: string;
    };
    RoomService: {
      active: boolean;
      code: string;
      id: string;
      /** @enum {string} */
      kind: 'electricity' | 'per_person' | 'per_room' | 'per_vehicle' | 'water';
      name: string;
      unit: string;
    };
    RoomStatusCounts: {
      maintenance: number;
      occupied: number;
      reserved: number;
      vacant: number;
    };
    RoomSummary: {
      buildingId: string;
      counts: components['schemas']['RoomStatusCounts'];
      floors: number[];
      total: number;
    };
    StayAuditLog: {
      action: string;
      actorId: string | null;
      actorName: string | null;
      changes:
        | (
            | string
            | number
            | boolean
            | unknown[]
            | {
                [key: string]: unknown;
              }
          )
        | null;
      createdAt: string;
      id: string;
      /** @enum {string} */
      outcome: 'failure' | 'success';
      resourceId: string;
      resourceType: string;
    };
    StayBuilding: {
      address: string | null;
      archivedAt: string | null;
      bankAccount: string | null;
      bankAccountName: string | null;
      bankBin: string | null;
      code: string;
      contactPhone: string | null;
      createdAt: string;
      dueDay: number | null;
      id: string;
      issueDay: number | null;
      name: string;
      readingDay: number | null;
      refundUnusedRent: boolean | null;
      roundingUnit: (1 | 1000 | 100) | null;
      rulesText: string | null;
      stats: components['schemas']['BuildingStats'];
      updatedAt: string;
      version: number;
    };
    StayBuildingDetail: {
      address: string | null;
      archivedAt: string | null;
      bankAccount: string | null;
      bankAccountName: string | null;
      bankBin: string | null;
      billing: components['schemas']['BillingSettings'];
      code: string;
      codeLocked: boolean;
      contactPhone: string | null;
      createdAt: string;
      dueDay: number | null;
      id: string;
      issueDay: number | null;
      name: string;
      readingDay: number | null;
      refundUnusedRent: boolean | null;
      roundingUnit: (1 | 1000 | 100) | null;
      rulesText: string | null;
      stats: components['schemas']['BuildingStats'];
      updatedAt: string;
      version: number;
    };
    StayCapabilities: {
      contractVersion: string;
      rules: components['schemas']['StayRule'][];
    };
    StayExpense: {
      amount: number;
      buildingId: string;
      categoryId: string;
      id: string;
      note: string | null;
      period: string;
      receipt: {
        expiresAt: string;
        url: string;
      } | null;
      receiptFileId: string | null;
      roomId: string | null;
      spentOn: string;
      version: number;
    };
    StayExpenseCategory: {
      active: boolean;
      id: string;
      name: string;
      version: number;
    };
    StayMe: {
      user: components['schemas']['StayUser'];
    };
    StayRoom: {
      archivedAt: string | null;
      areaM2: number | null;
      buildingId: string;
      code: string;
      contract: components['schemas']['RoomContractSummary'] | null;
      createdAt: string;
      debt: number;
      defaultServiceIds: string[];
      floor: number;
      id: string;
      listPrice: number;
      maintenance: boolean;
      maintenanceReason: string | null;
      maintenanceUntil: string | null;
      maxOccupants: number;
      note: string | null;
      occupantCount: number;
      /** @enum {string} */
      status: 'maintenance' | 'occupied' | 'reserved' | 'vacant';
      updatedAt: string;
      version: number;
    };
    StayRoomDetail: {
      archivedAt: string | null;
      areaM2: number | null;
      buildingCode: string;
      buildingId: string;
      buildingName: string;
      code: string;
      contract: components['schemas']['RoomContractSummary'] | null;
      createdAt: string;
      debt: number;
      defaultServiceIds: string[];
      defaultServices: components['schemas']['RoomService'][];
      floor: number;
      id: string;
      invoices: components['schemas']['RoomInvoiceSummary'][];
      listPrice: number;
      maintenance: boolean;
      maintenanceReason: string | null;
      maintenanceUntil: string | null;
      maxOccupants: number;
      meters: components['schemas']['RoomMeter'][];
      note: string | null;
      occupantCount: number;
      occupants: components['schemas']['RoomOccupant'][];
      /** @enum {string} */
      status: 'maintenance' | 'occupied' | 'reserved' | 'vacant';
      updatedAt: string;
      version: number;
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
    StayService: {
      active: boolean;
      code: string;
      defaultPrice: number;
      id: string;
      /** @enum {string} */
      kind: 'electricity' | 'per_person' | 'per_room' | 'per_vehicle' | 'water';
      name: string;
      sortOrder: number;
      unit: string;
      version: number;
    };
    StaySettings: {
      dueDay: number;
      issueDay: number;
      readingDay: number;
      refundUnusedRent: boolean;
      roundingUnit: 1 | 1000 | 100;
      transferContentTemplate: string;
      version: number;
    };
    StayTenant: {
      archivedAt: string | null;
      buildingId: string;
      createdAt: string;
      currentRoom: components['schemas']['TenantRoomRef'] | null;
      fullName: string;
      id: string;
      idNumberMasked: string | null;
      phone: string;
      residenceDeclared: boolean | null;
      /** @enum {string} */
      status: 'left' | 'living' | 'no_contract';
      updatedAt: string;
      version: number;
    };
    StayTenantDetail: {
      archivedAt: string | null;
      birthDate: string | null;
      buildingId: string;
      contracts: components['schemas']['TenantContractRef'][];
      createdAt: string;
      currentRoom: components['schemas']['TenantRoomRef'] | null;
      documents: components['schemas']['TenantDocument'][];
      email: string | null;
      fullName: string;
      /** @enum {string|null} */
      gender: 'female' | 'male' | 'other' | null;
      hometown: string | null;
      id: string;
      idIssuedAt: string | null;
      idNumberMasked: string | null;
      note: string | null;
      occupation: string | null;
      permanentAddress: string | null;
      phone: string;
      portalLastOpenedAt: string | null;
      residenceDeclared: boolean | null;
      /** @enum {string} */
      status: 'left' | 'living' | 'no_contract';
      updatedAt: string;
      vehicles: components['schemas']['TenantVehicle'][];
      version: number;
    };
    StayUpload: {
      buildingId: string;
      expiresAt: string;
      fileId: string | null;
      id: string;
      maxBytes: number;
      /** @enum {string} */
      purpose: 'expense_receipt' | 'tenant_document';
      /** @enum {string} */
      status: 'completed' | 'pending';
    };
    StayUploadTicket: {
      allowedMimeTypes: string[];
      buildingId: string;
      expiresAt: string;
      fileId: string | null;
      id: string;
      maxBytes: number;
      /** @enum {string} */
      purpose: 'expense_receipt' | 'tenant_document';
      /** @enum {string} */
      status: 'completed' | 'pending';
      uploadUrl: string;
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
    TenantContractRef: {
      code: string;
      fromDate: string;
      id: string;
      room: components['schemas']['TenantRoomRef'];
      status: string;
      toDate: string | null;
    };
    TenantDocument: {
      createdAt: string;
      fileId: string;
      id: string;
      /** @enum {string} */
      kind: 'id_back' | 'id_front' | 'other';
      url: string | null;
      urlExpiresAt: string | null;
    };
    TenantIdReveal: {
      idNumber: string | null;
    };
    TenantImportCellError: {
      /** @enum {string} */
      column:
        | 'birthDate'
        | 'email'
        | 'fullName'
        | 'gender'
        | 'hometown'
        | 'idIssuedAt'
        | 'idNumber'
        | 'note'
        | 'occupation'
        | 'permanentAddress'
        | 'phone';
      message: string;
    };
    TenantImportCommitInput: {
      buildingId: string;
      rows: components['schemas']['TenantImportCommitRow'][];
    };
    TenantImportCommitRow: {
      line: number;
      values: unknown;
    };
    TenantImportPreview: {
      buildingId: string;
      duplicateCount: number;
      errorCount: number;
      fileName: string;
      rows: components['schemas']['TenantImportRow'][];
      totalRows: number;
      validCount: number;
    };
    TenantImportResult: {
      buildingId: string;
      createdCount: number;
      replayed: boolean;
      skipped: {
        line: number;
        /** @enum {string} */
        status: 'duplicate' | 'error';
      }[];
      skippedCount: number;
      tenantIds: string[];
    };
    TenantImportRow: {
      duplicate: components['schemas']['DuplicateTenantRef'] | null;
      errors: components['schemas']['TenantImportCellError'][];
      line: number;
      /** @enum {string} */
      status: 'duplicate' | 'error' | 'valid';
      values: unknown;
    };
    TenantRoomRef: {
      code: string;
      id: string;
    };
    TenantVehicle: {
      createdAt: string;
      id: string;
      note: string | null;
      plate: string;
      tenantId: string;
      /** @enum {string} */
      type: 'bicycle' | 'car' | 'electric_bike' | 'motorbike' | 'other';
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
  get_api_audit_logs: {
    parameters: {
      query?: {
        action?: string;
        actorId?: string;
        buildingId?: string;
        from?: string;
        page?: number;
        pageSize?: number;
        q?: string;
        resourceId?: string;
        resourceType?: string;
        sortBy?: 'createdAt' | 'action' | 'resourceType';
        sortOrder?: 'asc' | 'desc';
        to?: string;
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
            data: components['schemas']['StayAuditLog'][];
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
  get_api_audit_logs_id: {
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
            data: components['schemas']['StayAuditLog'];
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
  get_api_buildings: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'code' | 'name' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
        status?: 'active' | 'all' | 'archived';
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
            data: components['schemas']['StayBuilding'][];
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
  post_api_buildings: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          address?: string | null;
          bankAccount?: string | null;
          bankAccountName?: string | null;
          bankBin?: string | null;
          code: string;
          contactPhone?: string | null;
          dueDay?: number | null;
          issueDay?: number | null;
          name: string;
          readingDay?: number | null;
          refundUnusedRent?: boolean | null;
          /** @enum {integer|null} */
          roundingUnit?: 1 | 100 | 1000 | null;
          rulesText?: string | null;
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
            data: components['schemas']['StayBuildingDetail'];
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
  get_api_buildings_buildingId_rooms: {
    parameters: {
      query?: {
        floor?: number;
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'floor' | 'code' | 'listPrice' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
        status?: 'maintenance' | 'occupied' | 'reserved' | 'vacant';
      };
      header?: never;
      path: {
        buildingId: string;
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
            data: components['schemas']['StayRoom'][];
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
  post_api_buildings_buildingId_rooms: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        buildingId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          areaM2?: number | null;
          code: string;
          electricSerial?: string;
          floor: number;
          initialElectric?: number;
          initialWater?: number;
          listPrice: number;
          maxOccupants: number;
          note?: string;
          serviceIds?: string[];
          waterSerial?: string;
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
            data: components['schemas']['StayRoomDetail'];
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
  post_api_buildings_buildingId_rooms_bulk: {
    parameters: {
      query?: never;
      header: {
        /** @description Dùng lại đúng key khi retry cùng payload; khác payload sẽ trả 409. */
        'Idempotency-Key': string;
      };
      path: {
        buildingId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          areaM2?: number | null;
          floorFrom: number;
          floorTo: number;
          initialElectric?: number;
          initialWater?: number;
          listPrice: number;
          maxOccupants: number;
          prices?: {
            code: string;
            listPrice: number;
          }[];
          roomsPerFloor: number;
          serviceIds?: string[];
          template: string;
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
            data: components['schemas']['RoomBulkResult'];
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
  post_api_buildings_buildingId_rooms_bulk_preview: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        buildingId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          floorFrom: number;
          floorTo: number;
          roomsPerFloor: number;
          template: string;
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
            data: components['schemas']['RoomBulkPreview'];
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
  get_api_buildings_buildingId_rooms_summary: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        buildingId: string;
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
            data: components['schemas']['RoomSummary'];
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
  get_api_buildings_id: {
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
            data: components['schemas']['StayBuildingDetail'];
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
  put_api_buildings_id: {
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
          address?: string | null;
          bankAccount?: string | null;
          bankAccountName?: string | null;
          bankBin?: string | null;
          code: string;
          contactPhone?: string | null;
          dueDay?: number | null;
          issueDay?: number | null;
          name: string;
          readingDay?: number | null;
          refundUnusedRent?: boolean | null;
          /** @enum {integer|null} */
          roundingUnit?: 1 | 100 | 1000 | null;
          rulesText?: string | null;
          version: number;
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
            data: components['schemas']['StayBuildingDetail'];
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
  post_api_buildings_id_archive: {
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
            data: components['schemas']['StayBuildingDetail'];
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
  get_api_buildings_id_prices: {
    parameters: {
      query?: {
        date?: string;
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
            data: components['schemas']['BuildingPriceList'];
            message?: string;
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
  put_api_buildings_id_prices: {
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
          /** Format: date */
          effectiveFrom: string;
          price: number | null;
          /** Format: uuid */
          serviceId: string;
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
            data: components['schemas']['BuildingPriceOverride'];
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
  get_api_expense_categories: {
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
            data: components['schemas']['StayExpenseCategory'][];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_expense_categories: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          /** @default true */
          active?: boolean;
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
            data: components['schemas']['StayExpenseCategory'];
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
  put_api_expense_categories_id: {
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
          /** @default true */
          active?: boolean;
          name: string;
          version: number;
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
            data: components['schemas']['StayExpenseCategory'];
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
  get_api_expenses: {
    parameters: {
      query?: {
        buildingId?: string;
        categoryId?: string;
        page?: number;
        pageSize?: number;
        period?: string;
        q?: string;
        roomId?: string;
        sortBy?: 'spentOn' | 'amount' | 'createdAt';
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
            data: components['schemas']['StayExpense'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'] & {
              totalsByCategory: {
                amount: number;
                /** Format: uuid */
                categoryId: string;
              }[];
            };
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_expenses: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          amount: number;
          /** Format: uuid */
          buildingId: string;
          /** Format: uuid */
          categoryId: string;
          note?: string | null;
          /** Format: uuid */
          receiptFileId?: string | null;
          /** Format: uuid */
          roomId?: string | null;
          /** @description YYYY-MM-DD in Asia/Ho_Chi_Minh, or an ISO instant with explicit timezone. */
          spentOn: string;
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
            data: components['schemas']['StayExpense'];
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
  put_api_expenses_id: {
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
          /** Format: uuid */
          buildingId: string;
          /** Format: uuid */
          categoryId: string;
          note?: string | null;
          /** Format: uuid */
          receiptFileId?: string | null;
          /** Format: uuid */
          roomId?: string | null;
          /** @description YYYY-MM-DD in Asia/Ho_Chi_Minh, or an ISO instant with explicit timezone. */
          spentOn: string;
          version: number;
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
            data: components['schemas']['StayExpense'];
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
  delete_api_expenses_id: {
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
  get_api_files_id_stub: {
    parameters: {
      query?: {
        expires?: string;
        signature?: string;
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
        content?: never;
      };
      400: components['responses']['ValidationError'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
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
  get_api_rooms_id: {
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
            data: components['schemas']['StayRoomDetail'];
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
  put_api_rooms_id: {
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
          areaM2?: number | null;
          code: string;
          floor: number;
          listPrice: number;
          maxOccupants: number;
          note?: string;
          serviceIds?: string[];
          version: number;
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
            data: components['schemas']['StayRoomDetail'];
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
  post_api_rooms_id_archive: {
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
            data: components['schemas']['StayRoomDetail'];
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
  post_api_rooms_id_maintenance: {
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
          maintenance: boolean;
          reason?: string;
          /** Format: date */
          until?: string;
          version: number;
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
            data: components['schemas']['StayRoomDetail'];
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
  get_api_services: {
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
            data: components['schemas']['StayService'][];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_services: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          active?: boolean;
          defaultPrice: number;
          /** @enum {string} */
          kind: 'electricity' | 'per_person' | 'per_room' | 'per_vehicle' | 'water';
          name: string;
          sortOrder?: number;
          unit: string;
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
            data: components['schemas']['StayService'];
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
  put_api_services_id: {
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
          defaultPrice: number;
          name: string;
          sortOrder: number;
          unit: string;
          version: number;
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
            data: components['schemas']['StayService'];
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
  get_api_settings: {
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
            data: components['schemas']['StaySettings'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  put_api_settings: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          dueDay: number;
          issueDay: number;
          readingDay: number;
          refundUnusedRent: boolean;
          /** @enum {integer} */
          roundingUnit: 1 | 100 | 1000;
          transferContentTemplate: string;
          version: number;
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
            data: components['schemas']['StaySettings'];
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
  get_api_tenants: {
    parameters: {
      query?: {
        buildingId?: string;
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'fullName' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
        status?: 'all' | 'archived' | 'left' | 'living' | 'no_contract';
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
            data: components['schemas']['StayTenant'][];
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
  post_api_tenants: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          /** Format: date */
          birthDate?: string | null;
          /** Format: uuid */
          buildingId: string;
          email?: string | null;
          fullName: string;
          /** @enum {string|null} */
          gender?: 'male' | 'female' | 'other' | null;
          hometown?: string | null;
          /** Format: date */
          idIssuedAt?: string | null;
          idNumber?: string | null;
          note?: string | null;
          occupation?: string | null;
          permanentAddress?: string | null;
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
            data: components['schemas']['StayTenantDetail'];
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
  get_api_tenants_id: {
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
            data: components['schemas']['StayTenantDetail'];
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
  put_api_tenants_id: {
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
          /** Format: date */
          birthDate?: string | null;
          email?: string | null;
          fullName: string;
          /** @enum {string|null} */
          gender?: 'male' | 'female' | 'other' | null;
          hometown?: string | null;
          /** Format: date */
          idIssuedAt?: string | null;
          idNumber?: string | null;
          note?: string | null;
          occupation?: string | null;
          permanentAddress?: string | null;
          phone: string;
          version: number;
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
            data: components['schemas']['StayTenantDetail'];
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
  post_api_tenants_id_archive: {
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
            data: components['schemas']['StayTenantDetail'];
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
  post_api_tenants_id_documents: {
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
          /** Format: uuid */
          fileId: string;
          /** @enum {string} */
          kind: 'id_front' | 'id_back' | 'other';
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
            data: components['schemas']['TenantDocument'];
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
  post_api_tenants_id_reveal_id: {
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
            data: components['schemas']['TenantIdReveal'];
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
  post_api_tenants_id_vehicles: {
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
          note?: string | null;
          plate: string;
          /** @enum {string} */
          type: 'motorbike' | 'electric_bike' | 'bicycle' | 'car' | 'other';
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
            data: components['schemas']['TenantVehicle'];
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
  put_api_tenants_id_vehicles_vehicleId: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
        vehicleId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          note?: string | null;
          plate: string;
          /** @enum {string} */
          type: 'motorbike' | 'electric_bike' | 'bicycle' | 'car' | 'other';
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
            data: components['schemas']['TenantVehicle'];
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
  delete_api_tenants_id_vehicles_vehicleId: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
        vehicleId: string;
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
  post_api_tenants_import: {
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
        'application/json': components['schemas']['TenantImportCommitInput'];
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
            data: components['schemas']['TenantImportResult'];
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
  post_api_tenants_import_preview: {
    parameters: {
      query?: {
        buildingId?: string;
      };
      header?: never;
      path?: never;
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['TenantImportPreview'];
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
  get_api_tenants_import_template: {
    parameters: {
      query?: {
        format?: string;
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
        content?: never;
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_uploads: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          /** Format: uuid */
          buildingId: string;
          /** @enum {string} */
          purpose: 'tenant_document' | 'expense_receipt';
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
            data: components['schemas']['StayUploadTicket'];
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
  get_api_uploads_id: {
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
            data: components['schemas']['StayUpload'];
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
  post_api_uploads_id_complete: {
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
            data: components['schemas']['StayUpload'];
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
  post_api_uploads_id_stub: {
    parameters: {
      query?: {
        expires?: string;
        signature?: string;
      };
      header?: never;
      path: {
        id: string;
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
      /** @description Thành công */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: {
              bytes: number;
              id: string;
            };
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
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
