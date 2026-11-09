# Spec — FE-07 · Danh sách catalog và bộ lọc

Nguồn [FE-07](../../documents/frontend/fe-07.md) · Portal **Storefront** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện danh sách catalog và bộ lọc theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-05](../../documents/frontend/fe-05.md), [FE-06](../../documents/frontend/fe-06.md)

## Ranh giới

FE-43 sở hữu tìm kiếm/gợi ý; FE-44 sở hữu PDP/gallery/chọn SKU. Task này chỉ triển khai danh sách catalog, facet, sort và URL/paging server.

## Yêu cầu

- **FR-001** — Danh sách catalog dùng facet/filter/sort/page phía server; query key và URL đồng bộ, back/forward giữ bộ lọc.
- **FR-002** — Hiển thị product cards và trạng thái không có kết quả, loading/error/retry; link tới PDP và giữ blocks hiện có.
- **FR-003** — Debounce/hủy request cũ; nhận diện filter không còn hợp lệ khi category đổi; thử mobile/desktop.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 2 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
