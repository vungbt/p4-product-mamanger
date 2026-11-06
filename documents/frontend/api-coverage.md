# Đối chiếu API với task Frontend

Nguồn: `apps/api/openapi.yaml` tại main `96b0389` (2026-11-06). **291 operations: 271 có task FE sở hữu, 20 được phân loại không có màn riêng; 0 chưa phân loại.** Đây là bản đồ phạm vi triển khai, không phải tài liệu schema API và không xác nhận các màn đã hoàn thành.

Một endpoint có thể dùng chung nhiều màn; bảng chỉ chọn task sở hữu chính. Các endpoint native auth được sinh bởi lib không mặc nhiên là feature đã bật; không thêm UI/action khi config hoặc nghiệp vụ chưa cho phép. Sau mỗi thay đổi API, rà lại bảng để không bỏ sót màn hoặc để endpoint cũ làm task bị lệch.

## system

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `GET /api/me/capabilities` | [FE-62](fe-62.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/system/contracts` | Không có màn riêng | Contract tham chiếu cho state/action; FE dùng generated/shared types, không dựng màn chỉnh schema. |

## processes

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `POST /api/admin/imports/{resource}` | [FE-11](fe-11.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/import-templates/{resource}` | [FE-11](fe-11.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/exports` | [FE-48](fe-48.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/files/uploads/batch` | [FE-38](fe-38.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/files/uploads/batch/complete` | [FE-38](fe-38.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/processes` | [FE-10](fe-10.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/processes/{id}` | [FE-48](fe-48.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/processes/{id}/items` | [FE-10](fe-10.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/processes/{id}/confirm` | [FE-11](fe-11.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/processes/{id}/cancel` | [FE-10](fe-10.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/processes/{id}/download` | [FE-48](fe-48.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## exchanges

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `POST /api/orders/{id}/exchanges` | [FE-22](fe-22.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/exchanges/mine` | [FE-22](fe-22.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/exchanges` | [FE-23](fe-23.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/exchanges/{id}` | [FE-22](fe-22.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/exchanges/{id}/approve` | [FE-23](fe-23.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/exchanges/{id}/reject` | [FE-23](fe-23.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/exchanges/{id}/create-replacement` | [FE-23](fe-23.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## reports

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `GET /api/admin/reports/sales` | [FE-33](fe-33.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/reports/orders` | [FE-33](fe-33.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/reports/inventory` | [FE-33](fe-33.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/reports/products` | [FE-33](fe-33.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/report-exports` | [FE-33](fe-33.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/report-exports/{id}` | [FE-33](fe-33.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/report-exports/{id}/download` | [FE-33](fe-33.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## operations

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `GET /api/internal/metrics` | [FE-35](fe-35.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/operations/inventory-reconciliation` | [FE-35](fe-35.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /health` | Không có màn riêng | Health probe hạ tầng, không có màn nghiệp vụ. |
| `GET /health/live` | Không có màn riêng | Liveness probe hạ tầng, không có màn nghiệp vụ. |
| `GET /health/ready` | [FE-36](fe-36.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## merchandising

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `GET /api/admin/collections` | [FE-28](fe-28.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/collections` | [FE-28](fe-28.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/collections/{id}` | [FE-28](fe-28.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/admin/collections/{id}` | [FE-28](fe-28.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/banners` | [FE-56](fe-56.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/banners` | [FE-56](fe-56.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/banners/{id}` | [FE-56](fe-56.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/admin/banners/{id}` | [FE-56](fe-56.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/collections` | [FE-06](fe-06.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/collections/{slug}` | [FE-06](fe-06.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/navigation/{placement}` | [FE-57](fe-57.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/admin/navigation/{placement}` | [FE-57](fe-57.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/home-layout` | [FE-58](fe-58.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/admin/home-layout` | [FE-58](fe-58.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/navigation/{placement}` | [FE-06](fe-06.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/storefront/home` | [FE-06](fe-06.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## discovery

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `GET /api/products/facets` | [FE-43](fe-43.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/search/suggestions` | [FE-43](fe-43.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## support

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `POST /api/support/tickets` | [FE-31](fe-31.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/support/tickets/mine` | [FE-31](fe-31.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/support/tickets` | [FE-59](fe-59.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/support/tickets/{id}` | [FE-59](fe-59.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/support/tickets/{id}/messages` | [FE-59](fe-59.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/support/tickets/{id}/messages` | [FE-59](fe-59.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/support/tickets/{id}/assign` | [FE-59](fe-59.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/support/tickets/{id}/close` | [FE-59](fe-59.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## jobs

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `GET /api/admin/jobs` | [FE-35](fe-35.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/jobs/{id}` | [FE-35](fe-35.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/jobs/{id}/retry` | [FE-35](fe-35.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## notifications

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `GET /api/notifications` | [FE-29](fe-29.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/notifications/unread-count` | [FE-29](fe-29.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/notifications/read-all` | [FE-29](fe-29.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/notifications/{id}/read` | [FE-29](fe-29.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/me/notification-preferences` | [FE-29](fe-29.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/me/notification-preferences` | [FE-29](fe-29.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/notification-templates` | [FE-30](fe-30.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PUT /api/admin/notification-templates` | [FE-30](fe-30.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## content

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `GET /api/posts/{slug}` | [FE-27](fe-27.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/posts` | [FE-26](fe-26.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/posts` | [FE-26](fe-26.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/posts/{id}` | [FE-26](fe-26.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/admin/posts/{id}` | [FE-55](fe-55.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/posts/{id}/publish` | [FE-26](fe-26.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/posts/{id}/archive` | [FE-26](fe-26.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/posts/{id}/revisions` | [FE-55](fe-55.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/pages/{slug}` | [FE-27](fe-27.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/pages` | [FE-53](fe-53.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/pages` | [FE-53](fe-53.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/pages/{id}` | [FE-53](fe-53.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/admin/pages/{id}` | [FE-53](fe-53.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/pages/{id}/publish` | [FE-53](fe-53.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/pages/{id}/archive` | [FE-53](fe-53.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/pages/{id}/revisions` | [FE-55](fe-55.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/posts` | [FE-27](fe-27.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/post-categories` | [FE-54](fe-54.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/post-categories` | [FE-54](fe-54.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/admin/post-categories/{id}` | [FE-54](fe-54.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/post-tags` | [FE-54](fe-54.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/post-tags` | [FE-54](fe-54.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/admin/post-tags/{id}` | [FE-54](fe-54.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/policies/current` | [FE-53](fe-53.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## wishlist

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `GET /api/wishlist` | [FE-51](fe-51.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PUT /api/wishlist/items/{productId}` | [FE-51](fe-51.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `DELETE /api/wishlist/items/{productId}` | [FE-51](fe-51.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/stock-alert-subscriptions` | [FE-52](fe-52.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/stock-alert-subscriptions/mine` | [FE-52](fe-52.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `DELETE /api/stock-alert-subscriptions/{id}` | [FE-52](fe-52.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## reviews

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `POST /api/order-items/{id}/reviews` | [FE-24](fe-24.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/reviews/{id}` | [FE-24](fe-24.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/reviews/{id}/moderation` | [FE-25](fe-25.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PUT /api/reviews/{id}/reply` | [FE-25](fe-25.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/reviews/{id}/reports` | [FE-24](fe-24.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/reviews` | [FE-25](fe-25.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/products/{id}/review-summary` | [FE-44](fe-44.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## refunds

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `POST /api/admin/refunds/{id}/reconcile` | [FE-50](fe-50.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/refunds/{id}/retry` | [FE-50](fe-50.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/refunds/{id}/manual-confirmation` | [FE-50](fe-50.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/refunds` | [FE-50](fe-50.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/refunds/{id}` | [FE-50](fe-50.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## returns

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `POST /api/orders/{id}/returns` | [FE-20](fe-20.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/returns/mine` | [FE-20](fe-20.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/returns` | [FE-21](fe-21.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/returns/{id}` | [FE-20](fe-20.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/returns/{id}/approve` | [FE-21](fe-21.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/returns/{id}/reject` | [FE-21](fe-21.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/returns/{id}/in-transit` | [FE-21](fe-21.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/returns/{id}/receive` | [FE-21](fe-21.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/returns/{id}/inspect` | [FE-21](fe-21.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/returns/{id}/complete` | [FE-21](fe-21.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## fulfillment

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `GET /api/orders/{id}/shipments` | [FE-18](fe-18.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/orders/{id}/shipments` | [FE-18](fe-18.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/shipments/{id}/pack` | [FE-18](fe-18.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/shipments/{id}/ready` | [FE-18](fe-18.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/shipments/{id}/handover` | [FE-18](fe-18.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/shipments/{id}/out-for-delivery` | [FE-18](fe-18.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/shipments/{id}/deliver` | [FE-18](fe-18.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/shipments/{id}/fail` | [FE-18](fe-18.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/shipments/{id}/return` | [FE-18](fe-18.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/shipments/{id}/lose` | [FE-18](fe-18.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/shipments/{id}/cancel` | [FE-18](fe-18.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/shipments/{id}/events` | [FE-18](fe-18.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## payments

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `POST /api/orders/{id}/payment-attempts` | [FE-16](fe-16.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/orders/{id}/payments` | [FE-16](fe-16.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/payments/{id}/reconcile` | [FE-49](fe-49.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/payments/{id}/cod-collection` | [FE-49](fe-49.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/payments/{id}/mock-pay` | [FE-16](fe-16.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/payments/webhook/stripe` | Không có màn riêng | Stripe gọi server-to-server; FE chỉ đọc payment snapshot, không tự gọi webhook. |

## orders

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `POST /api/orders/{id}/confirm` | [FE-17](fe-17.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/orders/{id}/start-processing` | [FE-17](fe-17.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/orders/{id}/events` | [FE-17](fe-17.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/orders/{id}/cancellation-requests` | [FE-19](fe-19.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/cancellation-requests/{id}` | [FE-17](fe-17.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/cancellation-requests/{id}/approve` | [FE-17](fe-17.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/cancellation-requests/{id}/reject` | [FE-17](fe-17.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/orders` | [FE-17](fe-17.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/orders` | [FE-15](fe-15.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/orders/mine` | [FE-19](fe-19.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/orders/{id}` | [FE-16](fe-16.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/orders/{id}/cancel` | [FE-17](fe-17.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/orders/{id}/refunds` | [FE-50](fe-50.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## promotions

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `GET /api/admin/promotions` | [FE-14](fe-14.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/promotions` | [FE-14](fe-14.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/promotions/{id}` | [FE-14](fe-14.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/admin/promotions/{id}` | [FE-14](fe-14.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/coupons/{id}` | [FE-14](fe-14.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/coupons/{id}/redemptions` | [FE-14](fe-14.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## checkout

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `POST /api/checkout/quotes` | [FE-15](fe-15.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/checkout/quotes/{id}` | [FE-15](fe-15.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## cart

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `GET /api/cart` | [FE-12](fe-12.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/cart/items` | [FE-12](fe-12.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `DELETE /api/cart/items` | [FE-12](fe-12.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/cart/items/{id}` | [FE-12](fe-12.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `DELETE /api/cart/items/{id}` | [FE-12](fe-12.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/cart/merge` | [FE-12](fe-12.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## settings

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `GET /api/shop/config` | [FE-06](fe-06.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/settings/shop` | [FE-13](fe-13.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/admin/settings/shop` | [FE-13](fe-13.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/settings/commerce` | [FE-13](fe-13.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/admin/settings/commerce` | [FE-13](fe-13.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/shipping-methods` | [FE-13](fe-13.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/shipping-methods` | [FE-13](fe-13.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/shipping-methods/{id}` | [FE-13](fe-13.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/admin/shipping-methods/{id}` | [FE-13](fe-13.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/shipping/quotes` | [FE-15](fe-15.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## catalog

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `GET /api/admin/products` | [FE-03](fe-03.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/products/{id}` | [FE-03](fe-03.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/products/by-slug/{slug}` | [FE-44](fe-44.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/products/{id}/publication` | [FE-03](fe-03.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/products/{id}/variants` | [FE-44](fe-44.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/products/{id}/variants` | [FE-05](fe-05.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/products/{id}/variants` | [FE-03](fe-03.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/variants` | [FE-05](fe-05.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/products/{id}/variants/{variantId}` | [FE-05](fe-05.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/products/{id}/variants/{variantId}/images` | [FE-05](fe-05.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/size-guides` | [FE-04](fe-04.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/size-guides` | [FE-41](fe-41.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/size-guides/{id}` | [FE-41](fe-41.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/admin/size-guides/{id}` | [FE-41](fe-41.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## inventory

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `GET /api/admin/inventory` | [FE-42](fe-42.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/inventory/movements` | [FE-42](fe-42.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/inventory/receipts` | [FE-42](fe-42.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/inventory/adjustments` | [FE-42](fe-42.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/inventory/reconciliation` | [FE-42](fe-42.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## accounts

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `POST /api/auth/register` | [FE-08](fe-08.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/auth/email-verification-requests` | [FE-08](fe-08.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/auth/password-reset-requests` | [FE-08](fe-08.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/auth/email-verifications` | [FE-08](fe-08.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/auth/password-resets` | [FE-08](fe-08.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/me/profile` | [FE-09](fe-09.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/me/profile` | [FE-09](fe-09.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/me/preferences` | [FE-09](fe-09.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/me/preferences` | [FE-09](fe-09.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/me/email-change-requests` | [FE-09](fe-09.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/me/email-changes/confirm` | [FE-09](fe-09.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/me/sessions` | [FE-46](fe-46.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `DELETE /api/me/sessions/{id}` | [FE-46](fe-46.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/me/sessions/revoke-others` | [FE-46](fe-46.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## audit

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `GET /api/admin/audit-logs` | [FE-34](fe-34.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/audit-logs/{id}` | [FE-34](fe-34.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## staff

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `GET /api/admin/roles` | [FE-32](fe-32.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/staff` | [FE-32](fe-32.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/admin/customers` | [FE-60](fe-60.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/admin/staff/invitations` | [FE-32](fe-32.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/staff/invitations/accept` | [FE-47](fe-47.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/admin/staff/{id}/role` | [FE-32](fe-32.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/admin/staff/{id}/status` | [FE-32](fe-32.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/admin/customers/{id}/status` | [FE-60](fe-60.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## auth

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `POST /api/auth/login` | [FE-01](fe-01.md) | Tương thích cũ; màn mới ưu tiên Better Auth SDK, không dựng engine auth thứ hai. |
| `POST /api/auth/google` | [FE-01](fe-01.md) | Tương thích cũ; màn mới ưu tiên Better Auth SDK, không dựng engine auth thứ hai. |
| `POST /api/auth/refresh` | [FE-01](fe-01.md) | Tương thích cũ; màn mới ưu tiên Better Auth SDK, không dựng engine auth thứ hai. |
| `GET /api/auth/me` | [FE-62](fe-62.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/auth/me` | [FE-09](fe-09.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PATCH /api/auth/password` | [FE-46](fe-46.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/auth/logout` | [FE-01](fe-01.md) | Tương thích cũ; màn mới ưu tiên Better Auth SDK, không dựng engine auth thứ hai. |

## products

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `GET /api/products` | [FE-43](fe-43.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/products` | [FE-04](fe-04.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/products/{id}` | [FE-44](fe-44.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PUT /api/products/{id}` | [FE-04](fe-04.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `DELETE /api/products/{id}` | [FE-04](fe-04.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/products/{id}/reviews` | [FE-44](fe-44.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/products/{id}/reviews` | [FE-24](fe-24.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `DELETE /api/products/{id}/reviews/{reviewId}` | [FE-24](fe-24.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/products/{id}/images` | [FE-04](fe-04.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `DELETE /api/products/{id}/images/{imageId}` | [FE-04](fe-04.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## categories

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `GET /api/categories` | [FE-02](fe-02.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/categories` | [FE-02](fe-02.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/categories/{id}` | [FE-02](fe-02.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PUT /api/categories/{id}` | [FE-02](fe-02.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `DELETE /api/categories/{id}` | [FE-02](fe-02.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## coupons

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `POST /api/coupons/preview` | [FE-15](fe-15.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/coupons` | [FE-14](fe-14.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/coupons` | [FE-14](fe-14.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PUT /api/coupons/{id}` | [FE-14](fe-14.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `DELETE /api/coupons/{id}` | [FE-14](fe-14.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## addresses

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `PATCH /api/addresses/{id}/default` | [FE-45](fe-45.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/addresses` | [FE-45](fe-45.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/addresses` | [FE-45](fe-45.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `PUT /api/addresses/{id}` | [FE-45](fe-45.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `DELETE /api/addresses/{id}` | [FE-45](fe-45.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## dashboard

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `GET /api/dashboard/stats` | [FE-61](fe-61.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## files

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `GET /api/files/sign-upload-url` | [FE-38](fe-38.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/files/sign-upload-urls` | [FE-38](fe-38.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/files/uploads` | [FE-38](fe-38.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/files/uploads/{id}/complete` | [FE-38](fe-38.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/files/uploads/{id}` | [FE-38](fe-38.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/files/{id}/download` | [FE-21](fe-21.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `DELETE /api/files/{id}` | [FE-38](fe-38.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |

## auth-native

| Operation | Task sở hữu | Ghi chú |
| --- | --- | --- |
| `POST /api/auth/sign-in/social` | [FE-01](fe-01.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/auth/callback/{id}` | Không có màn riêng | Callback/redirect do Better Auth xử lý; FE-01/08 xử lý trang đích, không tạo action thủ công. |
| `POST /api/auth/callback/{id}` | Không có màn riêng | Callback/redirect do Better Auth xử lý; FE-01/08 xử lý trang đích, không tạo action thủ công. |
| `GET /api/auth/get-session` | [FE-01](fe-01.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/auth/get-session` | [FE-01](fe-01.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/auth/sign-out` | [FE-01](fe-01.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/auth/sign-up/email` | [FE-08](fe-08.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/auth/sign-in/email` | [FE-01](fe-01.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/auth/reset-password` | [FE-08](fe-08.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/auth/verify-password` | [FE-46](fe-46.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/auth/verify-email` | [FE-08](fe-08.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/auth/send-verification-email` | [FE-08](fe-08.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/auth/change-email` | Không có màn riêng | FE-09 dùng luồng email-change account hiện có; không chạy song song token native và compatibility. |
| `POST /api/auth/change-password` | [FE-46](fe-46.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/auth/update-session` | Không có màn riêng | Profile/preferences nghiệp vụ versioned thuộc FE-09; không dùng native endpoint để lách version/capability. |
| `POST /api/auth/update-user` | Không có màn riêng | Profile/preferences nghiệp vụ versioned thuộc FE-09; không dùng native endpoint để lách version/capability. |
| `POST /api/auth/delete-user` | Không có màn riêng | Chưa bật account deletion trong auth config; không dựng UI tự xóa tài khoản. Cần quyết định vòng đời dữ liệu trước. |
| `POST /api/auth/request-password-reset` | [FE-08](fe-08.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `GET /api/auth/reset-password/{token}` | Không có màn riêng | Callback/redirect do Better Auth xử lý; FE-01/08 xử lý trang đích, không tạo action thủ công. |
| `GET /api/auth/list-sessions` | [FE-46](fe-46.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/auth/revoke-session` | [FE-46](fe-46.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/auth/revoke-sessions` | [FE-46](fe-46.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/auth/revoke-other-sessions` | [FE-46](fe-46.md) | Triển khai và nghiệm thu trong task; endpoint có thể được tái sử dụng ở màn khác. |
| `POST /api/auth/link-social` | Không có màn riêng | Provider account/token plumbing do Better Auth quản lý; không expose access token/provider credential hoặc thêm màn account linking ngoài phạm vi config hiện tại. |
| `GET /api/auth/list-accounts` | Không có màn riêng | Provider account/token plumbing do Better Auth quản lý; không expose access token/provider credential hoặc thêm màn account linking ngoài phạm vi config hiện tại. |
| `GET /api/auth/delete-user/callback` | Không có màn riêng | Callback/redirect do Better Auth xử lý; FE-01/08 xử lý trang đích, không tạo action thủ công. |
| `POST /api/auth/unlink-account` | Không có màn riêng | Provider account/token plumbing do Better Auth quản lý; không expose access token/provider credential hoặc thêm màn account linking ngoài phạm vi config hiện tại. |
| `POST /api/auth/refresh-token` | Không có màn riêng | Provider account/token plumbing do Better Auth quản lý; không expose access token/provider credential hoặc thêm màn account linking ngoài phạm vi config hiện tại. |
| `POST /api/auth/get-access-token` | Không có màn riêng | Provider account/token plumbing do Better Auth quản lý; không expose access token/provider credential hoặc thêm màn account linking ngoài phạm vi config hiện tại. |
| `GET /api/auth/account-info` | Không có màn riêng | Provider account/token plumbing do Better Auth quản lý; không expose access token/provider credential hoặc thêm màn account linking ngoài phạm vi config hiện tại. |
| `GET /api/auth/ok` | Không có màn riêng | Trang/trạng thái nội bộ Better Auth; FE-01/40 hiển thị lỗi ở callback/route, không có màn riêng. |
| `GET /api/auth/error` | Không có màn riêng | Trang/trạng thái nội bộ Better Auth; FE-01/40 hiển thị lỗi ở callback/route, không có màn riêng. |
