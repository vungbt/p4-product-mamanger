# Nghiệm thu — FE-43 · Tìm kiếm nhanh và trang kết quả

[Task nguồn](../../../documents/frontend/fe-43.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Ô tìm kiếm dùng chung header/mobile, debounce từ 2 ký tự, hủy request cũ; Enter mở trang kết quả có URL chia sẻ được.
- [ ] AC-002 (FR-002) — Gợi ý và trang kết quả có loading/empty/error; clear, bàn phím, Escape và focus đúng; không render kết quả của từ khóa cũ.
- [ ] AC-003 (FR-003) — Filter/sort/page gọi server và giữ khi back/forward; không gộp task PDP vào đây.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/search/suggestions` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Gõ liên tục hai từ khóa, chờ debounce rồi chuyển sang trang kết quả. Kết quả của request cũ không xuất hiện sau request mới và URL giữ từ khóa.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
