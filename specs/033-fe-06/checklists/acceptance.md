# Nghiệm thu — FE-06 · Trang chủ, menu và collection

[Task nguồn](../../../documents/p4/frontend/fe-06.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Render cấu hình publish/schedule từ API; ẩn section rỗng và sản phẩm không public.
- [ ] AC-002 (FR-002) — Giữ business blocks hiện có, responsive desktop/mobile và skeleton không nhảy bố cục.
- [ ] AC-003 (FR-003) — Thông tin shop lấy từ `GET /api/shop/config`.
- [ ] AC-004 (FR-004) — Không có cấu hình trang chủ thì vẫn hiển thị trạng thái hợp lý, không vỡ trang.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/storefront/home` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.
- [ ] API-02 `GET /api/navigation/{placement}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-03 `GET /api/collections` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-04 `GET /api/collections/{slug}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Seed banner đang hiệu lực, collection có sản phẩm đã publish và mục menu nội bộ. Trang chủ hiển thị theo layout API; banner hết hạn không xuất hiện.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
