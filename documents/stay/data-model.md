# Mô hình dữ liệu

Database `p4_stay`, đặt chung container Postgres với P4 nhưng **khác database**: không dùng chung bảng `users`, migration hay session. Mọi bảng có `id` (UUID), `created_at`, `updated_at`. Bảng nghiệp vụ có thể sửa thì có thêm `version` (optimistic lock). Tiền dùng `BIGINT` (đồng). Kỳ dùng `CHAR(7)` dạng `YYYY-MM`. Ngày nghiệp vụ dùng `DATE`.

Tên cột dưới đây là đề xuất; chốt lại trong migration của task sở hữu.

## Hệ thống và người dùng

| Bảng | Cột chính | Ghi chú |
| --- | --- | --- |
| `users`, `auth_*` | Better Auth; `role` (`owner`, `manager`, `tenant`) | Cookie prefix `stay`. MVP chỉ dùng `owner` (ST-03) |
| `users` (ST-27 bổ sung) | `permission_groups` (text[], chung cho các toà), `version` | Nhóm quyền cho quản lý; `account_status=blocked` thu hồi phiên bằng trigger hiện có |
| `building_members` | `building_id`, `user_id`, `role` | Phân quyền người quản lý theo toà (ST-27). Owner không cần dòng ở đây |
| `audit_logs`, `domain_events`, `job_leases` | Như P4 | Dùng lại thiết kế từ `libs/server-core` (ST-01) |
| `system_settings` | `key`, `value` (JSONB), `version` | Giá trị mặc định: kỳ thu, làm tròn, hoàn tiền phòng (ST-06) |

## Dịch vụ và đơn giá

| Bảng | Cột chính | Ghi chú |
| --- | --- | --- |
| `service_definitions` | `code`, `name`, `kind` (`electricity`, `water`, `per_room`, `per_person`, `per_vehicle`), `unit`, `default_price`, `active`, `sort_order` | Cấu hình hệ thống. `electricity`/`water` tính theo chỉ số (ST-06) |
| `building_service_prices` | `building_id`, `service_id`, `price`, `effective_from` | Toà ghi đè đơn giá. Giá áp dụng = bản ghi có `effective_from` lớn nhất ≤ ngày phát hành, không có thì lấy `default_price` (ST-07) |

## Toà nhà và phòng

| Bảng | Cột chính | Ghi chú |
| --- | --- | --- |
| `buildings` | `code` (unique, dùng trong mã hoá đơn), `name`, `address`, `reading_day`, `issue_day`, `due_day`, `rounding_unit`, `refund_unused_rent`, `move_out_fee`, `bank_bin`, `bank_account`, `bank_account_name`, `rules_text`, `contact_phone`, `archived_at` | Ngày để `null` thì lấy theo `system_settings` (ST-07) |
| `rooms` | `building_id`, `code` (unique trong toà), `floor`, `area_m2`, `list_price`, `max_occupants`, `maintenance` (bool), `note`, `archived_at` | Trạng thái trống/đã cọc/đang thuê suy ra từ hợp đồng (ST-08) |
| `room_default_services` | `room_id`, `service_id` | Dịch vụ mặc định gợi ý khi tạo hợp đồng (ST-08) |

## Người thuê

| Bảng | Cột chính | Ghi chú |
| --- | --- | --- |
| `tenants` | `full_name`, `phone`, `email`, `id_number` (CCCD, unique khi có), `id_issued_at`, `birth_date`, `hometown`, `permanent_address`, `occupation`, `note`, `archived_at` | Dữ liệu cá nhân: chỉ owner/manager của toà liên quan được xem (ST-09) |
| `tenant_documents` | `tenant_id`, `file_id`, `kind` (`id_front`, `id_back`, `other`) | Ảnh CCCD lưu private trên Cloudinary (ST-09) |
| `vehicles` | `tenant_id`, `plate`, `type` | Biển số xe (ST-09) |

## Hợp đồng và cọc

| Bảng | Cột chính | Ghi chú |
| --- | --- | --- |
| `contracts` | `building_id`, `room_id`, `code`, `status`, `start_date`, `end_date`, `notice_date`, `moved_out_at`, `rent` (giá chốt), `deposit_amount`, `initial_electric`, `initial_water`, `note`, `version` | Mỗi phòng một hợp đồng `active`/`ending` (exclusion constraint hoặc unique một phần) (ST-10) |
| `contract_occupants` | `contract_id`, `tenant_id`, `is_primary`, `from_date`, `to_date` | Người ở theo thời gian; dùng để đếm số người tại ngày phát hành (ST-10, ST-12) |
| `contract_vehicles` | `contract_id`, `vehicle_id`, `from_date`, `to_date` | Xe tính phí (ST-10, ST-12) |
| `contract_services` | `contract_id`, `service_id`, `from_date`, `to_date` | Dịch vụ áp dụng cho hợp đồng (ST-10) |
| `contract_events` | `contract_id`, `type` (`renewed`, `room_changed`, `rent_changed`, `notice`, `ended`), `payload`, `actor_id` | Lịch sử thay đổi hợp đồng (ST-12, ST-17) |
| `deposit_entries` | `contract_id`, `type` (`received`, `applied`, `refunded`, `forfeited`), `amount`, `method`, `occurred_on`, `note`, `invoice_id` | Sổ cọc; số dư = received − (applied + refunded + forfeited) ≥ 0 (ST-11) |

## Chỉ số và hoá đơn

| Bảng | Cột chính | Ghi chú |
| --- | --- | --- |
| `meters` | `room_id`, `kind` (`electricity`, `water`), `serial`, `installed_on`, `initial_reading`, `removed_on`, `final_reading` | Thay đồng hồ = đóng meter cũ, mở meter mới (ST-13) |
| `meter_readings` | `meter_id`, `period`, `reading`, `read_on`, `photo_file_id`, `status` (`draft`, `locked`), `version` | Unique `meter_id, period` (ST-13) |
| `invoices` | `building_id`, `contract_id`, `room_id`, `kind` (`move_in`, `monthly`, `settlement`), `period`, `code`, `status`, `issued_on`, `due_on`, `subtotal`, `rounding`, `total`, `paid_total`, `share_token_hash`, `void_reason`, `version` | Unique một phần `contract_id, period, kind` với `status <> 'void'` cho `monthly` (ST-14) |
| `invoice_lines` | `invoice_id`, `type` (`rent`, `service`, `electricity`, `water`, `surcharge`, `discount`, `adjustment`, `refund`, `rounding`), `service_id`, `description`, `period`, `quantity`, `unit`, `unit_price`, `ratio_num`, `ratio_den`, `amount`, `meta` (JSONB: chỉ số đầu/cuối, hoá đơn gốc…) | **Snapshot đầy đủ** để hiển thị lại hoá đơn mà không cần tra bảng giá (ST-14) |
| `invoice_sequences` | `building_id`, `period`, `last_number` | Cấp mã khi phát hành, khoá dòng trong transaction (ST-14) |
| `payments` | `invoice_id`, `amount`, `method` (`cash`, `bank_transfer`, `other`), `paid_on`, `reference`, `note`, `reversed_at`, `reverse_reason`, `actor_id` | Không xoá; huỷ bằng `reversed_at` (ST-15) |

## Vận hành

| Bảng | Cột chính | Ghi chú |
| --- | --- | --- |
| `expense_categories` | `name`, `active` | (ST-20) |
| `expenses` | `building_id`, `room_id` (tuỳ chọn), `category_id`, `amount`, `spent_on`, `period`, `note`, `receipt_file_id` | Chi phí vận hành (ST-20) |
| `maintenance_requests` | `building_id`, `room_id`, `contract_id`, `source` (`owner`, `tenant`), `category`, `severity`, `title`, `description`, `status` (`new`, `open`, `in_progress`, `done`, `rejected`, `cancelled`), `reply`, `cost_expense_id`, `photos` | Tạo ở ST-25 (người thuê báo hỏng); ST-22 thêm luồng nội bộ và chi phí |
| `files`, `upload_tickets` | Như P4 | Ảnh CCCD, chỉ số, hoá đơn chi phí |

## Cổng người thuê

| Bảng | Cột chính | Ghi chú |
| --- | --- | --- |
| `tenant_portal_links` | `contract_id`, `tenant_id`, `token_hash`, `created_by`, `revoked_at`, `failed_attempts`, `locked_until`, `last_opened_at` | Một link cho mỗi người ở (ST-25) |
| `tenant_portal_sessions` | `link_id`, `session_hash`, `expires_at`, `user_agent` | Phiên cổng sau khi xác minh 4 số cuối SĐT, 90 ngày (ST-25) |
| `tenant_requests` | `contract_id`, `tenant_id`, `type` (`move_out`, `add_occupant`, `remove_occupant`, `add_vehicle`, `remove_vehicle`, `other`), `payload` (JSONB), `status` (`new`, `accepted`, `rejected`), `reply`, `handled_by`, `handled_at` | Người thuê đề nghị, chủ trọ duyệt (ST-25) |
| `payment_claims` | `invoice_id`, `tenant_id`, `amount`, `paid_on`, `receipt_file_id`, `status` (`pending`, `confirmed`, `rejected`), `payment_id`, `reject_reason` | "Tôi đã chuyển khoản"; xác nhận → tạo `payments` (ST-25) |
| `announcements` | `building_id`, `title`, `body`, `room_ids` (null = cả toà), `pinned`, `expires_at`, `created_by` | Thông báo cho người thuê (ST-25, mốc Quản lý) |

## Hợp đồng online

| Bảng | Cột chính | Ghi chú |
| --- | --- | --- |
| `landlord_profiles` | `user_id`, `full_name`, `birth_date`, `id_number`, `id_issued_at`, `permanent_address`, `phone`, `signature_image` (bytea), `signature_format`, `version` | Thông tin bên cho thuê điền vào văn bản (ST-30); chữ ký lưu riêng tư trong DB |
| `contract_templates` | `building_id` (null = dùng cho mọi toà), `kind` (`contract`, `addendum`, `handover`, `settlement`), `name`, `active_version_id`, `active` | Mẫu văn bản (ST-30) |
| `contract_template_versions` | `template_id`, `version`, `body_html`, `variables_used`, `note`, `created_by` | Không sửa; lưu mới = phiên bản mới |
| `contract_documents` | `contract_id`, `kind`, `template_version_id`, `code` (unique, in trên PDF), `title`, `body_html`, `data_snapshot` (JSONB), `data_sha256`, `edited_manually`, `status`, `signing_order` (`tenant_first`, `owner_first`), `pdf_file_id`, `pdf_sha256`, `paper_scan_file_id`, `supersedes_id`, `cancel_reason`, `version` | Văn bản đã điền dữ liệu (ST-30) |
| `document_signers` | `document_id`, `role` (`tenant`, `owner`), `tenant_id`, `user_id`, `required`, `token_hash`, `expires_at`, `failed_attempts`, `locked_until`, `status` (`pending`, `viewed`, `signed`, `rejected`), `signed_at`, `signature_file_id`, `typed_name`, `reject_reason`, `signed_data_sha256` | Một dòng cho mỗi người ký |
| `document_events` | `document_id`, `signer_id`, `type`, `actor_user_id`, `ip`, `user_agent`, `data_sha256`, `created_at` | Chỉ thêm, không sửa/xoá; dùng cho trang bằng chứng |
| `document_files` | `building_id`, `purpose` (`final_pdf`, `paper_scan`), `format`, `bytes`, `sha256`, `content` (bytea) | PDF cuối và bản scan; chỉ thêm (ST-30a) |
| `room_assets` | `room_id`, `name`, `quantity`, `condition`, `compensation_value`, `photo_file_ids`, `archived_at` | Danh mục tài sản cho biên bản bàn giao (ST-30b) |

## Ràng buộc chính

- Mọi khoá ngoại tới `buildings` để chặn đọc/ghi chéo toà ở tầng query (`accessibleWhere` ở ST-27).
- Không xoá cứng: `buildings`, `rooms`, `tenants` dùng `archived_at`; hợp đồng/hoá đơn/thanh toán dùng trạng thái.
- Index: `invoices (building_id, period)`, `invoices (status, due_on)`, `meter_readings (meter_id, period)`, `contracts (room_id, status)`, `tenants (phone)`, `tenants (id_number)`.
