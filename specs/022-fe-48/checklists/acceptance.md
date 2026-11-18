# Nghiệm thu — FE-48 · Export dữ liệu và tải kết quả

[Task nguồn](../../../documents/p4/frontend/fe-48.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Dialog chọn resource/định dạng/cột theo contract, mang theo filter/sort của danh sách; xác nhận phạm vi trước khi gửi.
- [ ] AC-002 (FR-002) — 202 mở process center, không coi đã tải xong; theo dõi progress, cancel, partial/failed và link hết hạn qua FE-10.
- [ ] AC-003 (FR-003) — Download có xác thực, không ghi token vào URL; thử export rỗng/vượt giới hạn, retry giữ idempotency key.

## Ca kiểm thử theo contract

- [ ] API-01 `POST /api/admin/exports` · Submit nhận 202 và mở trạng thái tác vụ; chỉ hiển thị kết quả khi job đạt trạng thái tương ứng. Mô phỏng mất response rồi retry cùng payload/key, kiểm tra chỉ phát sinh một lần.
- [ ] API-02 `GET /api/processes/{id}/download` · Tải đúng file từ response; hết quyền hoặc hết hạn hiện lỗi, không dùng link cũ.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Export với filter đang chọn, chờ process xong rồi tải file và đối chiếu các dòng. Khi file hết hạn, UI hiển thị trạng thái hết hạn và cho tạo bản export mới.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
