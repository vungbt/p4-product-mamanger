export interface paths {
  '/api/announcements': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Thông báo cho người thuê
     * @description Lọc `buildingId`, `status` (`active` còn hiển thị, `expired` đã hết hạn/lưu trữ, `all` mặc định), `q` (tiêu đề, nội dung). Ghim trước rồi mới nhất. Quyền `update:Building` theo toà (chủ trọ, người quản lý toà); ngoài phạm vi trả 404.
     *
     *     **Quyền:** `update:Building`.
     */
    get: operations['get_api_announcements'];
    put?: never;
    /**
     * Tạo thông báo
     * @description `roomIds` rỗng/null = cả toà, ngược lại các phòng đang hoạt động của toà (422 `roomIds`). `expiresOn` là ngày cuối còn hiển thị (Asia/Ho_Chi_Minh), không trước hôm nay; null = không hết hạn. Audit chỉ ghi id, số phòng, ghim, hạn.
     *
     *     **Quyền:** `update:Building`.
     */
    post: operations['post_api_announcements'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/announcements/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /**
     * Sửa thông báo
     * @description Gửi đủ trường như khi tạo và `version`; không đổi toà. Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`.
     *
     *     **Quyền:** `update:Building`.
     */
    put: operations['put_api_announcements_id'];
    post?: never;
    /**
     * Xoá thông báo
     * @description Xoá hẳn. Ngoài phạm vi trả 404.
     *
     *     **Quyền:** `update:Building`.
     */
    delete: operations['delete_api_announcements_id'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/announcements/{id}/archive': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Lưu trữ thông báo
     * @description Ẩn với người thuê ngay (hết hạn từ bây giờ, bỏ ghim). Gọi lại không đổi gì.
     *
     *     **Quyền:** `update:Building`.
     */
    post: operations['post_api_announcements_id_archive'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
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
     * @description Mã A–Z, 0–9, tối đa 6 ký tự, duy nhất. Kỳ thu, làm tròn, hoàn tiền phòng để `null` = theo hệ thống. Ngày trong tháng `1`–`28`, hoặc `31` = cuối tháng. Hạn thanh toán phải ≥ ngày phát hành. `readingDayMonth`: `same` = ngày chốt số thuộc tháng tiêu thụ M−1, `next` = thuộc tháng M (khi đó ngày chốt số ≤ ngày phát hành, 422 `reading_after_issue`). `graceDays` 0–31: hoá đơn chỉ tính quá hạn sau `dueOn + graceDays`. Tài khoản ngân hàng nhập đủ cả ba trường (BIN VietQR 6 số, số tài khoản, tên chủ tài khoản in hoa không dấu) hoặc bỏ trống.
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
  '/api/buildings/{buildingId}/billing/{period}/drafts': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Tạo/làm mới bản nháp hoá đơn kỳ
     * @description Bắt buộc `Idempotency-Key`: gọi lại cùng key trả kết quả cũ (`replayed: true`), không tạo trùng. Làm mới tính lại bản nháp (giữ dòng phụ thu/giảm trừ thêm tay), không bao giờ tính lại hoá đơn đã phát hành. Hợp đồng bị loại không có hoá đơn. Trả bản xem trước sau khi ghi kèm số bản nháp tạo mới/làm mới.
     *
     *     **Quyền:** `create:Invoice`.
     */
    post: operations['post_api_buildings_buildingId_billing_period_drafts'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/buildings/{buildingId}/billing/{period}/preview': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Xem trước lập hoá đơn kỳ
     * @description `period` là kỳ hoá đơn M (YYYY-MM): tiền phòng và dịch vụ của M, điện nước tiêu thụ trong M−1. Liệt kê hợp đồng active/ending có ngày ở trong M: đủ điều kiện (tổng dự kiến, gồm cả dòng thêm tay của bản nháp) hoặc bị loại kèm `reason` (`missing_reading`, `missing_meter`, `negative_consumption`, `already_issued`, `move_in_invoice`, `no_occupancy`, `invalid_data`). Không ghi dữ liệu. Ngoài phạm vi trả 404.
     *
     *     **Quyền:** `read:Invoice`.
     */
    get: operations['get_api_buildings_buildingId_billing_period_preview'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/buildings/{buildingId}/billing/{period}/shares': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Chia sẻ hàng loạt hoá đơn của kỳ
     * @description Bắt buộc `Idempotency-Key`. Tạo/làm mới link cho mọi hoá đơn đã phát hành (gồm thu một phần/đã thu) của toà và kỳ, trả `{ invoiceId, roomCode, code, total, remaining, url }` theo mã phòng. Gọi lại cùng key trả lại đúng các link đó (`replayed: true`, bỏ các link đã bị làm mới/thu hồi sau đó); key mới làm mới tất cả và link cũ hết hiệu lực. Ngoài phạm vi trả 404.
     *
     *     **Quyền:** `update:Invoice`.
     */
    post: operations['post_api_buildings_buildingId_billing_period_shares'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/buildings/{buildingId}/overview': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Tổng quan tháng của toà
     * @description Kỳ `period` = M (`YYYY-MM`, năm 2000–2099; ngoài khoảng trả 422 `period_out_of_range`), mặc định kỳ hiện tại: kỳ mới nhất có ngày phát hành (`issueDay` của toà, hoặc mặc định hệ thống) ≤ hôm nay theo Asia/Ho_Chi_Minh. `current`/`previous`/`series` (6 kỳ, cũ trước): `billed` = tổng `total` của hoá đơn kỳ đó đã phát hành (`issued`, `partially_paid`, `paid`; mọi loại `monthly`, `move_in`, `settlement`; nháp và void không tính), `collected` = các khoản thu chưa huỷ của chính các hoá đơn đó (bất kể ngày thu), `remaining` = `billed − collected`. `collectedInMonth` = tiền thu theo ngày `paidOn` trong tháng M (bằng `meta.totalAmount` của sổ thu cùng khoảng ngày). `receivables` bằng tổng của màn Công nợ (cùng truy vấn). `rooms` = phòng chưa lưu trữ theo trạng thái hôm nay; `occupancy` tính tại ngày cuối kỳ (hoặc hôm nay nếu kỳ chưa hết), `rate` = đang thuê / tổng phòng. `todos` luôn đủ 7 mục theo lịch tháng (kể cả 0): `readings` (phòng còn thiếu chỉ số điện hoặc nước tháng M−1, `total` = số phòng cần chốt), `invoices_to_create` (hợp đồng tính tiền được trong M chưa có hoá đơn kỳ/nhận phòng không void), `draft_invoices`, `unshared_invoices` (đã phát hành, còn nợ, không có link còn hạn), `overdue_invoices` (`amount` = tiền quá hạn; mở nhóm quá hạn nặng nhất), `expiring_contracts` (hết hạn trong 30 ngày), `ending_contracts` (đã báo trả phòng). Mỗi mục có `link` `{ path, query }` tới màn xử lý. Toà ngoài phạm vi trả 404.
     *
     *     **Quyền:** `read:Report`.
     */
    get: operations['get_api_buildings_buildingId_overview'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/buildings/{buildingId}/readings': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chỉ số điện nước toàn toà
     * @description Kỳ là tháng tiêu thụ (YYYY-MM). `readOnFrom`/`readOnTo` là khoảng ngày đọc hợp lệ theo kỳ thu của toà (`readingDayMonth`), `readingOn` là ngày chốt số của kỳ. Bao gồm phòng có hợp đồng active/ending, chỉ số trước, tiêu thụ cả hai đoạn khi thay đồng hồ, trung bình tối đa 3 kỳ trước, cảnh báo và trạng thái draft/locked. Ngoài phạm vi quản lý trả 404.
     *
     *     **Quyền:** `read:MeterReading`.
     */
    get: operations['get_api_buildings_buildingId_readings'];
    /**
     * Lưu chỉ số theo dòng
     * @description Mỗi dòng gửi meterId, period, reading, readOn và version (0 khi tạo). `readOn` phải trong tháng tiêu thụ (`same`) hoặc từ ngày 1 của kỳ tới ngày chốt số tháng sau (`next`), sai trả lỗi dòng 422 tại `readOn`. Trả results theo thứ tự đầu vào; dòng lỗi không huỷ dòng hợp lệ. Chỉ số nguyên không âm; số mới nhỏ hơn số cũ bị chặn. Tiêu thụ hơn 2 lần trung bình cần confirmHighConsumption. Version cũ trả lỗi dòng 409; locked không sửa được. Ảnh dùng private upload purpose contract_meter.
     *
     *     **Quyền:** `update:MeterReading`.
     */
    put: operations['put_api_buildings_buildingId_readings'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/buildings/{buildingId}/receivables': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Công nợ của toà
     * @description Mỗi dòng là một hợp đồng có hoá đơn chưa thu đủ (`issued`/`partially_paid`, `total − paidTotal > 0`; nháp và void không tính): mã hợp đồng, phòng hiện tại, người đại diện (`representativePhone` chỉ khi được xem người thuê của toà), số hoá đơn, tổng còn lại, phần quá hạn, hạn cũ nhất, số ngày quá hạn lâu nhất (hôm nay theo Asia/Ho_Chi_Minh so với `dueOn + graceDays` của toà) và nhóm `bucket` (`not_due`, `1_7`, `8_30`, `over_30`), kèm các hoá đơn đó (hạn cũ nhất trước, có `shareExpiresAt`). `q` tìm theo mã phòng, mã hợp đồng, tên hoặc SĐT người ở; lọc `bucket`; `sortBy` `remaining` (mặc định, giảm dần), `overdueDays`, `roomCode`. `meta.totalRemaining`, `meta.overdueRemaining`, `meta.invoiceCount` tính trên toàn bộ bộ lọc trước phân trang và luôn bằng tổng `total − paidTotal` của các hoá đơn được tính; `meta.buckets` đếm theo `q` nhưng không theo `bucket` (cho các chip). Toà ngoài phạm vi trả 404.
     *
     *     **Quyền:** `read:Invoice`.
     */
    get: operations['get_api_buildings_buildingId_receivables'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/buildings/{buildingId}/residents': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách tạm trú
     * @description Người ở của hợp đồng active/ending tại date; fromDate bao gồm, toDate không bao gồm. CCCD đầy đủ chỉ dành cho nhân viên có read Tenant trong toà. Không ghi audit dữ liệu cá nhân.
     *
     *     **Quyền:** `read:Tenant`.
     */
    get: operations['get_api_buildings_buildingId_residents'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/buildings/{buildingId}/residents/export': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Xuất danh sách tạm trú Excel
     * @description read Tenant; 10 lần/phút; ngoài phạm vi trả 404. Audit người xuất, thời điểm, toà, ngày và số dòng; không chứa dữ liệu cá nhân.
     *
     *     **Quyền:** `read:Tenant`.
     */
    post: operations['post_api_buildings_buildingId_residents_export'];
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
  '/api/buildings/{id}/automation': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Cấu hình tự động hoá
     * @description Chỉ toà được phép đọc. Mặc định tắt các job và tắt toàn bộ nhắc người thuê.
     *
     *     **Quyền:** `read:Building`.
     */
    get: operations['get_api_buildings_id_automation'];
    /**
     * Lưu tự động hoá
     * @description manage Building; gửi đủ năm cờ và version (`readingReminderBefore`, `readingReminderDaysBefore` 0–10 bỏ trống = tắt/1 ngày); stale version trả 409, có audit.
     *
     *     **Quyền:** `manage:Building`.
     */
    put: operations['put_api_buildings_id_automation'];
    post?: never;
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
  '/api/contracts': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách hợp đồng
     * @description Lọc theo toà, phòng, trạng thái và expiring=true (hiệu lực, kết thúc trong 30 ngày).
     *
     *     **Quyền:** `read:Contract`.
     */
    get: operations['get_api_contracts'];
    put?: never;
    /**
     * Tạo bản nháp hợp đồng
     * @description **Quyền:** `create:Contract`.
     */
    post: operations['post_api_contracts'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/contracts/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết hợp đồng
     * @description **Quyền:** `read:Contract`.
     */
    get: operations['get_api_contracts_id'];
    /**
     * Sửa bản nháp
     * @description Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`.
     *
     *     **Quyền:** `update:Contract`.
     */
    put: operations['put_api_contracts_id'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/contracts/{id}/activate': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Kích hoạt hợp đồng
     * @description Khoá phòng, kiểm tra người ở và chỉ số, ghi nhận cọc đã thu và tạo hoá đơn nhận phòng nháp (cùng cách tính với move-in-preview).
     *
     *     **Quyền:** `update:Contract`.
     */
    post: operations['post_api_contracts_id_activate'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/contracts/{id}/cancel': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Huỷ bản nháp
     * @description **Quyền:** `update:Contract`.
     */
    post: operations['post_api_contracts_id_cancel'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/contracts/{id}/cancel-notice': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Huỷ báo trả phòng
     * @description ending → active, xoá `noticeDate`. Gia hạn (`/renew`) cũng huỷ báo trả. Chưa báo trả trả 409 `contract_not_ending`. Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`.
     *
     *     **Quyền:** `update:Contract`.
     */
    post: operations['post_api_contracts_id_cancel_notice'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/contracts/{id}/deposits': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Lịch sử bút toán cọc
     * @description **Quyền:** `read:Deposit`.
     */
    get: operations['get_api_contracts_id_deposits'];
    put?: never;
    /**
     * Thêm bút toán cọc
     * @description Bất biến; số dư âm trả 422; applied chỉ dành cho ST-17.
     *
     *     **Quyền:** `manage:Deposit`.
     */
    post: operations['post_api_contracts_id_deposits'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/contracts/{id}/move-in-invoice': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Tạo hoá đơn nhận phòng
     * @description Cho hợp đồng active/ending chưa có hoá đơn nhận phòng (409 `move_in_invoice_exists`) và chưa có hoá đơn kỳ của tháng bắt đầu (409 `period_already_invoiced`). Tạo bản nháp từ cùng cách tính với move-in-preview.
     *
     *     **Quyền:** `create:Invoice`.
     */
    post: operations['post_api_contracts_id_move_in_invoice'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/contracts/{id}/move-in-preview': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Xem trước tiền nhận phòng
     * @description Tính tại server theo ngày bắt đầu, giá toà, số người và xe đăng ký. Không gồm điện nước hay cọc.
     *
     *     **Quyền:** `read:Contract`.
     */
    get: operations['get_api_contracts_id_move_in_preview'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/contracts/{id}/notice': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Báo trả phòng
     * @description active → ending (hoặc đổi ngày khi đang ending). `expectedMoveOutDate` ≥ hôm nay, ≥ ngày bắt đầu và ≤ ngày kết thúc (nếu có), lưu vào `noticeDate`; ghi `note` vào lịch sử hợp đồng (không vào audit). Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`.
     *
     *     **Quyền:** `update:Contract`.
     */
    post: operations['post_api_contracts_id_notice'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/contracts/{id}/occupants': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Thay đổi hợp đồng: occupants
     * @description tenantId OR inline fullName + phone (10 digits starting 0). Enforces room maxOccupants. Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`. Chỉ active/ending. effectiveDate trong thời hạn hợp đồng. preview=true kiểm tra cùng quy tắc nhưng không ghi dữ liệu. Trả ảnh hưởng hoá đơn theo ngày phát hành; cảnh báo kỳ đã phát hành để điều chỉnh kỳ sau. Room change giữ chỉ số cuối phòng cũ cho ST-14. toDate là ngày rời đi (exclusive).
     *
     *     **Quyền:** `update:Contract`.
     */
    post: operations['post_api_contracts_id_occupants'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/contracts/{id}/occupants/{occupantId}/leave': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Thay đổi hợp đồng: occupants/{occupantId}/leave
     * @description occupantId is the tenantId from the contract occupant DTO. newPrimaryTenantId required when the primary leaves. Last occupant cannot leave. Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`. Chỉ active/ending. effectiveDate trong thời hạn hợp đồng. preview=true kiểm tra cùng quy tắc nhưng không ghi dữ liệu. Trả ảnh hưởng hoá đơn theo ngày phát hành; cảnh báo kỳ đã phát hành để điều chỉnh kỳ sau. Room change giữ chỉ số cuối phòng cũ cho ST-14. toDate là ngày rời đi (exclusive).
     *
     *     **Quyền:** `update:Contract`.
     */
    post: operations['post_api_contracts_id_occupants_occupantId_leave'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/contracts/{id}/portal-links': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Link cổng người thuê của hợp đồng
     * @description Mọi link của hợp đồng (mới nhất trước): người ở, trạng thái `active`/`locked`/`revoked`/`expired`, lần xác minh gần nhất, số thiết bị đang đăng nhập. Không bao giờ trả token hay hash. Ngoài phạm vi trả 404.
     *
     *     **Quyền:** `read:Contract`.
     */
    get: operations['get_api_contracts_id_portal_links'];
    put?: never;
    /**
     * Tạo link cổng cho một người ở
     * @description Hợp đồng active/ending (409 `contract_not_active`), `tenantId` là người ở hiện tại (422 `portal_tenant_not_occupant`). Token ngẫu nhiên 32 byte (base64url), chỉ lưu SHA-256; `token`, `path` (`/p/{token}`) và `url` chỉ trả một lần. Link đang hoạt động của cùng người ở bị thu hồi và các thiết bị của nó bị đăng xuất (`replacedLinkId`). Quyền `update:Contract`; audit chỉ ghi id. Ngoài phạm vi trả 404.
     *
     *     **Quyền:** `update:Contract`.
     */
    post: operations['post_api_contracts_id_portal_links'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/contracts/{id}/renew': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Thay đổi hợp đồng: renew
     * @description endDate (new end date), optional rent from effectiveDate. Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`. Chỉ active/ending. effectiveDate trong thời hạn hợp đồng. preview=true kiểm tra cùng quy tắc nhưng không ghi dữ liệu. Trả ảnh hưởng hoá đơn theo ngày phát hành; cảnh báo kỳ đã phát hành để điều chỉnh kỳ sau. Room change giữ chỉ số cuối phòng cũ cho ST-14. toDate là ngày rời đi (exclusive).
     *
     *     **Quyền:** `update:Contract`.
     */
    post: operations['post_api_contracts_id_renew'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/contracts/{id}/rent-change': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Thay đổi hợp đồng: rent-change
     * @description rent (integer VND). Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`. Chỉ active/ending. effectiveDate trong thời hạn hợp đồng. preview=true kiểm tra cùng quy tắc nhưng không ghi dữ liệu. Trả ảnh hưởng hoá đơn theo ngày phát hành; cảnh báo kỳ đã phát hành để điều chỉnh kỳ sau. Room change giữ chỉ số cuối phòng cũ cho ST-14. toDate là ngày rời đi (exclusive).
     *
     *     **Quyền:** `update:Contract`.
     */
    post: operations['post_api_contracts_id_rent_change'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/contracts/{id}/room-change': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Thay đổi hợp đồng: room-change
     * @description roomId (same building), rent, closingElectric, closingWater, initialElectric, initialWater (nonnegative integers). Occupied/maintenance target: 409. Lower readings: 422. Room moves are recorded in increasing effective-date order. Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`. Chỉ active/ending. effectiveDate trong thời hạn hợp đồng. preview=true kiểm tra cùng quy tắc nhưng không ghi dữ liệu. Trả ảnh hưởng hoá đơn theo ngày phát hành; cảnh báo kỳ đã phát hành để điều chỉnh kỳ sau. Room change giữ chỉ số cuối phòng cũ cho ST-14. toDate là ngày rời đi (exclusive).
     *
     *     **Quyền:** `update:Contract`.
     */
    post: operations['post_api_contracts_id_room_change'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/contracts/{id}/services': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Thay đổi hợp đồng: services
     * @description serviceId, enabled=true (on) / false (off). Active definitions only. Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`. Chỉ active/ending. effectiveDate trong thời hạn hợp đồng. preview=true kiểm tra cùng quy tắc nhưng không ghi dữ liệu. Trả ảnh hưởng hoá đơn theo ngày phát hành; cảnh báo kỳ đã phát hành để điều chỉnh kỳ sau. Room change giữ chỉ số cuối phòng cũ cho ST-14. toDate là ngày rời đi (exclusive).
     *
     *     **Quyền:** `update:Contract`.
     */
    post: operations['post_api_contracts_id_services'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/contracts/{id}/settle': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Thanh lý hợp đồng
     * @description Chỉ chủ trọ (`settle:Contract`). Một transaction: khoá hợp đồng, phòng, hoá đơn; từ chối khi còn hoá đơn nháp (409 `contract_has_draft_invoices` kèm danh sách); tạo và phát hành hoá đơn `settlement` (khoá chỉ số đã dùng); cọc ghi thành thanh toán phương thức `deposit` trên đúng hoá đơn được trả (nợ cũ trước, rồi hoá đơn thanh lý) kèm bút toán cọc `applied`; phần còn lại hoàn bằng bút toán `refunded` (`refundMethod`, ngày hôm nay); cọc không đủ thì phần thiếu còn nợ trên hoá đơn; hợp đồng → ended (`movedOutAt`), người ở/xe/dịch vụ kết thúc từ ngày sau ngày trả phòng, phòng về trống. Số liệu trùng với bản xem trước. Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`.
     *
     *     **Quyền:** `settle:Contract`.
     */
    post: operations['post_api_contracts_id_settle'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/contracts/{id}/settlement-preview': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Xem trước thanh lý
     * @description Không ghi dữ liệu; cùng phép tính với `/settle` (`computeSettlement` + `allocateSettlementDeposit` của `@stay/billing`). Điện nước từ chỉ số đã khoá gần nhất (hoặc chỉ số nhận phòng/đổi phòng) tới chỉ số cuối; tiền phòng/dịch vụ những ngày đã ở chưa có hoá đơn; hoàn tiền ngày chưa ở khi toà bật `refundUnusedRent`; phụ thu (không gửi `surcharges` → tự thêm dòng "Khấu hao cơ sở vật chất" bằng `moveOutFee` của toà, 0 = không thêm; gửi mảng, kể cả rỗng, → dùng đúng danh sách đó); nợ cũ (chỉ liệt kê); cọc đang giữ → `ownerRefunds` (chủ trọ hoàn) hoặc `tenantPays` (người thuê trả thêm). Đơn giá và số người/xe lấy tại ngày trả phòng. 409 `contract_has_draft_invoices` kèm `extensions.invoices` khi còn hoá đơn nháp; 409 `reading_after_move_out` khi đã có chỉ số sau ngày trả phòng; 422 lỗi field cho ngày/chỉ số.
     *
     *     **Quyền:** `read:Contract`.
     */
    post: operations['post_api_contracts_id_settlement_preview'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/contracts/{id}/vehicles': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Thay đổi hợp đồng: vehicles
     * @description vehicleId, enabled=true (add) / false (remove). Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`. Chỉ active/ending. effectiveDate trong thời hạn hợp đồng. preview=true kiểm tra cùng quy tắc nhưng không ghi dữ liệu. Trả ảnh hưởng hoá đơn theo ngày phát hành; cảnh báo kỳ đã phát hành để điều chỉnh kỳ sau. Room change giữ chỉ số cuối phòng cũ cho ST-14. toDate là ngày rời đi (exclusive).
     *
     *     **Quyền:** `update:Contract`.
     */
    post: operations['post_api_contracts_id_vehicles'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/deposits': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Sổ cọc
     * @description Tổng theo toàn bộ bộ lọc trước phân trang.
     *
     *     **Quyền:** `read:Deposit`.
     */
    get: operations['get_api_deposits'];
    put?: never;
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
  '/api/invoices': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách hoá đơn
     * @description Lọc buildingId, period, kind, status, roomId, contractId, overdue=true|false (quá hạn suy ra: issued/partially_paid, quá `dueOn + graceDays` của toà theo Asia/Ho_Chi_Minh, còn nợ; `overdueFrom` là ngày đầu tiên quá hạn). `q` tìm theo mã hoá đơn hoặc mã phòng. Người thuê chỉ thấy hoá đơn đã phát hành của hợp đồng mình.
     *
     *     **Quyền:** `read:Invoice`.
     */
    get: operations['get_api_invoices'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/invoices/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết hoá đơn
     * @description Kèm các dòng snapshot (đơn giá, tỷ lệ ngày, chỉ số đầu/cuối, dòng làm tròn); tổng các dòng luôn bằng `total`. `payments`: lịch sử thu (mới nhất trước, gồm cả bút toán đã huỷ). Ngoài phạm vi trả 404.
     *
     *     **Quyền:** `read:Invoice`.
     */
    get: operations['get_api_invoices_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/invoices/{id}/lines': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Thêm phụ thu/giảm trừ
     * @description Chỉ bản nháp (409 `invoice_not_draft`). `amount` > 0; giảm trừ lưu âm. `reason` bắt buộc. Dòng làm tròn và tổng được tính lại. `version` tuỳ chọn: lệch trả 409 `version_conflict`.
     *
     *     **Quyền:** `update:Invoice`.
     */
    post: operations['post_api_invoices_id_lines'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/invoices/{id}/lines/{lineId}': {
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
     * Xoá dòng thêm tay
     * @description Chỉ bản nháp và dòng `manual` (409 `invoice_line_not_manual`). Dòng làm tròn và tổng được tính lại.
     *
     *     **Quyền:** `update:Invoice`.
     */
    delete: operations['delete_api_invoices_id_lines_lineId'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/invoices/{id}/payments': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Thu tiền hoá đơn
     * @description Bắt buộc `Idempotency-Key`: gọi lại cùng key và nội dung trả lại đúng khoản đã ghi, không ghi hai lần (khác nội dung trả 409 `idempotency_conflict`). Khoá dòng hoá đơn nên hai khoản thu song song không vượt tổng. Chỉ hoá đơn đã phát hành chưa thu đủ: nháp 409 `invoice_not_issued`, void 409 `invoice_void`, đã thu đủ 409 `invoice_already_paid`. `amount` > 0 và ≤ số còn lại (vượt trả 422 `payment_exceeds_remaining`, `extensions.remaining`; không tự ghi thừa). `paidOn` không sau hôm nay (Asia/Ho_Chi_Minh). Cập nhật `paidTotal` và trạng thái (`issued` → `partially_paid` → `paid`) trong cùng transaction. Ngoài phạm vi trả 404.
     *
     *     **Quyền:** `create:Payment`.
     */
    post: operations['post_api_invoices_id_payments'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/invoices/{id}/share': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Tạo/làm mới link chia sẻ hoá đơn
     * @description Chỉ hoá đơn đã phát hành (`issued`, `partially_paid`, `paid`); nháp/void trả 409 `invoice_not_shareable`. Tạo token ngẫu nhiên (32 byte, base64url) hạn 60 ngày; chỉ lưu SHA-256 của token. Token và `url` (`/i/{token}` trên web) chỉ trả về một lần; gọi lại tạo token mới và link cũ hết hiệu lực. Quyền `update:Invoice` (người quản lý trong toà được gán). Audit không chứa token. Ngoài phạm vi trả 404.
     *
     *     **Quyền:** `update:Invoice`.
     */
    post: operations['post_api_invoices_id_share'];
    /**
     * Thu hồi link chia sẻ hoá đơn
     * @description Xoá hash và hạn của link: trang công khai trả 404. Gọi lại khi không còn link trả `revoked: false`. Ngoài phạm vi trả 404.
     *
     *     **Quyền:** `update:Invoice`.
     */
    delete: operations['delete_api_invoices_id_share'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/invoices/{id}/void': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Void hoá đơn
     * @description Chỉ chủ trọ. Bản nháp hoặc hoá đơn đã phát hành chưa có thanh toán (`paidTotal = 0`, ngược lại 409 `invoice_has_payments`; huỷ hết bút toán thu thì void được); `reason` bắt buộc. Mở khoá chỉ số không còn hoá đơn phát hành nào dùng; kỳ được lập lại bản nháp mới.
     *
     *     **Quyền:** `void:Invoice`.
     */
    post: operations['post_api_invoices_id_void'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/invoices/issue': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Phát hành hoá đơn
     * @description Gửi `ids` (1–400 bản nháp). Trong một transaction: khoá phòng, cấp mã `{mã toà}-{YYYYMM}-{nnn}` từ `invoice_sequences` (khoá dòng, không trùng khi phát hành song song; nhận phòng/thanh lý dùng kỳ của ngày phát hành), đặt `issuedOn`/`dueOn` theo kỳ thu của toà/hệ thống, khoá chỉ số đã dùng. 409 `invoice_not_draft`, `invoice_readings_changed` (chỉ số đổi sau khi tạo nháp: làm mới trước), `invoice_sequence_exhausted`.
     *
     *     **Quyền:** `issue:Invoice`.
     */
    post: operations['post_api_invoices_issue'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/maintenance': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh sách bảo trì theo toà/phòng/trạng thái/nguồn
     * @description **Quyền:** `read:Maintenance`.
     */
    get: operations['get_api_maintenance'];
    put?: never;
    /**
     * Tạo việc bảo trì
     * @description create Maintenance trong toà; nguồn owner, trạng thái open.
     *
     *     **Quyền:** `create:Maintenance`.
     */
    post: operations['post_api_maintenance'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/maintenance/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết bảo trì, ảnh, lịch sử và chi phí
     * @description **Quyền:** `read:Maintenance`.
     */
    get: operations['get_api_maintenance_id'];
    /**
     * Sửa việc bảo trì
     * @description update Maintenance trong toà. new → open → in_progress → done/cancelled; sai thứ tự hoặc version cũ trả 409.
     *
     *     **Quyền:** `update:Maintenance`.
     */
    put: operations['put_api_maintenance_id'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/maintenance/{id}/expense': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Ghi chi phí sửa chữa
     * @description update Maintenance và create Expense trong toà. Một khoản chi mỗi việc; trùng trả 409. Toà/phòng lấy từ việc.
     *
     *     **Quyền:** `update:Maintenance`.
     */
    post: operations['post_api_maintenance_id_expense'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/maintenance/expense-categories': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Danh mục chi phí cho bảo trì
     * @description **Quyền:** `read:Maintenance`.
     */
    get: operations['get_api_maintenance_expense_categories'];
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
  '/api/me/notification-settings': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Cài đặt nhận thông báo
     * @description Kênh email/trình duyệt và nhóm sự kiện bị tắt của người dùng hiện tại (mặc định bật hết), kèm `emailAvailable`, `pushPublicKey` (VAPID, null khi chưa cấu hình) và số thiết bị đã đăng ký.
     *
     *     **Yêu cầu đăng nhập.**
     */
    get: operations['get_api_me_notification_settings'];
    /**
     * Lưu cài đặt nhận thông báo
     * @description `{ email, push, mutedGroups }`. Thông báo trong ứng dụng luôn được ghi; cài đặt chỉ áp dụng cho email và thông báo trình duyệt. Có audit.
     *
     *     **Yêu cầu đăng nhập.**
     */
    put: operations['put_api_me_notification_settings'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/me/push-subscriptions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Đăng ký thông báo trình duyệt
     * @description `PushSubscription.toJSON()` của trình duyệt. Endpoint phải thuộc dịch vụ push của trình duyệt (HTTPS). Idempotent theo endpoint; cùng trình duyệt đăng nhập người khác thì chuyển sang người đó.
     *
     *     **Yêu cầu đăng nhập.**
     */
    post: operations['post_api_me_push_subscriptions'];
    /**
     * Huỷ đăng ký thông báo trình duyệt
     * @description `{ endpoint }`; chỉ xoá endpoint của chính người dùng. Không có thì không làm gì.
     *
     *     **Yêu cầu đăng nhập.**
     */
    delete: operations['delete_api_me_push_subscriptions'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/members': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Người quản lý theo toà
     * @description **Quyền:** `manage:Member`.
     */
    get: operations['get_api_members'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/members/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /**
     * Gán toà và quyền
     * @description Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`.
     *
     *     **Quyền:** `manage:Member`.
     */
    put: operations['put_api_members_id'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/members/{id}/disable': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Khoá người quản lý và thu hồi mọi phiên
     * @description **Quyền:** `manage:Member`.
     */
    post: operations['post_api_members_id_disable'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/members/invitations': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Mời người quản lý
     * @description Tạo tài khoản và xếp lời mời vào outbox; không nâng quyền tài khoản đã tồn tại.
     *
     *     **Quyền:** `manage:Member`.
     */
    post: operations['post_api_members_invitations'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/meters/{id}/replace': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Thay đồng hồ
     * @description Đóng đồng hồ cũ bằng finalReading và replacedOn, mở đồng hồ cùng loại với initialReading và serial mới. Giữ lịch sử để tính hai đoạn trong kỳ thay. Idempotency-Key tuỳ chọn; retry cùng nội dung trả cùng id đồng hồ mới.
     *
     *     **Quyền:** `update:MeterReading`.
     */
    post: operations['post_api_meters_id_replace'];
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
     * Thông báo nhân viên
     * @description 50 thông báo mới nhất trong các toà được phép đọc; unreadCount tính tất cả. Đã đọc riêng từng người.
     *
     *     **Quyền:** `read:Building`.
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
     * Đánh dấu đã đọc
     * @description Idempotent, chỉ trong toà được phép đọc; có audit.
     *
     *     **Quyền:** `read:Building`.
     */
    post: operations['post_api_notifications_id_read'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/notifications/stream': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Luồng thông báo (SSE)
     * @description Server-Sent Events của thông báo nhân viên mới trong các toà được phép đọc (đánh thức bằng Postgres NOTIFY sau commit). Client giữ polling `GET /api/notifications` làm dự phòng.
     *
     *     **Quyền:** `read:Building`.
     */
    get: operations['get_api_notifications_stream'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/payment-claims/{id}/confirm': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Xác nhận chuyển khoản
     * @description Tạo khoản thu ST-15 (`bank_transfer`, mã giao dịch từ báo chuyển khoản) cho hoá đơn và đánh dấu `confirmed` trong cùng transaction; khoá báo chuyển khoản trước nên bấm lại/gọi đồng thời trả cùng khoản thu, không ghi hai lần. Có thể sửa `amount`, `paidOn`, `reference` khi xác nhận (số tiền vượt số còn lại → 422 `payment_exceeds_remaining`). Đã từ chối/huỷ → 409 `request_not_pending`. Quyền `create:Payment` theo toà.
     *
     *     **Quyền:** `create:Payment`.
     */
    post: operations['post_api_payment_claims_id_confirm'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/payment-claims/{id}/reject': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Từ chối báo chuyển khoản
     * @description `reason` bắt buộc (người thuê thấy lý do); hoá đơn không đổi. Chỉ khi `pending`.
     *
     *     **Quyền:** `create:Payment`.
     */
    post: operations['post_api_payment_claims_id_reject'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/payments': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Sổ thu
     * @description Lọc `buildingId`, `dateFrom`/`dateTo` (ngày thu, gồm cả hai đầu), `method`, `invoiceId`; `q` tìm theo mã hoá đơn, mã phòng hoặc mã giao dịch. Khoản đã huỷ chỉ hiện khi `includeReversed=true`. `meta.totals` (theo phương thức) và `meta.totalAmount` tính trên toàn bộ bộ lọc trước phân trang và không gồm khoản đã huỷ. Người quản lý chỉ thấy toà được gán; `buildingId` ngoài phạm vi trả 404.
     *
     *     **Quyền:** `read:Payment`.
     */
    get: operations['get_api_payments'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/payments/{id}/reverse': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Huỷ bút toán thu
     * @description Thanh toán không sửa/xoá: ghi `reversedAt`, `reverseReason` (bắt buộc), người huỷ. Mỗi khoản chỉ huỷ một lần (409 `payment_already_reversed`). `paidTotal` và trạng thái hoá đơn tính lại từ các khoản còn lại. Quyền `void:Payment` (mặc định chỉ chủ trọ). Ngoài phạm vi trả 404.
     *
     *     **Quyền:** `void:Payment`.
     */
    post: operations['post_api_payments_id_reverse'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/portal-links/{id}': {
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
     * Thu hồi link cổng người thuê
     * @description Idempotent (`revoked: false` khi đã thu hồi). Xoá mọi phiên cổng của link: mọi thiết bị đã vào bị đăng xuất. Quyền `update:Contract`; link ngoài phạm vi trả 404.
     *
     *     **Quyền:** `update:Contract`.
     */
    delete: operations['delete_api_portal_links_id'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/portal/contract': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Hợp đồng của tôi (chỉ xem)
     * @description Phòng, thời hạn, giá thuê hiện tại, dịch vụ và đơn giá đang áp dụng, người ở cùng (chỉ tên viết tắt), xe (biển số xe người khác bị che), cọc đang giữ, ngày phát hành/hạn thanh toán hằng tháng.
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    get: operations['get_api_portal_contract'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/portal/invoices': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Hoá đơn của tôi
     * @description Hoá đơn đã phát hành (gồm thu một phần/đã thu) của hợp đồng, mới nhất trước. Không có nháp hay void.
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    get: operations['get_api_portal_invoices'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/portal/invoices/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Chi tiết hoá đơn và thanh toán
     * @description Như hoá đơn công khai (dòng, tổng, tài khoản nhận tiền, `vietQrPayload` cho số còn lại) kèm `id` và lịch sử thanh toán chưa huỷ (không có mã giao dịch, ghi chú hay người thu). Hoá đơn của hợp đồng khác, nháp hoặc void → 404.
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    get: operations['get_api_portal_invoices_id'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/portal/invoices/{id}/payment-claims': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Tôi đã chuyển khoản
     * @description Người thuê báo đã chuyển khoản cho hoá đơn đã phát hành của hợp đồng mình: `amount` 1 … số còn lại (vượt trả 422 `payment_exceeds_remaining`, `extensions.remaining`), `paidOn` không sau hôm nay, `receiptFileId` là ảnh `payment_receipt` tải lên qua `POST /api/portal/uploads` của chính link. Mỗi hoá đơn chỉ một báo chuyển khoản đang chờ (409 `payment_claim_pending`); đã thu đủ 409 `invoice_already_paid`. `Idempotency-Key` (tuỳ chọn): gửi lại cùng key và nội dung trả lại cùng báo chuyển khoản, khác nội dung 409 `idempotency_conflict`. Không ghi sổ thu: chủ trọ xác nhận ở `POST /api/payment-claims/{id}/confirm`. Hoá đơn của hợp đồng khác → 404.
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    post: operations['post_api_portal_invoices_id_payment_claims'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/portal/links/lookup': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Xem link cổng trước khi xác minh
     * @description Công khai, giới hạn theo IP. Trả phòng, tên toà và `signedIn` (thiết bị đã có phiên cổng của link này). Link không đúng, đã thu hồi, hết hạn (hợp đồng kết thúc quá 30 ngày, đã huỷ hoặc người ở đã rời) → 404 `portal_link_invalid`, không phân biệt lý do. Không ghi dữ liệu.
     *
     *     **Công khai.**
     */
    post: operations['post_api_portal_links_lookup'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/portal/maintenance': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Báo hỏng của phòng
     * @description Báo hỏng của hợp đồng (mới nhất trước, tối đa 100): trạng thái, trả lời của chủ trọ, ảnh (URL ký ngắn hạn), `isOwn`.
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    get: operations['get_api_portal_maintenance'];
    put?: never;
    /**
     * Gửi báo hỏng
     * @description Hạng mục `electricity`/`water`/`appliance`/`other`, mức độ `normal`/`urgent`, tiêu đề, mô tả, tối đa 5 ảnh `maintenance_photo` của chính link. Hợp đồng phải active/ending (409 `contract_not_active`). Giới hạn 10 báo hỏng/ngày/hợp đồng (429 `rate_limit_exceeded`).
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    post: operations['post_api_portal_maintenance'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/portal/maintenance/{id}/cancel': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Huỷ báo hỏng
     * @description Chỉ người gửi, khi chủ trọ chưa nhận xử lý (`new`, 409 `request_not_pending`). Của hợp đồng/người khác → 404.
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    post: operations['post_api_portal_maintenance_id_cancel'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/portal/me': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Trang chủ người thuê
     * @description Tên của chính người ở, phòng, toà, SĐT liên hệ, hoá đơn gần nhất đã phát hành, tổng nợ, nợ các hoá đơn khác và thông báo ghim còn hạn của toà/phòng.
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    get: operations['get_api_portal_me'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/portal/notices': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Thông báo và nội quy
     * @description Thông báo còn hạn của toà (cả toà hoặc phòng của hợp đồng), ghim trước rồi mới nhất; nội quy và SĐT liên hệ của toà.
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    get: operations['get_api_portal_notices'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/portal/notification-settings': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Cài đặt nhận thông báo (người thuê)
     * @description Như `/api/me/notification-settings`, theo người thuê của phiên. Email chỉ gửi khi hồ sơ có email.
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    get: operations['get_api_portal_notification_settings'];
    /**
     * Lưu cài đặt nhận thông báo (người thuê)
     * @description Có audit.
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    put: operations['put_api_portal_notification_settings'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/portal/notifications': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Thông báo của người thuê
     * @description 50 thông báo mới nhất của hợp đồng trong phiên (cả hợp đồng hoặc riêng người ở này) và `unreadCount`.
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    get: operations['get_api_portal_notifications'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/portal/notifications/{id}/read': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Người thuê đánh dấu đã đọc
     * @description Idempotent; thông báo của hợp đồng khác → 404.
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    post: operations['post_api_portal_notifications_id_read'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/portal/notifications/stream': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Luồng thông báo người thuê (SSE)
     * @description Server-Sent Events chỉ của hợp đồng trong phiên cổng; không bao giờ nhận thông báo của hợp đồng/người khác.
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    get: operations['get_api_portal_notifications_stream'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/portal/payment-claims/{id}/cancel': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Huỷ báo chuyển khoản
     * @description Chỉ người gửi, khi còn `pending` (409 `request_not_pending`). Của hợp đồng/người khác → 404.
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    post: operations['post_api_portal_payment_claims_id_cancel'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/portal/push-subscriptions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Người thuê đăng ký thông báo trình duyệt
     * @description Gắn với link cổng của phiên: thu hồi link thì dừng gửi, xoá link thì xoá đăng ký.
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    post: operations['post_api_portal_push_subscriptions'];
    /**
     * Người thuê huỷ đăng ký thông báo trình duyệt
     * @description `{ endpoint }` của link trong phiên.
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    delete: operations['delete_api_portal_push_subscriptions'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/portal/requests': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Yêu cầu của tôi
     * @description Yêu cầu do chính người ở này gửi (mới nhất trước, tối đa 100): loại, nội dung, trạng thái `new`/`accepted`/`rejected`/`cancelled`, trả lời hoặc lý do từ chối.
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    get: operations['get_api_portal_requests'];
    put?: never;
    /**
     * Gửi yêu cầu cho chủ trọ
     * @description `type` và `payload` theo loại: `move_out` `{ expectedMoveOutDate ≥ hôm nay, reason? }`, `add_occupant` `{ fullName, phone (10 số, bắt đầu 0), fromDate }`, `remove_occupant` `{ fullName, toDate }`, `add_vehicle` `{ plate, vehicleType, fromDate }`, `remove_vehicle` `{ plate, toDate }`, `other` `{ message }`. Ngày phải trong thời hạn hợp đồng; lỗi field trả dạng `payload.<field>`. Hợp đồng active/ending (409 `contract_not_active`). Chỉ là đề nghị: hợp đồng chỉ đổi khi chủ trọ duyệt. Giới hạn 10 yêu cầu/ngày/hợp đồng.
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    post: operations['post_api_portal_requests'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/portal/requests/{id}/cancel': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Huỷ yêu cầu
     * @description Chỉ yêu cầu của chính mình còn `new` (409 `request_not_pending`). Của hợp đồng/người khác → 404.
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    post: operations['post_api_portal_requests_id_cancel'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/portal/sessions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Vào cổng người thuê (4 số cuối SĐT)
     * @description Công khai; giới hạn theo IP và theo token. So sánh 4 số cuối SĐT của chính người ở (constant-time). Link sai/thu hồi/hết hạn và sai số đều trả cùng 401 `portal_verification_failed`. Sai 5 lần liên tiếp → khoá link 15 phút (429 `portal_link_locked`, `Retry-After`, `extensions.retryAfterSeconds`). Thành công: đặt cookie HttpOnly `stay_portal_session` (SameSite=Lax, path `/api/portal`, Secure ở production, 90 ngày), chỉ lưu SHA-256 của giá trị cookie; ghi lần mở gần nhất.
     *
     *     **Công khai.**
     */
    post: operations['post_api_portal_sessions'];
    /**
     * Đăng xuất cổng người thuê
     * @description Xoá phiên cổng của thiết bị này và xoá cookie. Không có phiên hợp lệ → 401 `portal_session_invalid`. Ghi qua cookie cần origin web được phép.
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    delete: operations['delete_api_portal_sessions'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/portal/uploads': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Xin ticket tải ảnh (cổng người thuê)
     * @description `purpose` `payment_receipt` (biên lai) hoặc `maintenance_photo` (ảnh báo hỏng). Ticket 10 phút, thuộc link cổng (không phải tài khoản nhân viên), ảnh JPG/PNG/WEBP ≤ 10 MB gửi thẳng tới `uploadUrl`. Giới hạn 60 ticket/ngày/hợp đồng.
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    post: operations['post_api_portal_uploads'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/portal/uploads/{id}/complete': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Hoàn tất tải ảnh (cổng người thuê)
     * @description Kiểm tra ảnh đã lưu và trả `fileId` để gắn vào báo chuyển khoản/báo hỏng. Ticket của link khác → 404.
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    post: operations['post_api_portal_uploads_id_complete'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/portal/usage': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Điện nước của tôi
     * @description Tối đa 12 tháng tiêu thụ gần nhất (cũ trước) từ dòng điện/nước của hoá đơn đã phát hành: chỉ số đầu/cuối, tiêu thụ, đơn giá, thành tiền.
     *
     *     **Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).
     */
    get: operations['get_api_portal_usage'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/public/invoices/{token}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Hoá đơn công khai qua link chia sẻ
     * @description Không cần đăng nhập, giới hạn 60 yêu cầu/phút mỗi IP. Token không tồn tại, hết hạn, đã thu hồi/làm mới, hoặc hoá đơn void → 404. Dữ liệu tối giản: toà (tên, địa chỉ), phòng, kỳ, loại, mã, trạng thái, ngày phát hành/hạn, các dòng (mô tả i18n, số tiền, chỉ số), tổng, đã thu, còn lại, tên người đại diện viết tắt, tài khoản nhận tiền và `vietQrPayload` (VietQR NAPAS cho số còn lại, nội dung theo mẫu hệ thống với mã hoá đơn; `null` khi đã thu đủ hoặc toà chưa có tài khoản). Không có SĐT, CCCD, ghi chú hay id nội bộ.
     *
     *     **Công khai.**
     */
    get: operations['get_api_public_invoices_token'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/readings/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /**
     * Sửa chỉ số draft
     * @description Gửi đủ dữ liệu chỉ số và version; meterId/period không được đổi. 409 khi stale hoặc locked.
     *
     *     **Quyền:** `update:MeterReading`.
     */
    put: operations['put_api_readings_id'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/reports/exports': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Xuất sổ Excel
     * @description XLSX nhị phân, attachment. Tối đa 24 tháng; 5 lần/phút. Hoá đơn và công nợ theo kỳ hoá đơn (công nợ hiện tại của kỳ); sổ thu theo ngày thu; chi phí theo kỳ chi. Chỉ đọc, không ghi audit changes.
     *
     *     **Quyền:** `read:Report`.
     */
    post: operations['post_api_reports_exports'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/reports/revenue': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Doanh thu, chi phí và lãi/lỗ
     * @description Phải thu theo kỳ hoá đơn; đã thu theo ngày thu thực tế (gồm deposit); bỏ nháp, void và thanh toán huỷ. Khoảng tối đa 24 tháng. Chỉ đọc; ngoài phạm vi quản lý trả 404.
     *
     *     **Quyền:** `read:Report`.
     */
    get: operations['get_api_reports_revenue'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/reports/rooms': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Báo cáo theo phòng
     * @description Cả năm; số ngày ở tính cả ngày nhận và trả phòng, theo lịch sử chuyển phòng.
     *
     *     **Quyền:** `read:Report`.
     */
    get: operations['get_api_reports_rooms'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/reports/utilities': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Báo cáo điện nước
     * @description Theo kỳ tiêu thụ của dòng hoá đơn. Danh mục Điện tổng / Nước tổng khớp tên sau trim, không phân biệt hoa thường; Điện nước tổng được báo riêng. Hao hụt tiền = (chi − phải thu) / chi × 100; null khi không có chi.
     *
     *     **Quyền:** `read:Report`.
     */
    get: operations['get_api_reports_utilities'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/requests': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Hộp yêu cầu từ người thuê
     * @description Báo hỏng (nguồn người thuê), yêu cầu và báo chuyển khoản trong một danh sách, mới nhất trước. Lọc `kind` (`maintenance`, `tenant_request`, `payment_claim`), `status` chung (`pending`, `in_progress`, `done`, `rejected`, `cancelled`), `buildingId`, `contractId` (tab Yêu cầu của hợp đồng), `q` (mã phòng, mã hợp đồng, tên người gửi, tiêu đề, mã hoá đơn). `meta.counts` đếm mọi trạng thái (kể cả 0) theo bộ lọc trừ `status`. Báo hỏng/yêu cầu cần quyền `read:Maintenance`, báo chuyển khoản `read:Payment` theo toà; toà/hợp đồng ngoài phạm vi trả 404. Ảnh trả URL ký ngắn hạn.
     *
     *     **Quyền:** `read:Maintenance`.
     */
    get: operations['get_api_requests'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/requests/{id}/accept': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Duyệt yêu cầu / nhận xử lý báo hỏng
     * @description Báo hỏng: `new`/`open`/`in_progress` → `in_progress` (hoặc `done` khi `done: true`). Yêu cầu (`new`): chạy đúng thao tác hợp đồng trong cùng transaction — `move_out` → báo trả phòng ST-17 (hợp đồng `ending`), `add_occupant` → thêm người ở ST-12 từ ngày hiệu lực, `remove_occupant` → người ở rời đi (`tenantId` chọn người ở nếu tên không khớp đúng một người; `newPrimaryTenantId` khi người đại diện rời đi), `add_vehicle` → tạo xe của người gửi (nếu chưa có) và đăng ký tính phí, `remove_vehicle` → bớt xe (`vehicleId` nếu biển số không khớp), `other` → chỉ đánh dấu đã duyệt. `effectiveDate` ghi đè ngày trong yêu cầu. Lỗi kiểm tra của ST-12/ST-17 (422/409) huỷ toàn bộ, yêu cầu vẫn `new`. Đã xử lý → 409 `request_not_pending`. Quyền `update:Maintenance` theo toà và `update:Contract`.
     *
     *     **Quyền:** `update:Maintenance`.
     */
    post: operations['post_api_requests_id_accept'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/requests/{id}/reject': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Từ chối yêu cầu / báo hỏng
     * @description `reason` bắt buộc; người thuê thấy lý do. Chỉ khi chưa đóng (409 `request_not_pending`). Audit không ghi lý do.
     *
     *     **Quyền:** `update:Maintenance`.
     */
    post: operations['post_api_requests_id_reject'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/requests/{id}/reply': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Trả lời người thuê
     * @description Ghi đè trả lời gần nhất (người thuê thấy ở T-08/T-09), không đổi trạng thái. Yêu cầu đã huỷ → 409 `request_not_pending`.
     *
     *     **Quyền:** `update:Maintenance`.
     */
    post: operations['post_api_requests_id_reply'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/resident-stays/{id}/registration': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Đánh dấu đã khai báo
     * @description manage Tenant; id là contract_occupants.id. Ngày từ ngày đến tới hôm nay; audit chỉ chứa id, toà và trạng thái.
     *
     *     **Quyền:** `manage:Tenant`.
     */
    post: operations['post_api_resident_stays_id_registration'];
    /**
     * Bỏ đánh dấu khai báo
     * @description manage Tenant; chỉ cập nhật lần ở này.
     *
     *     **Quyền:** `manage:Tenant`.
     */
    delete: operations['delete_api_resident_stays_id_registration'];
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
     * @description Tên không trùng (không phân biệt hoa thường); `description` tuỳ chọn, tối đa 500 ký tự, được chụp vào dòng hoá đơn (`meta.serviceDescription`) khi lập bản nháp; đơn giá số nguyên VND ≥ 0. Chỉ một dịch vụ `electricity` và một `water` đang bật. `code` sinh từ tên; `kind` không đổi được sau khi tạo.
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
     * @description Sửa tên, mô tả (`description`), đơn vị, đơn giá mặc định, thứ tự, bật/tắt. Hoá đơn đã phát hành giữ mô tả đã chụp. Không xoá dịch vụ: chỉ tắt. Đổi giá không ảnh hưởng hoá đơn đã phát hành. Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`.
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
     * @description Ngày chốt số và tháng chốt số (`readingDayMonth`), ngày phát hành, hạn thanh toán, số ngày ân hạn trước khi tính quá hạn (`graceDays`), đơn vị làm tròn, hoàn tiền phòng và mẫu nội dung chuyển khoản. Toà để trống trường nào thì theo giá trị ở đây.
     *
     *     **Quyền:** `read:Settings`.
     */
    get: operations['get_api_settings'];
    /**
     * Cập nhật kỳ thu mặc định
     * @description Ngày trong tháng `1`–`28`, hoặc `31` = cuối tháng. Hạn thanh toán phải ≥ ngày phát hành. `readingDayMonth`: `same` = ngày chốt số thuộc tháng tiêu thụ M−1, `next` = thuộc tháng M (khi đó ngày chốt số ≤ ngày phát hành, 422 `reading_after_issue`). `graceDays` 0–31: hoá đơn chỉ tính quá hạn sau `dueOn + graceDays`. Làm tròn 1, 100 hoặc 1.000đ. Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`.
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
    AddOccupantRequestPayload: {
      fromDate: string;
      fullName: string;
      phone: string;
    };
    AddVehicleRequestPayload: {
      fromDate: string;
      plate: string;
      /** @enum {string} */
      vehicleType: 'bicycle' | 'car' | 'electric_bike' | 'motorbike' | 'other';
    };
    AnnouncementDeleteResult: {
      deleted: boolean;
      id: string;
    };
    AnnouncementInput: {
      body: string;
      buildingId: string;
      expiresOn?: string | null;
      pinned?: boolean;
      roomIds?: string[] | null;
      title: string;
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
    BillingDraftResult: {
      buildingId: string;
      created: number;
      dueDate: string;
      eligibleCount: number;
      excludedCount: number;
      expectedTotal: number;
      issueDate: string;
      period: string;
      refreshed: number;
      replayed: boolean;
      rows: components['schemas']['BillingPreviewRow'][];
      utilityPeriod: string;
    };
    BillingPreview: {
      buildingId: string;
      dueDate: string;
      eligibleCount: number;
      excludedCount: number;
      expectedTotal: number;
      issueDate: string;
      period: string;
      rows: components['schemas']['BillingPreviewRow'][];
      utilityPeriod: string;
    };
    BillingPreviewRow: {
      contractCode: string;
      contractId: string;
      eligible: boolean;
      invoiceId: string | null;
      /** @enum {string|null} */
      invoiceStatus: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'void' | null;
      /** @enum {string|null} */
      reason:
        | 'already_issued'
        | 'invalid_data'
        | 'missing_meter'
        | 'missing_reading'
        | 'move_in_invoice'
        | 'negative_consumption'
        | 'no_occupancy'
        | null;
      reasonDetail: {
        /** @enum {string} */
        kind?: 'electricity' | 'water';
        message?: string;
        period?: string;
      } | null;
      roomCode: string;
      roomId: string;
      subtotal: number | null;
      total: number | null;
    };
    BillingSettings: {
      dueDay: number;
      graceDays: number;
      issueDay: number;
      moveOutFee: number;
      readingDay: number;
      /** @enum {string} */
      readingDayMonth: 'next' | 'same';
      refundUnusedRent: boolean;
      roundingUnit: 1 | 100 | 1000;
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
      description: string | null;
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
    ContractChangeInput: {
      closingElectric?: number;
      closingWater?: number;
      effectiveDate: string;
      enabled?: boolean;
      endDate?: string;
      fullName?: string;
      initialElectric?: number;
      initialWater?: number;
      newPrimaryTenantId?: string;
      phone?: string;
      preview?: boolean;
      rent?: number;
      roomId?: string;
      serviceId?: string;
      tenantId?: string;
      vehicleId?: string;
      version: number;
    };
    ContractChangePreview: {
      changedFields: string[];
      description: string;
      effectiveDate: string;
      firstIssuePeriod: string;
      period: string;
      utilityPeriod: string | null;
      warnings: string[];
    };
    ContractChangeResult: {
      contract: components['schemas']['StayContract'] | null;
      impact: components['schemas']['ContractChangePreview'];
    };
    ContractEvent: {
      actorId: string;
      actorName: string;
      createdAt: string;
      id: string;
      payload: {
        [key: string]: (string | number | boolean) | null;
      };
      type: string;
    };
    ContractInput: {
      depositAmount: number;
      depositCollected: boolean;
      depositDate: string | null;
      /** @enum {string} */
      depositMethod: 'bank_transfer' | 'cash' | 'other';
      depositNote: string | null;
      endDate: string | null;
      initialElectric: number;
      initialElectricPhotoFileId: string | null;
      initialWater: number;
      initialWaterPhotoFileId: string | null;
      note: string | null;
      occupantIds: string[];
      primaryTenantId: string | null;
      rent: number;
      roomId: string;
      serviceIds: string[];
      startDate: string;
      vehicleIds: string[];
    };
    ContractNoticeInput: {
      expectedMoveOutDate: string;
      note?: string | null;
      version: number;
    };
    ContractOccupant: {
      fromDate: string;
      fullName: string;
      isPrimary: boolean;
      tenantId: string;
      toDate: string | null;
    };
    ContractService: {
      fromDate: string;
      /** @enum {string} */
      kind: 'electricity' | 'per_person' | 'per_room' | 'per_vehicle' | 'water';
      name: string;
      serviceId: string;
      toDate: string | null;
    };
    ContractSettleInput: {
      electricPhotoFileId?: string | null;
      finalElectric?: number | null;
      finalWater?: number | null;
      moveOutDate: string;
      /** @enum {string} */
      refundMethod?: 'bank_transfer' | 'cash' | 'other';
      surcharges?: components['schemas']['SettlementSurchargeInput'][] | null;
      version: number;
      waterPhotoFileId?: string | null;
    };
    ContractSettlementInput: {
      electricPhotoFileId?: string | null;
      finalElectric?: number | null;
      finalWater?: number | null;
      moveOutDate: string;
      surcharges?: components['schemas']['SettlementSurchargeInput'][] | null;
      waterPhotoFileId?: string | null;
    };
    ContractSettlementPreview: {
      amountDue: number;
      buildingId: string;
      contractId: string;
      depositApplied: number;
      depositHeld: number;
      depositRefunded: number;
      lines: components['schemas']['SettlementLine'][];
      moveOutDate: string;
      moveOutFee: number;
      outstandingInvoices: components['schemas']['SettlementOutstandingInvoice'][];
      outstandingTotal: number;
      ownerRefunds: number;
      period: string;
      readings: components['schemas']['SettlementReading'][];
      refundTotal: number;
      refundUnusedRent: boolean;
      remainingDue: number;
      roomCode: string;
      roomId: string;
      rounding: number;
      settlementDepositApplied: number;
      subtotal: number;
      surchargeTotal: number;
      tenantPays: number;
      total: number;
      unbilledTotal: number;
      utilitiesTotal: number;
    };
    ContractSettlementResult: {
      contract: components['schemas']['StayContract'];
      depositApplied: number;
      depositRefunded: number;
      invoice: components['schemas']['StayInvoice'];
      ownerRefunds: number;
      remainingDue: number;
      replayed: boolean;
      tenantPays: number;
    };
    ContractVehicle: {
      fromDate: string;
      plate: string;
      toDate: string | null;
      vehicleId: string;
    };
    ContractVersionInput: {
      version: number;
    };
    DepositBalance: {
      applied: number;
      forfeited: number;
      held: number;
      received: number;
      refunded: number;
    };
    DepositEntry: {
      amount: number;
      contractId: string;
      createdAt: string;
      id: string;
      invoiceId: string | null;
      /** @enum {string} */
      method: 'bank_transfer' | 'cash' | 'other';
      note: string | null;
      occurredOn: string;
      /** @enum {string} */
      type: 'applied' | 'forfeited' | 'received' | 'refunded';
    };
    DepositInput: {
      amount: number;
      /** @enum {string} */
      method: 'bank_transfer' | 'cash' | 'other';
      /** Format: date */
      occurredOn: string;
      /** @description Bắt buộc, không chỉ khoảng trắng khi type=forfeited. Lưu trong note của bút toán. */
      reason?: string | null;
      /** @enum {string} */
      type: 'forfeited' | 'received' | 'refunded';
    };
    DepositLedger: {
      balance: components['schemas']['DepositBalance'];
      buildingId: string;
      contractId: string;
      entries: components['schemas']['DepositEntry'][];
    };
    DepositSummary: {
      applied: number;
      buildingId: string;
      code: string;
      contractId: string;
      forfeited: number;
      held: number;
      primaryTenantName: string | null;
      received: number;
      refunded: number;
      roomCode: string;
      /** @enum {string} */
      status: 'active' | 'cancelled' | 'draft' | 'ended' | 'ending';
    };
    DuplicateTenantRef: {
      /** @enum {string} */
      field: 'idNumber' | 'phone';
      tenantId: string | null;
    };
    InboxAcceptInput: {
      done?: boolean;
      effectiveDate?: string | null;
      newPrimaryTenantId?: string | null;
      reply?: string | null;
      tenantId?: string | null;
      vehicleId?: string | null;
    };
    InboxItem: {
      buildingId: string;
      claim: components['schemas']['InboxPaymentClaim'] | null;
      contractCode: string | null;
      contractId: string | null;
      createdAt: string;
      handledAt: string | null;
      handledByName: string | null;
      id: string;
      /** @enum {string} */
      kind: 'maintenance' | 'payment_claim' | 'tenant_request';
      maintenance: components['schemas']['InboxMaintenance'] | null;
      reply: string | null;
      request: components['schemas']['InboxTenantRequest'] | null;
      roomCode: string | null;
      roomId: string | null;
      /** @enum {string} */
      status: 'cancelled' | 'done' | 'in_progress' | 'pending' | 'rejected';
      tenantId: string | null;
      tenantName: string | null;
    };
    InboxMaintenance: {
      /** @enum {string} */
      category: 'appliance' | 'electricity' | 'other' | 'water';
      description: string;
      photos: components['schemas']['RequestPhoto'][];
      /** @enum {string} */
      severity: 'normal' | 'urgent';
      /** @enum {string} */
      source: 'owner' | 'tenant';
      /** @enum {string} */
      status: 'cancelled' | 'done' | 'in_progress' | 'new' | 'open' | 'rejected';
      title: string;
    };
    InboxPaymentClaim: {
      amount: number;
      invoiceCode: string | null;
      invoiceId: string;
      invoicePeriod: string;
      invoiceRemaining: number;
      note: string | null;
      paidOn: string;
      paymentId: string | null;
      receipt: components['schemas']['RequestPhoto'] | null;
      reference: string | null;
      /** @enum {string} */
      status: 'cancelled' | 'confirmed' | 'pending' | 'rejected';
    };
    InboxRejectInput: {
      reason: string;
    };
    InboxReplyInput: {
      message: string;
    };
    InboxTenantRequest: {
      payload: components['schemas']['TenantRequestPayload'];
      result: {
        [key: string]: (string | number | boolean) | null;
      } | null;
      /** @enum {string} */
      status: 'accepted' | 'cancelled' | 'new' | 'rejected';
      /** @enum {string} */
      type:
        | 'add_occupant'
        | 'add_vehicle'
        | 'move_out'
        | 'other'
        | 'remove_occupant'
        | 'remove_vehicle';
    };
    InvoiceIssueInput: {
      ids: string[];
    };
    InvoiceIssueResult: {
      count: number;
      invoices: components['schemas']['StayInvoiceSummary'][];
      total: number;
    };
    InvoiceLineInput: {
      amount: number;
      reason: string;
      /** @enum {string} */
      type: 'discount' | 'surcharge';
      version?: number;
    };
    InvoicePeriodShare: {
      code: string;
      expiresAt: string;
      invoiceId: string;
      path: string;
      remaining: number;
      roomCode: string;
      /** @enum {string} */
      status: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'void';
      total: number;
      url: string;
    };
    InvoicePeriodShareResult: {
      buildingId: string;
      count: number;
      links: components['schemas']['InvoicePeriodShare'][];
      period: string;
      replayed: boolean;
    };
    InvoiceShareLink: {
      expiresAt: string;
      invoiceId: string;
      path: string;
      token: string;
      url: string;
    };
    InvoiceShareRevokeResult: {
      invoiceId: string;
      revoked: boolean;
    };
    InvoiceVoidInput: {
      reason: string;
      version?: number;
    };
    MaintenanceHistory: {
      at: string;
      /** @enum {string} */
      status: 'cancelled' | 'done' | 'in_progress' | 'new' | 'open' | 'rejected';
    };
    MaintenanceInput: {
      /** @enum {string} */
      category?: 'appliance' | 'electricity' | 'other' | 'water';
      description: string;
      photoFileIds?: string[];
      roomId: string;
      /** @enum {string} */
      severity?: 'normal' | 'urgent';
      title: string;
    };
    MaintenanceUpdateInput: {
      description?: string;
      photoFileIds?: string[];
      reply?: string;
      /** @enum {string} */
      status?: 'cancelled' | 'done' | 'in_progress' | 'new' | 'open' | 'rejected';
      title?: string;
      version: number;
    };
    MemberInput: {
      buildingIds: string[];
      permissionGroups: ('billing' | 'operations' | 'payments' | 'readings')[];
    };
    MemberInvitationInput: {
      buildingIds: string[];
      email: string;
      permissionGroups: ('billing' | 'operations' | 'payments' | 'readings')[];
    };
    MeterReadingInput: {
      confirmHighConsumption?: boolean;
      meterId: string;
      period: string;
      photoFileId?: string | null;
      reading: number;
      readOn: string;
      version: number;
    };
    MeterReplacementInput: {
      confirmHighConsumption?: boolean;
      finalReading: number;
      initialReading: number;
      replacedOn: string;
      serial?: string | null;
    };
    MoveInPreview: {
      lines: components['schemas']['MoveInPreviewLine'][];
      occupantCount: number;
      period: string;
      rounding: number;
      subtotal: number;
      total: number;
      vehicleCount: number;
      warnings: string[];
    };
    MoveInPreviewLine: {
      amount: number;
      label: string;
      quantity: number;
      ratioDen: number | null;
      ratioNum: number | null;
      serviceId: string | null;
      type: string;
      unitPrice: number | null;
    };
    MoveOutRequestPayload: {
      expectedMoveOutDate: string;
      reason?: string | null;
    };
    NotificationPreferences: {
      email: boolean;
      mutedGroups: ('announcements' | 'invoices' | 'payments' | 'reminders' | 'requests')[];
      push: boolean;
    };
    NotificationSettings: {
      email: boolean;
      emailAvailable: boolean;
      hasEmail: boolean;
      mutedGroups: ('announcements' | 'invoices' | 'payments' | 'reminders' | 'requests')[];
      push: boolean;
      pushPublicKey: string | null;
      pushSubscriptions: number;
    };
    OtherRequestPayload: {
      message: string;
    };
    OverviewLink: {
      path: string;
      query: {
        [key: string]: string;
      };
    };
    OverviewOccupancy: {
      date: string;
      occupied: number;
      rate: number | null;
      total: number;
    };
    OverviewPeriodAmounts: {
      billed: number;
      collected: number;
      invoiceCount: number;
      period: string;
      remaining: number;
    };
    OverviewTodo: {
      amount: number | null;
      count: number;
      dueOn: string | null;
      /** @enum {string} */
      kind:
        | 'draft_invoices'
        | 'ending_contracts'
        | 'expiring_contracts'
        | 'invoices_to_create'
        | 'overdue_invoices'
        | 'readings'
        | 'unshared_invoices';
      link: components['schemas']['OverviewLink'];
      total: number | null;
    };
    PaginationMeta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    PaymentClaimConfirmInput: {
      amount?: number | null;
      paidOn?: string | null;
      reference?: string | null;
    };
    PaymentClaimInput: {
      amount: number;
      note?: string | null;
      paidOn: string;
      receiptFileId?: string | null;
      reference?: string | null;
    };
    PaymentInput: {
      amount: number;
      /** @enum {string} */
      method: 'bank_transfer' | 'cash' | 'other';
      note?: string | null;
      /**
       * Format: date
       * @description Không sau hôm nay (Asia/Ho_Chi_Minh).
       */
      paidOn: string;
      reference?: string | null;
    };
    PaymentResult: {
      invoice: {
        id: string;
        paidTotal: number;
        remaining: number;
        /** @enum {string} */
        status: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'void';
        total: number;
        version: number;
      };
      payment: components['schemas']['StayPayment'];
    };
    PaymentReverseInput: {
      reason: string;
    };
    PortalContract: {
      buildingName: string;
      code: string;
      depositHeld: number;
      dueDay: number;
      endDate: string | null;
      issueDay: number;
      movedOutAt: string | null;
      noticeDate: string | null;
      occupants: components['schemas']['PortalOccupant'][];
      rent: number;
      roomCode: string;
      services: components['schemas']['PortalContractService'][];
      startDate: string;
      /** @enum {string} */
      status: 'active' | 'cancelled' | 'draft' | 'ended' | 'ending';
      vehicles: components['schemas']['PortalVehicle'][];
    };
    PortalContractService: {
      description: string | null;
      /** @enum {string} */
      kind: 'electricity' | 'per_person' | 'per_room' | 'per_vehicle' | 'water';
      name: string;
      price: number;
      unit: string;
    };
    PortalInvoice: {
      buildingAddress: string | null;
      buildingName: string;
      claims: components['schemas']['PortalPaymentClaim'][];
      code: string;
      dueOn: string;
      id: string;
      issuedOn: string | null;
      /** @enum {string} */
      kind: 'monthly' | 'move_in' | 'settlement';
      lines: components['schemas']['PublicInvoiceLine'][];
      overdue: boolean;
      paidTotal: number;
      payee: components['schemas']['PublicInvoicePayee'] | null;
      payments: components['schemas']['PortalPayment'][];
      period: string;
      remaining: number;
      representative: string | null;
      roomCode: string;
      rounding: number;
      /** @enum {string} */
      status: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'void';
      subtotal: number;
      total: number;
      transferContent: string;
      vietQrPayload: string | null;
    };
    PortalInvoiceSummary: {
      code: string;
      dueOn: string;
      id: string;
      issuedOn: string | null;
      /** @enum {string} */
      kind: 'monthly' | 'move_in' | 'settlement';
      overdue: boolean;
      paidTotal: number;
      period: string;
      remaining: number;
      /** @enum {string} */
      status: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'void';
      total: number;
    };
    PortalLinkLookup: {
      buildingName: string;
      roomCode: string;
      signedIn: boolean;
    };
    PortalLinkLookupInput: {
      token: string;
    };
    PortalMaintenance: {
      /** @enum {string} */
      category: 'appliance' | 'electricity' | 'other' | 'water';
      createdAt: string;
      description: string;
      id: string;
      isOwn: boolean;
      photos: components['schemas']['RequestPhoto'][];
      repliedAt: string | null;
      reply: string | null;
      /** @enum {string} */
      severity: 'normal' | 'urgent';
      /** @enum {string} */
      status: 'cancelled' | 'done' | 'in_progress' | 'new' | 'open' | 'rejected';
      title: string;
    };
    PortalMaintenanceInput: {
      /** @enum {string} */
      category: 'appliance' | 'electricity' | 'other' | 'water';
      description: string;
      photoFileIds?: string[];
      /** @enum {string} */
      severity: 'normal' | 'urgent';
      title: string;
    };
    PortalMe: {
      buildingAddress: string | null;
      buildingName: string;
      contactPhone: string | null;
      contractCode: string;
      /** @enum {string} */
      contractStatus: 'active' | 'cancelled' | 'draft' | 'ended' | 'ending';
      currentInvoice: components['schemas']['PortalInvoiceSummary'] | null;
      openRequests: components['schemas']['PortalOpenRequests'];
      pinnedNotices: components['schemas']['PortalNotice'][];
      previousDebt: number;
      roomCode: string;
      sessionExpiresAt: string;
      tenantName: string;
      totalDebt: number;
      unpaidInvoiceCount: number;
    };
    PortalNotice: {
      body: string;
      createdAt: string;
      expiresAt: string | null;
      id: string;
      pinned: boolean;
      title: string;
    };
    PortalNotices: {
      announcements: components['schemas']['PortalNotice'][];
      buildingName: string;
      contactPhone: string | null;
      rulesText: string | null;
    };
    PortalNotification: {
      body: string;
      createdAt: string;
      id: string;
      /** @enum {string} */
      kind:
        | 'announcement.created'
        | 'automation'
        | 'drafts.ready'
        | 'invoice.due_soon'
        | 'invoice.issued'
        | 'invoice.overdue'
        | 'maintenance.created'
        | 'payment.recorded'
        | 'payment_claim.created'
        | 'payment_claim.rejected'
        | 'reading.reminder'
        | 'reminder.unreachable'
        | 'request.updated'
        | 'tenant_request.created';
      path: string;
      readAt: string | null;
      title: string;
    };
    PortalNotifications: {
      items: components['schemas']['PortalNotification'][];
      unreadCount: number;
    };
    PortalOccupant: {
      isPrimary: boolean;
      isSelf: boolean;
      name: string;
    };
    PortalOpenRequests: {
      maintenance: number;
      paymentClaims: number;
      requests: number;
    };
    PortalPayment: {
      amount: number;
      id: string;
      /** @enum {string} */
      method: 'bank_transfer' | 'cash' | 'deposit' | 'other';
      paidOn: string;
    };
    PortalPaymentClaim: {
      amount: number;
      createdAt: string;
      handledAt: string | null;
      id: string;
      invoiceId: string;
      isOwn: boolean;
      paidOn: string;
      rejectReason: string | null;
      /** @enum {string} */
      status: 'cancelled' | 'confirmed' | 'pending' | 'rejected';
    };
    PortalSessionInput: {
      phoneLast4: string;
      token: string;
    };
    PortalSessionResult: {
      expiresAt: string;
    };
    PortalSignOutResult: {
      signedOut: boolean;
    };
    PortalTenantRequest: {
      createdAt: string;
      handledAt: string | null;
      id: string;
      payload: components['schemas']['TenantRequestPayload'];
      reply: string | null;
      /** @enum {string} */
      status: 'accepted' | 'cancelled' | 'new' | 'rejected';
      /** @enum {string} */
      type:
        | 'add_occupant'
        | 'add_vehicle'
        | 'move_out'
        | 'other'
        | 'remove_occupant'
        | 'remove_vehicle';
    };
    PortalUploadInput: {
      /** @enum {string} */
      purpose: 'maintenance_photo' | 'payment_receipt';
    };
    PortalUsage: {
      periods: components['schemas']['PortalUsagePeriod'][];
    };
    PortalUsagePeriod: {
      electricity: components['schemas']['PortalUsageReading'] | null;
      period: string;
      water: components['schemas']['PortalUsageReading'] | null;
    };
    PortalUsageReading: {
      amount: number;
      consumption: number;
      endReading: number | null;
      /** @enum {string} */
      kind: 'electricity' | 'water';
      startReading: number | null;
      unit: string | null;
      unitPrice: number | null;
    };
    PortalVehicle: {
      isOwn: boolean;
      plate: string;
      /** @enum {string} */
      type: 'bicycle' | 'car' | 'electric_bike' | 'motorbike' | 'other';
    };
    PublicInvoice: {
      buildingAddress: string | null;
      buildingName: string;
      code: string;
      dueOn: string;
      expiresAt: string;
      issuedOn: string | null;
      /** @enum {string} */
      kind: 'monthly' | 'move_in' | 'settlement';
      lines: components['schemas']['PublicInvoiceLine'][];
      overdue: boolean;
      paidTotal: number;
      payee: components['schemas']['PublicInvoicePayee'] | null;
      period: string;
      remaining: number;
      representative: string | null;
      roomCode: string;
      rounding: number;
      /** @enum {string} */
      status: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'void';
      subtotal: number;
      total: number;
      transferContent: string;
      vietQrPayload: string | null;
    };
    PublicInvoiceLine: {
      amount: number;
      description: components['schemas']['StayInvoiceLineDescription'];
      meta: components['schemas']['PublicInvoiceLineMeta'];
      period: string | null;
      quantity: number;
      ratioDen: number | null;
      ratioNum: number | null;
      /** @enum {string} */
      type:
        | 'adjustment'
        | 'deposit'
        | 'discount'
        | 'electricity'
        | 'refund'
        | 'rent'
        | 'rounding'
        | 'service'
        | 'surcharge'
        | 'water';
      unit: string | null;
      unitPrice: number | null;
    };
    PublicInvoiceLineMeta: {
      coveredFrom?: string;
      coveredTo?: string;
      endReading?: number;
      segments?: {
        consumption: number;
        endReading: number;
        startReading: number;
      }[];
      serviceDescription?: string;
      startReading?: number;
    };
    PublicInvoicePayee: {
      accountName: string;
      accountNumber: string;
      bankBin: string;
      bankName: string | null;
      bankShortName: string | null;
    };
    PushSubscriptionInput: {
      endpoint: string;
      keys: {
        auth: string;
        p256dh: string;
      };
    };
    PushSubscriptionResult: {
      endpoint: string;
      subscribed: boolean;
    };
    ReadingBulkResult: {
      results: components['schemas']['ReadingSaveResult'][];
    };
    ReadingGrid: {
      buildingId: string;
      period: string;
      /** @enum {string} */
      readingDayMonth: 'next' | 'same';
      readingOn: string;
      readOnFrom: string;
      readOnTo: string;
      rooms: components['schemas']['ReadingRoom'][];
    };
    ReadingMeter: {
      average: number | null;
      carriedConsumption: number;
      consumption: number | null;
      current: components['schemas']['StayMeterReading'] | null;
      /** @enum {string} */
      kind: 'electricity' | 'water';
      meterId: string;
      previous: number;
      warnings: string[];
    };
    ReadingRoom: {
      code: string;
      contractId: string;
      floor: number;
      meters: components['schemas']['ReadingMeter'][];
      roomId: string;
    };
    ReadingSaveResult: {
      data: components['schemas']['StayMeterReading'] | null;
      error: {
        code: string;
        message: string;
        status: number;
      } | null;
      meterId: string;
    };
    RemoveOccupantRequestPayload: {
      fullName: string;
      toDate: string;
    };
    RemoveVehicleRequestPayload: {
      plate: string;
      toDate: string;
    };
    ReportAmounts: {
      billed: number;
      collected: number;
      expenses: number;
      profit: number;
    };
    ReportExportInput: {
      buildingId: string;
      from: string;
      sheets: ('expenses' | 'invoices' | 'payments' | 'receivables')[];
      to: string;
    };
    RequestPhoto: {
      fileId: string;
      url: string | null;
    };
    ResidentExportInput: {
      date: string;
    };
    ResidentRegistrationInput: {
      note?: string;
      registeredOn: string;
    };
    RevenueMonth: {
      billed: number;
      collected: number;
      expenses: number;
      period: string;
      profit: number;
    };
    RevenueReport: {
      buildingId: string;
      from: string;
      months: components['schemas']['RevenueMonth'][];
      to: string;
      totals: components['schemas']['ReportAmounts'];
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
    RoomReportRow: {
      availableDays: number;
      billed: number;
      collected: number;
      occupancyRate: number | null;
      occupiedDays: number;
      occupiedMonths: number;
      roomCode: string;
      roomId: string;
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
    RoomsReport: {
      buildingId: string;
      rooms: components['schemas']['RoomReportRow'][];
      year: number;
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
    SettlementLine: {
      amount: number;
      description: components['schemas']['StayInvoiceLineDescription'];
      meta: components['schemas']['StayInvoiceLineMeta'];
      period: string | null;
      quantity: number;
      ratioDen: number | null;
      ratioNum: number | null;
      serviceId: string | null;
      /** @enum {string} */
      type:
        | 'adjustment'
        | 'deposit'
        | 'discount'
        | 'electricity'
        | 'refund'
        | 'rent'
        | 'rounding'
        | 'service'
        | 'surcharge'
        | 'water';
      unit: string | null;
      unitPrice: number | null;
    };
    SettlementOutstandingInvoice: {
      code: string | null;
      depositApplied: number;
      invoiceId: string;
      /** @enum {string} */
      kind: 'monthly' | 'move_in' | 'settlement';
      paidTotal: number;
      period: string;
      remaining: number;
      total: number;
    };
    SettlementReading: {
      consumption: number;
      endReading: number;
      /** @enum {string} */
      kind: 'electricity' | 'water';
      startReading: number;
    };
    SettlementSurchargeInput: {
      amount: number;
      reason: string;
    };
    StayAnnouncement: {
      body: string;
      buildingId: string;
      createdAt: string;
      createdByName: string | null;
      expired: boolean;
      expiresAt: string | null;
      id: string;
      pinned: boolean;
      roomCodes: string[];
      roomIds: string[] | null;
      title: string;
      updatedAt: string;
      version: number;
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
    StayAutomationSettings: {
      afterDue: boolean;
      beforeDue: boolean;
      createDrafts: boolean;
      readingReminder: boolean;
      readingReminderBefore: boolean;
      readingReminderDaysBefore: number;
      tenantRemindersDisabled: boolean;
      version: number;
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
      graceDays: number | null;
      id: string;
      issueDay: number | null;
      moveOutFee: number | null;
      name: string;
      readingDay: number | null;
      /** @enum {string|null} */
      readingDayMonth: 'next' | 'same' | null;
      refundUnusedRent: boolean | null;
      roundingUnit: (1 | 100 | 1000) | null;
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
      graceDays: number | null;
      id: string;
      issueDay: number | null;
      moveOutFee: number | null;
      name: string;
      readingDay: number | null;
      /** @enum {string|null} */
      readingDayMonth: 'next' | 'same' | null;
      refundUnusedRent: boolean | null;
      roundingUnit: (1 | 100 | 1000) | null;
      rulesText: string | null;
      stats: components['schemas']['BuildingStats'];
      updatedAt: string;
      version: number;
    };
    StayCapabilities: {
      contractVersion: string;
      rules: components['schemas']['StayRule'][];
    };
    StayContract: {
      buildingId: string;
      code: string;
      createdAt: string;
      depositAmount: number;
      depositCollected: boolean;
      depositDate: string | null;
      depositHeld: number;
      /** @enum {string} */
      depositMethod: 'bank_transfer' | 'cash' | 'other';
      depositNote: string | null;
      endDate: string | null;
      events: components['schemas']['ContractEvent'][];
      id: string;
      initialElectric: number;
      initialElectricPhotoFileId: string | null;
      initialElectricPhotoUrl: string | null;
      initialWater: number;
      initialWaterPhotoFileId: string | null;
      initialWaterPhotoUrl: string | null;
      movedOutAt: string | null;
      note: string | null;
      noticeDate: string | null;
      occupantIds: string[];
      occupants: components['schemas']['ContractOccupant'][];
      primaryTenantId: string | null;
      primaryTenantName: string | null;
      rent: number;
      roomCode: string;
      roomId: string;
      serviceIds: string[];
      services: components['schemas']['ContractService'][];
      settlementInvoiceId: string | null;
      startDate: string;
      /** @enum {string} */
      status: 'active' | 'cancelled' | 'draft' | 'ended' | 'ending';
      updatedAt: string;
      vehicleIds: string[];
      vehicles: components['schemas']['ContractVehicle'][];
      version: number;
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
    StayInvoice: {
      buildingId: string;
      code: string | null;
      contractCode: string;
      contractId: string;
      createdAt: string;
      dueOn: string;
      id: string;
      issuedOn: string | null;
      /** @enum {string} */
      kind: 'monthly' | 'move_in' | 'settlement';
      lines: components['schemas']['StayInvoiceLine'][];
      overdue: boolean;
      overdueFrom: string;
      paidTotal: number;
      payments: components['schemas']['StayPayment'][];
      period: string;
      remaining: number;
      roomCode: string;
      roomId: string;
      rounding: number;
      roundingUnit: number;
      shareExpiresAt: string | null;
      /** @enum {string} */
      status: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'void';
      subtotal: number;
      total: number;
      version: number;
      voidedAt: string | null;
      voidReason: string | null;
    };
    StayInvoiceLine: {
      amount: number;
      description: components['schemas']['StayInvoiceLineDescription'];
      id: string;
      manual: boolean;
      meta: components['schemas']['StayInvoiceLineMeta'];
      period: string | null;
      quantity: number;
      ratioDen: number | null;
      ratioNum: number | null;
      serviceId: string | null;
      /** @enum {string} */
      type:
        | 'adjustment'
        | 'deposit'
        | 'discount'
        | 'electricity'
        | 'refund'
        | 'rent'
        | 'rounding'
        | 'service'
        | 'surcharge'
        | 'water';
      unit: string | null;
      unitPrice: number | null;
    };
    StayInvoiceLineDescription: {
      key: string;
      params: {
        [key: string]: string | number;
      };
    };
    StayInvoiceLineMeta: {
      coveredFrom?: string;
      coveredTo?: string;
      endReading?: number;
      reason?: string;
      referenceInvoiceId?: string;
      roomId?: string;
      segments?: components['schemas']['StayInvoiceMeterSegment'][];
      serviceCode?: string;
      serviceDescription?: string;
      serviceKind?: string;
      sourceEventId?: string;
      sourceInvoiceId?: string;
      startReading?: number;
    };
    StayInvoiceMeterSegment: {
      consumption: number;
      endReading: number;
      meterId: string | null;
      startReading: number;
    };
    StayInvoiceSummary: {
      buildingId: string;
      code: string | null;
      contractCode: string;
      contractId: string;
      createdAt: string;
      dueOn: string;
      id: string;
      issuedOn: string | null;
      /** @enum {string} */
      kind: 'monthly' | 'move_in' | 'settlement';
      overdue: boolean;
      overdueFrom: string;
      paidTotal: number;
      period: string;
      remaining: number;
      roomCode: string;
      roomId: string;
      rounding: number;
      shareExpiresAt: string | null;
      /** @enum {string} */
      status: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'void';
      subtotal: number;
      total: number;
      version: number;
    };
    StayMaintenance: {
      buildingId: string;
      createdAt: string;
      description: string;
      expense: components['schemas']['StayExpense'] | null;
      history: components['schemas']['MaintenanceHistory'][];
      id: string;
      photos: components['schemas']['RequestPhoto'][];
      reply: string | null;
      roomCode: string | null;
      roomId: string | null;
      /** @enum {string} */
      source: 'owner' | 'tenant';
      /** @enum {string} */
      status: 'cancelled' | 'done' | 'in_progress' | 'new' | 'open' | 'rejected';
      title: string;
      version: number;
    };
    StayMe: {
      user: components['schemas']['StayUser'];
    };
    StayMember: {
      /** @enum {string} */
      accountStatus: 'active' | 'blocked';
      buildingIds: string[];
      buildingNames: string[];
      displayName: string;
      email: string;
      id: string;
      permissionGroups: ('billing' | 'operations' | 'payments' | 'readings')[];
      version: number;
    };
    StayMeterReading: {
      id: string;
      meterId: string;
      period: string;
      photo: {
        expiresAt: string;
        url: string;
      } | null;
      photoFileId: string | null;
      reading: number;
      readOn: string;
      /** @enum {string} */
      status: 'draft' | 'locked';
      version: number;
    };
    StayNotification: {
      body: string;
      buildingId: string;
      createdAt: string;
      id: string;
      /** @enum {string} */
      kind:
        | 'announcement.created'
        | 'automation'
        | 'drafts.ready'
        | 'invoice.due_soon'
        | 'invoice.issued'
        | 'invoice.overdue'
        | 'maintenance.created'
        | 'payment.recorded'
        | 'payment_claim.created'
        | 'payment_claim.rejected'
        | 'reading.reminder'
        | 'reminder.unreachable'
        | 'request.updated'
        | 'tenant_request.created';
      path: string;
      readAt: string | null;
      title: string;
    };
    StayNotifications: {
      items: components['schemas']['StayNotification'][];
      unreadCount: number;
    };
    StayOverview: {
      buildingId: string;
      collectedInMonth: number;
      current: components['schemas']['OverviewPeriodAmounts'];
      occupancy: components['schemas']['OverviewOccupancy'];
      period: string;
      previous: components['schemas']['OverviewPeriodAmounts'];
      previousOccupancy: components['schemas']['OverviewOccupancy'];
      previousPeriod: string;
      receivables: {
        graceDays: number;
        overdueInvoiceCount: number;
        overdueRemaining: number;
        totalRemaining: number;
      };
      rooms: {
        maintenance: number;
        occupied: number;
        reserved: number;
        total: number;
        vacant: number;
      };
      series: components['schemas']['OverviewPeriodAmounts'][];
      today: string;
      todos: components['schemas']['OverviewTodo'][];
    };
    StayPayment: {
      actorName: string | null;
      amount: number;
      buildingId: string;
      contractId: string;
      createdAt: string;
      id: string;
      invoiceCode: string | null;
      invoiceId: string;
      /** @enum {string} */
      method: 'bank_transfer' | 'cash' | 'deposit' | 'other';
      note: string | null;
      paidOn: string;
      reference: string | null;
      reversedAt: string | null;
      reversedByName: string | null;
      reverseReason: string | null;
      roomCode: string;
      roomId: string;
      /** @enum {string} */
      status: 'recorded' | 'reversed';
    };
    StayResident: {
      arrivalDate: string;
      birthDate: string | null;
      contractId: string;
      fullName: string;
      hometown: string | null;
      idNumber: string | null;
      occupantId: string;
      permanentAddress: string | null;
      registeredOn: string | null;
      roomCode: string;
      roomId: string;
      tenantId: string;
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
      hasOpenMaintenance: boolean;
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
      hasOpenMaintenance: boolean;
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
      description: string | null;
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
      graceDays: number;
      issueDay: number;
      moveOutFee: number;
      readingDay: number;
      /** @enum {string} */
      readingDayMonth: 'next' | 'same';
      refundUnusedRent: boolean;
      roundingUnit: 1 | 100 | 1000;
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
      purpose:
        | 'contract_meter'
        | 'expense_receipt'
        | 'maintenance_photo'
        | 'payment_receipt'
        | 'tenant_document';
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
      purpose:
        | 'contract_meter'
        | 'expense_receipt'
        | 'maintenance_photo'
        | 'payment_receipt'
        | 'tenant_document';
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
      permissionGroups?: ('billing' | 'operations' | 'payments' | 'readings')[];
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
    TenantPortalLink: {
      activeSessions: number;
      contractId: string;
      createdAt: string;
      createdByName: string | null;
      id: string;
      lastOpenedAt: string | null;
      lockedUntil: string | null;
      revokedAt: string | null;
      /** @enum {string} */
      status: 'active' | 'expired' | 'locked' | 'revoked';
      tenantId: string;
      tenantName: string;
    };
    TenantPortalLinkCreated: {
      link: components['schemas']['TenantPortalLink'];
      path: string;
      replacedLinkId: string | null;
      token: string;
      url: string;
    };
    TenantPortalLinkInput: {
      tenantId: string;
    };
    TenantPortalLinkRevokeResult: {
      link: components['schemas']['TenantPortalLink'];
      revoked: boolean;
      sessionsRevoked: number;
    };
    TenantRequestInput: {
      payload: components['schemas']['TenantRequestPayload'];
      /** @enum {string} */
      type:
        | 'add_occupant'
        | 'add_vehicle'
        | 'move_out'
        | 'other'
        | 'remove_occupant'
        | 'remove_vehicle';
    };
    TenantRequestPayload:
      | components['schemas']['MoveOutRequestPayload']
      | components['schemas']['AddOccupantRequestPayload']
      | components['schemas']['RemoveOccupantRequestPayload']
      | components['schemas']['AddVehicleRequestPayload']
      | components['schemas']['RemoveVehicleRequestPayload']
      | components['schemas']['OtherRequestPayload'];
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
    UtilitiesReport: {
      buildingId: string;
      from: string;
      months: components['schemas']['UtilityReportMonth'][];
      to: string;
    };
    UtilityReportMonth: {
      combinedExpenses: number;
      electricityBilled: number;
      electricityExpenses: number;
      electricityLossPercent: number | null;
      electricityQuantity: number;
      period: string;
      waterBilled: number;
      waterExpenses: number;
      waterLossPercent: number | null;
      waterQuantity: number;
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
  get_api_announcements: {
    parameters: {
      query?: {
        buildingId?: string;
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'createdAt' | 'expiresAt';
        sortOrder?: 'asc' | 'desc';
        status?: 'active' | 'all' | 'expired';
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
            data: components['schemas']['StayAnnouncement'][];
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
  post_api_announcements: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AnnouncementInput'];
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
            data: components['schemas']['StayAnnouncement'];
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
  put_api_announcements_id: {
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
        'application/json': components['schemas']['AnnouncementInput'] & {
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
            data: components['schemas']['StayAnnouncement'];
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
  delete_api_announcements_id: {
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
            data: components['schemas']['AnnouncementDeleteResult'];
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
  post_api_announcements_id_archive: {
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
            data: components['schemas']['StayAnnouncement'];
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
          graceDays?: number | null;
          issueDay?: number | null;
          moveOutFee?: number | null;
          name: string;
          readingDay?: number | null;
          /** @enum {string|null} */
          readingDayMonth?: 'same' | 'next' | null;
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
  post_api_buildings_buildingId_billing_period_drafts: {
    parameters: {
      query?: never;
      header: {
        /** @description Bắt buộc; gọi lại cùng key và kỳ trả kết quả cũ, không tạo trùng. */
        'Idempotency-Key': string;
      };
      path: {
        buildingId: string;
        period: string;
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
            data: components['schemas']['BillingDraftResult'];
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
  get_api_buildings_buildingId_billing_period_preview: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        buildingId: string;
        period: string;
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
            data: components['schemas']['BillingPreview'];
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
  post_api_buildings_buildingId_billing_period_shares: {
    parameters: {
      query?: never;
      header: {
        /** @description Bắt buộc; gọi lại cùng key trả lại cùng các link, không làm mới lần nữa. */
        'Idempotency-Key': string;
      };
      path: {
        buildingId: string;
        period: string;
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
            data: components['schemas']['InvoicePeriodShareResult'];
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
  get_api_buildings_buildingId_overview: {
    parameters: {
      query?: {
        /** @description Kỳ M; bỏ trống = kỳ hiện tại theo ngày phát hành của toà. */
        period?: string;
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
            data: components['schemas']['StayOverview'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      /** @description Kỳ ngoài khoảng 2000–2099 (`period_out_of_range`). */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  get_api_buildings_buildingId_readings: {
    parameters: {
      query: {
        period: string;
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
            data: components['schemas']['ReadingGrid'];
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
  put_api_buildings_buildingId_readings: {
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
          rows: components['schemas']['MeterReadingInput'][];
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
            data: components['schemas']['ReadingBulkResult'];
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
  get_api_buildings_buildingId_receivables: {
    parameters: {
      query?: {
        bucket?: '1_7' | '8_30' | 'not_due' | 'over_30';
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'remaining' | 'overdueDays' | 'roomCode';
        sortOrder?: 'asc' | 'desc';
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
            data: {
              /** @enum {string} */
              bucket: '1_7' | '8_30' | 'not_due' | 'over_30';
              contractCode: string;
              contractId: string;
              /** @enum {string} */
              contractStatus: 'active' | 'cancelled' | 'draft' | 'ended' | 'ending';
              invoiceCount: number;
              invoices: {
                code: string | null;
                dueOn: string;
                id: string;
                /** @enum {string} */
                kind: 'monthly' | 'move_in' | 'settlement';
                overdueDays: number;
                paidTotal: number;
                period: string;
                remaining: number;
                shareExpiresAt: string | null;
                /** @enum {string} */
                status: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'void';
                total: number;
              }[];
              oldestDueOn: string;
              overdueDays: number;
              overdueRemaining: number;
              remaining: number;
              representativeName: string | null;
              representativePhone: string | null;
              roomCode: string;
              roomId: string;
            }[];
            message?: string;
            meta: components['schemas']['PaginationMeta'] & {
              /** @description Một dòng cho mỗi nhóm (kể cả 0), theo `q`, không theo `bucket`. */
              buckets: {
                /** @enum {string} */
                bucket: 'not_due' | '1_7' | '8_30' | 'over_30';
                count: number;
                remaining: number;
              }[];
              invoiceCount: number;
              /** @description Phần đã quá hạn. */
              overdueRemaining: number;
              /** @description Tổng `total − paidTotal` của mọi hoá đơn chưa thu đủ trong bộ lọc. */
              totalRemaining: number;
            };
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
  get_api_buildings_buildingId_residents: {
    parameters: {
      query: {
        date: string;
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'fullName';
        sortOrder?: 'asc' | 'desc';
        status?: 'all' | 'unregistered';
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
            data: components['schemas']['StayResident'][];
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
  post_api_buildings_buildingId_residents_export: {
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
        'application/json': components['schemas']['ResidentExportInput'];
      };
    };
    responses: {
      /** @description Danh sách tạm trú XLSX; audit trước khi trả dữ liệu cá nhân. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': string;
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
          graceDays?: number | null;
          issueDay?: number | null;
          moveOutFee?: number | null;
          name: string;
          readingDay?: number | null;
          /** @enum {string|null} */
          readingDayMonth?: 'same' | 'next' | null;
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
  get_api_buildings_id_automation: {
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
            data: components['schemas']['StayAutomationSettings'];
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
  put_api_buildings_id_automation: {
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
        'application/json': components['schemas']['StayAutomationSettings'];
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
            data: components['schemas']['StayAutomationSettings'];
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
  get_api_contracts: {
    parameters: {
      query?: {
        buildingId?: string;
        expiring?: 'false' | 'true';
        page?: number;
        pageSize?: number;
        q?: string;
        roomId?: string;
        sortBy?: 'code' | 'startDate' | 'endDate' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
        status?: 'active' | 'cancelled' | 'draft' | 'ended' | 'ending';
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
            data: components['schemas']['StayContract'][];
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
  post_api_contracts: {
    parameters: {
      query?: never;
      header?: {
        /** @description Tuỳ chọn; retry cùng key và nội dung trả lại cùng bản nháp. Khác nội dung trả 409. */
        'Idempotency-Key'?: string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ContractInput'];
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
            data: components['schemas']['StayContract'];
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
  get_api_contracts_id: {
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
            data: components['schemas']['StayContract'];
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
  put_api_contracts_id: {
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
        'application/json': components['schemas']['ContractInput'] & {
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
            data: components['schemas']['StayContract'];
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
  post_api_contracts_id_activate: {
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
            data: components['schemas']['StayContract'];
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
  post_api_contracts_id_cancel: {
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
            data: components['schemas']['StayContract'];
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
  post_api_contracts_id_cancel_notice: {
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
        'application/json': components['schemas']['ContractVersionInput'];
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
            data: components['schemas']['StayContract'];
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
  get_api_contracts_id_deposits: {
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
            data: components['schemas']['DepositLedger'];
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
  post_api_contracts_id_deposits: {
    parameters: {
      query?: never;
      header?: {
        'Idempotency-Key'?: string;
      };
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['DepositInput'];
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
            data: components['schemas']['DepositEntry'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      /** @description Số dư cọc không đủ hoặc số tiền vượt giới hạn an toàn. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  post_api_contracts_id_move_in_invoice: {
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
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            data: components['schemas']['StayInvoice'];
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
  get_api_contracts_id_move_in_preview: {
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
            data: components['schemas']['MoveInPreview'];
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
  post_api_contracts_id_notice: {
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
        'application/json': components['schemas']['ContractNoticeInput'];
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
            data: components['schemas']['StayContract'];
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
  post_api_contracts_id_occupants: {
    parameters: {
      query?: never;
      header?: {
        'Idempotency-Key'?: string;
      };
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ContractChangeInput'];
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
            data: components['schemas']['ContractChangeResult'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      /** @description Thay đổi không hợp lệ: ngày, số người, dịch vụ hoặc chỉ số. Lỗi field trong extensions. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  post_api_contracts_id_occupants_occupantId_leave: {
    parameters: {
      query?: never;
      header?: {
        'Idempotency-Key'?: string;
      };
      path: {
        id: string;
        occupantId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ContractChangeInput'];
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
            data: components['schemas']['ContractChangeResult'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      /** @description Thay đổi không hợp lệ: ngày, số người, dịch vụ hoặc chỉ số. Lỗi field trong extensions. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  get_api_contracts_id_portal_links: {
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
            data: components['schemas']['TenantPortalLink'][];
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
  post_api_contracts_id_portal_links: {
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
        'application/json': components['schemas']['TenantPortalLinkInput'];
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
            data: components['schemas']['TenantPortalLinkCreated'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      /** @description Người thuê không còn ở trong hợp đồng (`portal_tenant_not_occupant`). */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  post_api_contracts_id_renew: {
    parameters: {
      query?: never;
      header?: {
        'Idempotency-Key'?: string;
      };
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ContractChangeInput'];
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
            data: components['schemas']['ContractChangeResult'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      /** @description Thay đổi không hợp lệ: ngày, số người, dịch vụ hoặc chỉ số. Lỗi field trong extensions. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  post_api_contracts_id_rent_change: {
    parameters: {
      query?: never;
      header?: {
        'Idempotency-Key'?: string;
      };
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ContractChangeInput'];
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
            data: components['schemas']['ContractChangeResult'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      /** @description Thay đổi không hợp lệ: ngày, số người, dịch vụ hoặc chỉ số. Lỗi field trong extensions. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  post_api_contracts_id_room_change: {
    parameters: {
      query?: never;
      header?: {
        'Idempotency-Key'?: string;
      };
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ContractChangeInput'];
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
            data: components['schemas']['ContractChangeResult'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      /** @description Thay đổi không hợp lệ: ngày, số người, dịch vụ hoặc chỉ số. Lỗi field trong extensions. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  post_api_contracts_id_services: {
    parameters: {
      query?: never;
      header?: {
        'Idempotency-Key'?: string;
      };
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ContractChangeInput'];
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
            data: components['schemas']['ContractChangeResult'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      /** @description Thay đổi không hợp lệ: ngày, số người, dịch vụ hoặc chỉ số. Lỗi field trong extensions. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  post_api_contracts_id_settle: {
    parameters: {
      query?: never;
      header: {
        /** @description Bắt buộc; mỗi lần xác nhận thanh lý dùng một key, bấm lại dùng lại key (trả kết quả cũ, `replayed: true`). */
        'Idempotency-Key': string;
      };
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ContractSettleInput'];
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
            data: components['schemas']['ContractSettlementResult'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      /** @description Hợp đồng không ở trạng thái active/ending (`contract_not_active`), còn hoá đơn nháp (`contract_has_draft_invoices`, `extensions.invoices`: `SettlementDraftInvoice[]`), đã có chỉ số sau ngày trả phòng (`reading_after_move_out`), đổi phòng sau ngày trả phòng (`contract_has_future_room_change`), `version_conflict` hoặc key đã dùng với nội dung khác (`idempotency_conflict`). */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Ngày trả phòng sau hôm nay hoặc trước ngày bắt đầu, thiếu/nhỏ hơn chỉ số trước (`finalElectric`, `finalWater`), phụ thu thiếu lý do, ảnh không hợp lệ; `invalid_settlement` khi dữ liệu tính tiền không hợp lệ. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  post_api_contracts_id_settlement_preview: {
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
        'application/json': components['schemas']['ContractSettlementInput'];
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
            data: components['schemas']['ContractSettlementPreview'];
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
  post_api_contracts_id_vehicles: {
    parameters: {
      query?: never;
      header?: {
        'Idempotency-Key'?: string;
      };
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ContractChangeInput'];
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
            data: components['schemas']['ContractChangeResult'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      /** @description Thay đổi không hợp lệ: ngày, số người, dịch vụ hoặc chỉ số. Lỗi field trong extensions. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  get_api_deposits: {
    parameters: {
      query?: {
        buildingId?: string;
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'code' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
        status?: 'active' | 'cancelled' | 'draft' | 'ended' | 'ending';
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
            data: components['schemas']['DepositSummary'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'] & {
              buildingTotals: {
                /** Format: uuid */
                buildingId: string;
                held: number;
              }[];
              totalHeld: number;
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
  get_api_invoices: {
    parameters: {
      query?: {
        buildingId?: string;
        contractId?: string;
        kind?: 'monthly' | 'move_in' | 'settlement';
        overdue?: 'false' | 'true';
        page?: number;
        pageSize?: number;
        period?: string;
        q?: string;
        roomId?: string;
        sortBy?: 'createdAt' | 'period' | 'code' | 'total' | 'dueOn' | 'issuedOn';
        sortOrder?: 'asc' | 'desc';
        status?: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'void';
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
            data: components['schemas']['StayInvoiceSummary'][];
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
  get_api_invoices_id: {
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
            data: components['schemas']['StayInvoice'];
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
  post_api_invoices_id_lines: {
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
        'application/json': components['schemas']['InvoiceLineInput'];
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
            data: components['schemas']['StayInvoice'];
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
  delete_api_invoices_id_lines_lineId: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
        lineId: string;
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
            data: components['schemas']['StayInvoice'];
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
  post_api_invoices_id_payments: {
    parameters: {
      query?: never;
      header: {
        /** @description Bắt buộc; mỗi lần mở hộp thoại Thu tiền dùng một key mới, bấm lại dùng lại key. */
        'Idempotency-Key': string;
      };
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['PaymentInput'];
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
            data: components['schemas']['PaymentResult'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      /** @description Hoá đơn chưa phát hành (`invoice_not_issued`), đã void (`invoice_void`), đã thu đủ (`invoice_already_paid`) hoặc key đã dùng với nội dung khác (`idempotency_conflict`). */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Số tiền vượt số còn lại (`payment_exceeds_remaining`, `extensions.remaining`). */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  post_api_invoices_id_share: {
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
            data: components['schemas']['InvoiceShareLink'];
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
  delete_api_invoices_id_share: {
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
            data: components['schemas']['InvoiceShareRevokeResult'];
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
  post_api_invoices_id_void: {
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
        'application/json': components['schemas']['InvoiceVoidInput'];
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
            data: components['schemas']['StayInvoice'];
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
  post_api_invoices_issue: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['InvoiceIssueInput'];
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
            data: components['schemas']['InvoiceIssueResult'];
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
  get_api_maintenance: {
    parameters: {
      query?: {
        buildingId?: string;
        page?: number;
        pageSize?: number;
        q?: string;
        roomId?: string;
        sortBy?: 'createdAt';
        sortOrder?: 'asc' | 'desc';
        source?: 'owner' | 'tenant';
        status?: 'cancelled' | 'done' | 'in_progress' | 'new' | 'open' | 'rejected';
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
            data: components['schemas']['StayMaintenance'][];
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
  post_api_maintenance: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['MaintenanceInput'];
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
            data: components['schemas']['StayMaintenance'];
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
  get_api_maintenance_id: {
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
            data: components['schemas']['StayMaintenance'];
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
  put_api_maintenance_id: {
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
        'application/json': components['schemas']['MaintenanceUpdateInput'];
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
            data: components['schemas']['StayMaintenance'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      /** @description maintenance_invalid_transition, version_conflict, maintenance_expense_exists hoặc maintenance_closed. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  post_api_maintenance_id_expense: {
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
          categoryId: string;
          note?: string | null;
          /** Format: uuid */
          receiptFileId?: string | null;
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
            data: components['schemas']['StayMaintenance'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      /** @description maintenance_invalid_transition, version_conflict, maintenance_expense_exists hoặc maintenance_closed. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  get_api_maintenance_expense_categories: {
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
  get_api_me_notification_settings: {
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
            data: components['schemas']['NotificationSettings'];
            message?: string;
          };
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  put_api_me_notification_settings: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['NotificationPreferences'];
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
            data: components['schemas']['NotificationSettings'];
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
  post_api_me_push_subscriptions: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['PushSubscriptionInput'];
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
            data: components['schemas']['PushSubscriptionResult'];
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
  delete_api_me_push_subscriptions: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          endpoint: string;
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
            data: components['schemas']['PushSubscriptionResult'];
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
  get_api_members: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'email' | 'displayName';
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
            data: components['schemas']['StayMember'][];
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
  put_api_members_id: {
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
        'application/json': components['schemas']['MemberInput'] & {
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
            data: components['schemas']['StayMember'];
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
  post_api_members_id_disable: {
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
            data: components['schemas']['StayMember'];
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
  post_api_members_invitations: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['MemberInvitationInput'];
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
            data: components['schemas']['StayMember'];
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
  post_api_meters_id_replace: {
    parameters: {
      query?: never;
      header?: {
        'Idempotency-Key'?: string;
      };
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['MeterReplacementInput'];
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
  get_api_notifications: {
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
            data: components['schemas']['StayNotifications'];
            message?: string;
          };
        };
      };
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
  get_api_notifications_stream: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Luồng `text/event-stream`: `event: ready` khi mở, `event: notification` với `data` là `NotificationStreamEvent` (JSON), comment `: ping` mỗi 25 giây. Server đóng luồng sau 10 phút; EventSource tự kết nối lại. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'text/event-stream': string;
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_payment_claims_id_confirm: {
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
        'application/json': components['schemas']['PaymentClaimConfirmInput'];
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
            data: components['schemas']['InboxItem'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      /** @description Đã từ chối/huỷ (`request_not_pending`) hoặc hoá đơn không nhận thanh toán (`invoice_void`, `invoice_already_paid`). */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Số tiền vượt số còn lại (`payment_exceeds_remaining`, `extensions.remaining`). */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  post_api_payment_claims_id_reject: {
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
        'application/json': components['schemas']['InboxRejectInput'];
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
            data: components['schemas']['InboxItem'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      /** @description Không còn chờ xác nhận (`request_not_pending`). */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  get_api_payments: {
    parameters: {
      query?: {
        buildingId?: string;
        dateFrom?: string;
        dateTo?: string;
        includeReversed?: 'false' | 'true';
        invoiceId?: string;
        method?: 'bank_transfer' | 'cash' | 'deposit' | 'other';
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'paidOn' | 'amount' | 'createdAt';
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
            data: components['schemas']['StayPayment'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'] & {
              totalAmount: number;
              /** @description Một dòng cho mỗi phương thức (kể cả 0), không gồm khoản đã huỷ. */
              totals: {
                amount: number;
                count: number;
                /** @enum {string} */
                method: 'cash' | 'bank_transfer' | 'other' | 'deposit';
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
  post_api_payments_id_reverse: {
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
        'application/json': components['schemas']['PaymentReverseInput'];
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
            data: components['schemas']['PaymentResult'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      /** @description Bút toán đã được huỷ (`payment_already_reversed`). */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  delete_api_portal_links_id: {
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
            data: components['schemas']['TenantPortalLinkRevokeResult'];
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
  get_api_portal_contract: {
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
            data: components['schemas']['PortalContract'];
            message?: string;
          };
        };
      };
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  get_api_portal_invoices: {
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
            data: components['schemas']['PortalInvoiceSummary'][];
            message?: string;
          };
        };
      };
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  get_api_portal_invoices_id: {
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
            data: components['schemas']['PortalInvoice'];
            message?: string;
          };
        };
      };
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_portal_invoices_id_payment_claims: {
    parameters: {
      query?: never;
      header?: {
        /** @description Tuỳ chọn; mỗi lần mở form dùng một key, bấm lại dùng lại key. */
        'Idempotency-Key'?: string;
      };
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['PaymentClaimInput'];
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
            data: components['schemas']['PortalPaymentClaim'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      404: components['responses']['NotFound'];
      /** @description Đã có báo chuyển khoản đang chờ (`payment_claim_pending`), hoá đơn đã thu đủ (`invoice_already_paid`) hoặc key đã dùng với nội dung khác (`idempotency_conflict`). */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Số tiền vượt số còn lại (`payment_exceeds_remaining`, `extensions.remaining`). */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  post_api_portal_links_lookup: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['PortalLinkLookupInput'];
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
            data: components['schemas']['PortalLinkLookup'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_portal_maintenance: {
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
            data: components['schemas']['PortalMaintenance'][];
            message?: string;
          };
        };
      };
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  post_api_portal_maintenance: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['PortalMaintenanceInput'];
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
            data: components['schemas']['PortalMaintenance'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_portal_maintenance_id_cancel: {
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
            data: components['schemas']['PortalMaintenance'];
            message?: string;
          };
        };
      };
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_portal_me: {
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
            data: components['schemas']['PortalMe'];
            message?: string;
          };
        };
      };
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  get_api_portal_notices: {
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
            data: components['schemas']['PortalNotices'];
            message?: string;
          };
        };
      };
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  get_api_portal_notification_settings: {
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
            data: components['schemas']['NotificationSettings'];
            message?: string;
          };
        };
      };
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  put_api_portal_notification_settings: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['NotificationPreferences'];
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
            data: components['schemas']['NotificationSettings'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_portal_notifications: {
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
            data: components['schemas']['PortalNotifications'];
            message?: string;
          };
        };
      };
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  post_api_portal_notifications_id_read: {
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
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_portal_notifications_stream: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Luồng `text/event-stream`: `event: ready` khi mở, `event: notification` với `data` là `NotificationStreamEvent` (JSON), comment `: ping` mỗi 25 giây. Server đóng luồng sau 10 phút; EventSource tự kết nối lại. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'text/event-stream': string;
        };
      };
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  post_api_portal_payment_claims_id_cancel: {
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
            data: components['schemas']['PortalPaymentClaim'];
            message?: string;
          };
        };
      };
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_portal_push_subscriptions: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['PushSubscriptionInput'];
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
            data: components['schemas']['PushSubscriptionResult'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  delete_api_portal_push_subscriptions: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          endpoint: string;
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
            data: components['schemas']['PushSubscriptionResult'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_portal_requests: {
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
            data: components['schemas']['PortalTenantRequest'][];
            message?: string;
          };
        };
      };
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  post_api_portal_requests: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['TenantRequestInput'];
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
            data: components['schemas']['PortalTenantRequest'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_portal_requests_id_cancel: {
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
            data: components['schemas']['PortalTenantRequest'];
            message?: string;
          };
        };
      };
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_portal_sessions: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['PortalSessionInput'];
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
            data: components['schemas']['PortalSessionResult'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      /** @description Link không đúng/đã thu hồi/hết hạn hoặc sai 4 số cuối (`portal_verification_failed`, không phân biệt). */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      409: components['responses']['Conflict'];
      /** @description Quá số lần thử theo IP/token (`rate_limit_exceeded`) hoặc link đang bị khoá sau 5 lần sai (`portal_link_locked`, `extensions.retryAfterSeconds`). */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  delete_api_portal_sessions: {
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
            data: components['schemas']['PortalSignOutResult'];
            message?: string;
          };
        };
      };
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_portal_uploads: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['PortalUploadInput'];
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
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  post_api_portal_uploads_id_complete: {
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
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['RateLimited'];
    };
  };
  get_api_portal_usage: {
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
            data: components['schemas']['PortalUsage'];
            message?: string;
          };
        };
      };
      /** @description Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  get_api_public_invoices_token: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        token: string;
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
            data: components['schemas']['PublicInvoice'];
            message?: string;
          };
        };
      };
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
    };
  };
  put_api_readings_id: {
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
        'application/json': components['schemas']['MeterReadingInput'];
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
            data: components['schemas']['StayMeterReading'];
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
  post_api_reports_exports: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ReportExportInput'];
      };
    };
    responses: {
      /** @description Sổ Excel; Content-Disposition: attachment; Cache-Control: no-store. */
      200: {
        headers: {
          'Content-Disposition'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': string;
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      /** @description Khoảng kỳ không hợp lệ: đảo thứ tự, quá 24 tháng hoặc ngoài năm 2000–2099. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  get_api_reports_revenue: {
    parameters: {
      query: {
        buildingId: string;
        from: string;
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
            data: components['schemas']['RevenueReport'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      /** @description Khoảng kỳ không hợp lệ: đảo thứ tự, quá 24 tháng hoặc ngoài năm 2000–2099. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  get_api_reports_rooms: {
    parameters: {
      query: {
        buildingId: string;
        year: number;
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
            data: components['schemas']['RoomsReport'];
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
  get_api_reports_utilities: {
    parameters: {
      query: {
        buildingId: string;
        from: string;
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
            data: components['schemas']['UtilitiesReport'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      /** @description Khoảng kỳ không hợp lệ: đảo thứ tự, quá 24 tháng hoặc ngoài năm 2000–2099. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  get_api_requests: {
    parameters: {
      query?: {
        buildingId?: string;
        contractId?: string;
        kind?: 'maintenance' | 'payment_claim' | 'tenant_request';
        page?: number;
        pageSize?: number;
        q?: string;
        sortBy?: 'createdAt';
        sortOrder?: 'asc' | 'desc';
        status?: 'cancelled' | 'done' | 'in_progress' | 'pending' | 'rejected';
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
            data: components['schemas']['InboxItem'][];
            message?: string;
            meta: components['schemas']['PaginationMeta'] & {
              /** @description Một dòng cho mỗi trạng thái (kể cả 0), theo bộ lọc trừ `status`. */
              counts: {
                count: number;
                /** @enum {string} */
                status: 'pending' | 'in_progress' | 'done' | 'rejected' | 'cancelled';
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
  post_api_requests_id_accept: {
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
        'application/json': components['schemas']['InboxAcceptInput'];
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
            data: components['schemas']['InboxItem'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      /** @description Đã xử lý (`request_not_pending`) hoặc thao tác hợp đồng bị chặn (`contract_not_active`, `version_conflict`…). */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  post_api_requests_id_reject: {
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
        'application/json': components['schemas']['InboxRejectInput'];
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
            data: components['schemas']['InboxItem'];
            message?: string;
          };
        };
      };
      400: components['responses']['ValidationError'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      /** @description Đã xử lý hoặc đã huỷ (`request_not_pending`). */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      429: components['responses']['RateLimited'];
    };
  };
  post_api_requests_id_reply: {
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
        'application/json': components['schemas']['InboxReplyInput'];
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
            data: components['schemas']['InboxItem'];
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
  post_api_resident_stays_id_registration: {
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
        'application/json': components['schemas']['ResidentRegistrationInput'];
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
              occupantId: string;
              registeredOn: string | null;
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
  delete_api_resident_stays_id_registration: {
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
              occupantId: string;
              registeredOn: string | null;
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
          description?: string | null;
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
          description?: string | null;
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
          /** @default 0 */
          graceDays?: number;
          issueDay: number;
          /** @default 300000 */
          moveOutFee?: number;
          readingDay: number;
          /**
           * @default same
           * @enum {string}
           */
          readingDayMonth?: 'same' | 'next';
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
          purpose: 'tenant_document' | 'expense_receipt' | 'contract_meter' | 'maintenance_photo';
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
