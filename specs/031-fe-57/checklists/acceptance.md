# Nghiệm thu — FE-57 · Trình biên tập menu điều hướng

[Task nguồn](../../../documents/p4/frontend/fe-57.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Editor theo placement cho header/footer và mobile; chọn target theo schema, reorder bằng kéo thả và bàn phím.
- [ ] AC-002 (FR-002) — Chặn vòng lặp/độ sâu/liên kết sai theo validation API, không viết cứng menu public ở component.
- [ ] AC-003 (FR-003) — Lưu version, xử lý 409, preview từng viewport và nghiệm thu navigation public sau publish theo contract.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/admin/navigation/{placement}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-02 `PATCH /api/admin/navigation/{placement}` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Sắp xếp mục menu ở hai placement, lưu và reload. Storefront dùng đúng placement và các link dẫn đúng route đang có.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
