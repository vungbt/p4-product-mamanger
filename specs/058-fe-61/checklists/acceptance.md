# Nghiệm thu — FE-61 · Dashboard quản trị và trạng thái rỗng

[Task nguồn](../../../documents/frontend/fe-61.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Thay dashboard placeholder hiện có bằng KPI và blocks P4 dựa schema stats, có loading/error/empty và điều hướng đến màn liên quan.
- [ ] AC-002 (FR-002) — Nhận diện định nghĩa doanh thu/hoàn tiền/tồn theo contract, không tự suy doanh thu từ số đơn hoặc paid enum.
- [ ] AC-003 (FR-003) — Responsive, quyền thiếu không làm vỡ cả dashboard; analytics/report chuyên sâu ở FE-33, không làm hai bộ dữ liệu khác nhau.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/dashboard/stats` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Chạy dashboard trên fixture rỗng rồi có dữ liệu. KPI và link drill-down khớp snapshot API; thiếu report:read cho thấy trạng thái không có quyền.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
