# Nghiệm thu — FE-62 · Khung Admin, menu và điều hướng theo quyền

[Task nguồn](../../../documents/p4/frontend/fe-62.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Hoàn thiện shell/sidebar/header hiện có, menu/action theo capability, breadcrumb từ route; không lặp avatar hoặc H1 thừa.
- [ ] AC-002 (FR-002) — Collapse/mobile drawer, submenu active, focus/keyboard, trang 403/404/error và điều hướng back hoạt động.
- [ ] AC-003 (FR-003) — Các nhóm catalog/orders/marketing/content/customers/settings/operations có route rõ; chỉ bật menu khi màn đã sẵn sàng, không để link chết.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/me/capabilities` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.
- [ ] API-02 `GET /api/auth/me` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Dùng owner và staff giới hạn để so sánh menu. Mở submenu bằng bàn phím, thử URL cấm trực tiếp và kiểm tra breadcrumb/403 khi sidebar thu gọn.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
