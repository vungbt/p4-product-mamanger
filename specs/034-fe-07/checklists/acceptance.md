# Nghiệm thu — FE-07 · Danh sách catalog và bộ lọc

[Task nguồn](../../../documents/p4/frontend/fe-07.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Danh sách catalog dùng facet/filter/sort/page phía server; query key và URL đồng bộ, back/forward giữ bộ lọc.
- [ ] AC-002 (FR-002) — Hiển thị product cards và trạng thái không có kết quả, loading/error/retry; link tới PDP và giữ blocks hiện có.
- [ ] AC-003 (FR-003) — Debounce/hủy request cũ; nhận diện filter không còn hợp lệ khi category đổi; thử mobile/desktop.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/products` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `GET /api/products/facets` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Chọn category, size/màu, tồn kho và khoảng giá; đổi sort và trang. Reload và back/forward giữ bộ lọc, request cũ không ghi đè kết quả mới.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
