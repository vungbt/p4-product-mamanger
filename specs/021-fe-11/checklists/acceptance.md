# Nghiệm thu — FE-11 · Import dữ liệu theo process

[Task nguồn](../../../documents/p4/frontend/fe-11.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — CSV/XLSX theo template từng resource, validate và preview không ghi dữ liệu; confirm version rõ ràng rồi mới apply.
- [ ] AC-002 (FR-002) — Hiển thị process progress, partial success và lỗi từng field/dòng; retry giữ Idempotency-Key, giới hạn theo contract thực tế.
- [ ] AC-003 (FR-003) — Dùng upload/process chung, không đóng modal rồi mất job đang chạy; liên kết result/download và phân biệt lỗi upload với lỗi dữ liệu.

## Ca kiểm thử theo contract

- [ ] API-01 `POST /api/admin/imports/{resource}` · Submit nhận 202 và mở trạng thái tác vụ; chỉ hiển thị kết quả khi job đạt trạng thái tương ứng. Mô phỏng mất response rồi retry cùng payload/key, kiểm tra chỉ phát sinh một lần.
- [ ] API-02 `GET /api/admin/import-templates/{resource}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-03 `POST /api/processes/{id}/confirm` · Submit nhận 202 và mở trạng thái tác vụ; chỉ hiển thị kết quả khi job đạt trạng thái tương ứng. Gửi version cũ, xử lý 409 và tải snapshot mới.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Import file có cả dòng hợp lệ và lỗi. Preview hiển thị lỗi từng dòng; kiểm tra dữ liệu chưa đổi trước confirm. Sau confirm, đối chiếu số ghi thành công và số lỗi trong process.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
