# Spec Kit — Backlog P4

Thứ tự theo [backlog chính](../documents/p4/frontend/README.md). Chọn thư mục tương ứng trong `.specify/feature.json` để dùng với Spec Kit. Chỉ đánh dấu nghiệm thu khi có kết quả thực tế.

## Bàn giao cho FE

- [Backlog FE](../documents/p4/frontend/README.md) là thứ tự triển khai và nơi ghi trạng thái. Chọn một feature, đọc spec để chốt phạm vi, plan để lấy contract, rồi làm theo tasks và ghi bằng chứng vào checklist.
- [OpenAPI từ backend](../apps/api/openapi.yaml) và [SDK sinh từ OpenAPI](../libs/api-sdk/README.md) là nguồn contract. [Bản đồ API → FE](../documents/p4/frontend/api-coverage.md) phân loại đủ 291 operation tại `309998f`: 251 dùng trong luồng FE, 20 tham chiếu, 20 không có màn riêng. Một operation dùng chung chỉ có một task sở hữu.
- Các bảng trong plan ghi operation, quyền, query/body/header, response và lỗi. Hành vi nghiệp vụ có thể chặt hơn schema, chẳng hạn checkout chỉ gửi `quoteId` theo luồng đã chọn. Cột **Dùng từ** chỉ ownership của contract, không tự thêm phụ thuộc vào thứ tự backlog.
- FE triển khai trong `apps/web`; typed client và resource hooks bổ sung tại `libs/api-sdk` khi cần. FE-39 do mentor chuẩn bị seed. FE-36 nghiệm thu xuyên portal. Ghi rõ ca chờ config/provider, dùng tài khoản và dữ liệu local hoặc sandbox.
- Bảng auth ưu tiên Better Auth native với cookie; các endpoint compatibility có nhãn **Tham chiếu**. Với nghiệp vụ profile và phiên có endpoint account riêng, dùng luồng đã chốt trong từng plan. Scalar có thể hiện hướng dẫn bearer phục vụ client tương thích; web theo luồng trong FE-01.

| STT | Mã | Portal | Tài liệu |
| --- | --- | --- | --- |
| 1 | [FE-01](../documents/p4/frontend/fe-01.md) | Chung | [Spec](001-fe-01/spec.md) · [Plan](001-fe-01/plan.md) · [Tasks](001-fe-01/tasks.md) · [Nghiệm thu](001-fe-01/checklists/acceptance.md) |
| 2 | [FE-37](../documents/p4/frontend/fe-37.md) | Chung | [Spec](002-fe-37/spec.md) · [Plan](002-fe-37/plan.md) · [Tasks](002-fe-37/tasks.md) · [Nghiệm thu](002-fe-37/checklists/acceptance.md) |
| 3 | [FE-39](../documents/p4/frontend/fe-39.md) | API | [Spec](003-fe-39/spec.md) · [Plan](003-fe-39/plan.md) · [Tasks](003-fe-39/tasks.md) · [Nghiệm thu](003-fe-39/checklists/acceptance.md) |
| 4 | [FE-62](../documents/p4/frontend/fe-62.md) | Admin | [Spec](004-fe-62/spec.md) · [Plan](004-fe-62/plan.md) · [Tasks](004-fe-62/tasks.md) · [Nghiệm thu](004-fe-62/checklists/acceptance.md) |
| 5 | [FE-40](../documents/p4/frontend/fe-40.md) | Storefront | [Spec](005-fe-40/spec.md) · [Plan](005-fe-40/plan.md) · [Tasks](005-fe-40/tasks.md) · [Nghiệm thu](005-fe-40/checklists/acceptance.md) |
| 6 | [FE-08](../documents/p4/frontend/fe-08.md) | Storefront | [Spec](006-fe-08/spec.md) · [Plan](006-fe-08/plan.md) · [Tasks](006-fe-08/tasks.md) · [Nghiệm thu](006-fe-08/checklists/acceptance.md) |
| 7 | [FE-10](../documents/p4/frontend/fe-10.md) | Chung | [Spec](007-fe-10/spec.md) · [Plan](007-fe-10/plan.md) · [Tasks](007-fe-10/tasks.md) · [Nghiệm thu](007-fe-10/checklists/acceptance.md) |
| 8 | [FE-38](../documents/p4/frontend/fe-38.md) | Chung | [Spec](008-fe-38/spec.md) · [Plan](008-fe-38/plan.md) · [Tasks](008-fe-38/tasks.md) · [Nghiệm thu](008-fe-38/checklists/acceptance.md) |
| 9 | [FE-09](../documents/p4/frontend/fe-09.md) | Chung | [Spec](009-fe-09/spec.md) · [Plan](009-fe-09/plan.md) · [Tasks](009-fe-09/tasks.md) · [Nghiệm thu](009-fe-09/checklists/acceptance.md) |
| 10 | [FE-46](../documents/p4/frontend/fe-46.md) | Chung | [Spec](010-fe-46/spec.md) · [Plan](010-fe-46/plan.md) · [Tasks](010-fe-46/tasks.md) · [Nghiệm thu](010-fe-46/checklists/acceptance.md) |
| 11 | [FE-45](../documents/p4/frontend/fe-45.md) | Storefront | [Spec](011-fe-45/spec.md) · [Plan](011-fe-45/plan.md) · [Tasks](011-fe-45/tasks.md) · [Nghiệm thu](011-fe-45/checklists/acceptance.md) |
| 12 | [FE-32](../documents/p4/frontend/fe-32.md) | Admin | [Spec](012-fe-32/spec.md) · [Plan](012-fe-32/plan.md) · [Tasks](012-fe-32/tasks.md) · [Nghiệm thu](012-fe-32/checklists/acceptance.md) |
| 13 | [FE-47](../documents/p4/frontend/fe-47.md) | Admin | [Spec](013-fe-47/spec.md) · [Plan](013-fe-47/plan.md) · [Tasks](013-fe-47/tasks.md) · [Nghiệm thu](013-fe-47/checklists/acceptance.md) |
| 14 | [FE-60](../documents/p4/frontend/fe-60.md) | Admin | [Spec](014-fe-60/spec.md) · [Plan](014-fe-60/plan.md) · [Tasks](014-fe-60/tasks.md) · [Nghiệm thu](014-fe-60/checklists/acceptance.md) |
| 15 | [FE-41](../documents/p4/frontend/fe-41.md) | Admin | [Spec](015-fe-41/spec.md) · [Plan](015-fe-41/plan.md) · [Tasks](015-fe-41/tasks.md) · [Nghiệm thu](015-fe-41/checklists/acceptance.md) |
| 16 | [FE-02](../documents/p4/frontend/fe-02.md) | Admin | [Spec](016-fe-02/spec.md) · [Plan](016-fe-02/plan.md) · [Tasks](016-fe-02/tasks.md) · [Nghiệm thu](016-fe-02/checklists/acceptance.md) |
| 17 | [FE-03](../documents/p4/frontend/fe-03.md) | Admin | [Spec](017-fe-03/spec.md) · [Plan](017-fe-03/plan.md) · [Tasks](017-fe-03/tasks.md) · [Nghiệm thu](017-fe-03/checklists/acceptance.md) |
| 18 | [FE-04](../documents/p4/frontend/fe-04.md) | Admin | [Spec](018-fe-04/spec.md) · [Plan](018-fe-04/plan.md) · [Tasks](018-fe-04/tasks.md) · [Nghiệm thu](018-fe-04/checklists/acceptance.md) |
| 19 | [FE-05](../documents/p4/frontend/fe-05.md) | Admin | [Spec](019-fe-05/spec.md) · [Plan](019-fe-05/plan.md) · [Tasks](019-fe-05/tasks.md) · [Nghiệm thu](019-fe-05/checklists/acceptance.md) |
| 20 | [FE-42](../documents/p4/frontend/fe-42.md) | Admin | [Spec](020-fe-42/spec.md) · [Plan](020-fe-42/plan.md) · [Tasks](020-fe-42/tasks.md) · [Nghiệm thu](020-fe-42/checklists/acceptance.md) |
| 21 | [FE-11](../documents/p4/frontend/fe-11.md) | Admin | [Spec](021-fe-11/spec.md) · [Plan](021-fe-11/plan.md) · [Tasks](021-fe-11/tasks.md) · [Nghiệm thu](021-fe-11/checklists/acceptance.md) |
| 22 | [FE-48](../documents/p4/frontend/fe-48.md) | Admin | [Spec](022-fe-48/spec.md) · [Plan](022-fe-48/plan.md) · [Tasks](022-fe-48/tasks.md) · [Nghiệm thu](022-fe-48/checklists/acceptance.md) |
| 23 | [FE-13](../documents/p4/frontend/fe-13.md) | Admin | [Spec](023-fe-13/spec.md) · [Plan](023-fe-13/plan.md) · [Tasks](023-fe-13/tasks.md) · [Nghiệm thu](023-fe-13/checklists/acceptance.md) |
| 24 | [FE-14](../documents/p4/frontend/fe-14.md) | Admin | [Spec](024-fe-14/spec.md) · [Plan](024-fe-14/plan.md) · [Tasks](024-fe-14/tasks.md) · [Nghiệm thu](024-fe-14/checklists/acceptance.md) |
| 25 | [FE-54](../documents/p4/frontend/fe-54.md) | Admin | [Spec](025-fe-54/spec.md) · [Plan](025-fe-54/plan.md) · [Tasks](025-fe-54/tasks.md) · [Nghiệm thu](025-fe-54/checklists/acceptance.md) |
| 26 | [FE-26](../documents/p4/frontend/fe-26.md) | Admin | [Spec](026-fe-26/spec.md) · [Plan](026-fe-26/plan.md) · [Tasks](026-fe-26/tasks.md) · [Nghiệm thu](026-fe-26/checklists/acceptance.md) |
| 27 | [FE-53](../documents/p4/frontend/fe-53.md) | Admin | [Spec](027-fe-53/spec.md) · [Plan](027-fe-53/plan.md) · [Tasks](027-fe-53/tasks.md) · [Nghiệm thu](027-fe-53/checklists/acceptance.md) |
| 28 | [FE-55](../documents/p4/frontend/fe-55.md) | Admin | [Spec](028-fe-55/spec.md) · [Plan](028-fe-55/plan.md) · [Tasks](028-fe-55/tasks.md) · [Nghiệm thu](028-fe-55/checklists/acceptance.md) |
| 29 | [FE-28](../documents/p4/frontend/fe-28.md) | Admin | [Spec](029-fe-28/spec.md) · [Plan](029-fe-28/plan.md) · [Tasks](029-fe-28/tasks.md) · [Nghiệm thu](029-fe-28/checklists/acceptance.md) |
| 30 | [FE-56](../documents/p4/frontend/fe-56.md) | Admin | [Spec](030-fe-56/spec.md) · [Plan](030-fe-56/plan.md) · [Tasks](030-fe-56/tasks.md) · [Nghiệm thu](030-fe-56/checklists/acceptance.md) |
| 31 | [FE-57](../documents/p4/frontend/fe-57.md) | Admin | [Spec](031-fe-57/spec.md) · [Plan](031-fe-57/plan.md) · [Tasks](031-fe-57/tasks.md) · [Nghiệm thu](031-fe-57/checklists/acceptance.md) |
| 32 | [FE-58](../documents/p4/frontend/fe-58.md) | Admin | [Spec](032-fe-58/spec.md) · [Plan](032-fe-58/plan.md) · [Tasks](032-fe-58/tasks.md) · [Nghiệm thu](032-fe-58/checklists/acceptance.md) |
| 33 | [FE-06](../documents/p4/frontend/fe-06.md) | Storefront | [Spec](033-fe-06/spec.md) · [Plan](033-fe-06/plan.md) · [Tasks](033-fe-06/tasks.md) · [Nghiệm thu](033-fe-06/checklists/acceptance.md) |
| 34 | [FE-07](../documents/p4/frontend/fe-07.md) | Storefront | [Spec](034-fe-07/spec.md) · [Plan](034-fe-07/plan.md) · [Tasks](034-fe-07/tasks.md) · [Nghiệm thu](034-fe-07/checklists/acceptance.md) |
| 35 | [FE-43](../documents/p4/frontend/fe-43.md) | Storefront | [Spec](035-fe-43/spec.md) · [Plan](035-fe-43/plan.md) · [Tasks](035-fe-43/tasks.md) · [Nghiệm thu](035-fe-43/checklists/acceptance.md) |
| 36 | [FE-44](../documents/p4/frontend/fe-44.md) | Storefront | [Spec](036-fe-44/spec.md) · [Plan](036-fe-44/plan.md) · [Tasks](036-fe-44/tasks.md) · [Nghiệm thu](036-fe-44/checklists/acceptance.md) |
| 37 | [FE-27](../documents/p4/frontend/fe-27.md) | Storefront | [Spec](037-fe-27/spec.md) · [Plan](037-fe-27/plan.md) · [Tasks](037-fe-27/tasks.md) · [Nghiệm thu](037-fe-27/checklists/acceptance.md) |
| 38 | [FE-51](../documents/p4/frontend/fe-51.md) | Storefront | [Spec](038-fe-51/spec.md) · [Plan](038-fe-51/plan.md) · [Tasks](038-fe-51/tasks.md) · [Nghiệm thu](038-fe-51/checklists/acceptance.md) |
| 39 | [FE-52](../documents/p4/frontend/fe-52.md) | Storefront | [Spec](039-fe-52/spec.md) · [Plan](039-fe-52/plan.md) · [Tasks](039-fe-52/tasks.md) · [Nghiệm thu](039-fe-52/checklists/acceptance.md) |
| 40 | [FE-12](../documents/p4/frontend/fe-12.md) | Storefront | [Spec](001-storefront-cart/spec.md) · [Plan](001-storefront-cart/plan.md) · [Tasks](001-storefront-cart/tasks.md) · [Nghiệm thu](001-storefront-cart/checklists/acceptance.md) |
| 41 | [FE-15](../documents/p4/frontend/fe-15.md) | Storefront | [Spec](041-fe-15/spec.md) · [Plan](041-fe-15/plan.md) · [Tasks](041-fe-15/tasks.md) · [Nghiệm thu](041-fe-15/checklists/acceptance.md) |
| 42 | [FE-16](../documents/p4/frontend/fe-16.md) | Storefront | [Spec](042-fe-16/spec.md) · [Plan](042-fe-16/plan.md) · [Tasks](042-fe-16/tasks.md) · [Nghiệm thu](042-fe-16/checklists/acceptance.md) |
| 43 | [FE-17](../documents/p4/frontend/fe-17.md) | Admin | [Spec](043-fe-17/spec.md) · [Plan](043-fe-17/plan.md) · [Tasks](043-fe-17/tasks.md) · [Nghiệm thu](043-fe-17/checklists/acceptance.md) |
| 44 | [FE-18](../documents/p4/frontend/fe-18.md) | Admin | [Spec](044-fe-18/spec.md) · [Plan](044-fe-18/plan.md) · [Tasks](044-fe-18/tasks.md) · [Nghiệm thu](044-fe-18/checklists/acceptance.md) |
| 45 | [FE-49](../documents/p4/frontend/fe-49.md) | Admin | [Spec](045-fe-49/spec.md) · [Plan](045-fe-49/plan.md) · [Tasks](045-fe-49/tasks.md) · [Nghiệm thu](045-fe-49/checklists/acceptance.md) |
| 46 | [FE-19](../documents/p4/frontend/fe-19.md) | Storefront | [Spec](046-fe-19/spec.md) · [Plan](046-fe-19/plan.md) · [Tasks](046-fe-19/tasks.md) · [Nghiệm thu](046-fe-19/checklists/acceptance.md) |
| 47 | [FE-20](../documents/p4/frontend/fe-20.md) | Storefront | [Spec](047-fe-20/spec.md) · [Plan](047-fe-20/plan.md) · [Tasks](047-fe-20/tasks.md) · [Nghiệm thu](047-fe-20/checklists/acceptance.md) |
| 48 | [FE-21](../documents/p4/frontend/fe-21.md) | Admin | [Spec](048-fe-21/spec.md) · [Plan](048-fe-21/plan.md) · [Tasks](048-fe-21/tasks.md) · [Nghiệm thu](048-fe-21/checklists/acceptance.md) |
| 49 | [FE-50](../documents/p4/frontend/fe-50.md) | Admin | [Spec](049-fe-50/spec.md) · [Plan](049-fe-50/plan.md) · [Tasks](049-fe-50/tasks.md) · [Nghiệm thu](049-fe-50/checklists/acceptance.md) |
| 50 | [FE-22](../documents/p4/frontend/fe-22.md) | Storefront | [Spec](050-fe-22/spec.md) · [Plan](050-fe-22/plan.md) · [Tasks](050-fe-22/tasks.md) · [Nghiệm thu](050-fe-22/checklists/acceptance.md) |
| 51 | [FE-23](../documents/p4/frontend/fe-23.md) | Admin | [Spec](051-fe-23/spec.md) · [Plan](051-fe-23/plan.md) · [Tasks](051-fe-23/tasks.md) · [Nghiệm thu](051-fe-23/checklists/acceptance.md) |
| 52 | [FE-24](../documents/p4/frontend/fe-24.md) | Storefront | [Spec](052-fe-24/spec.md) · [Plan](052-fe-24/plan.md) · [Tasks](052-fe-24/tasks.md) · [Nghiệm thu](052-fe-24/checklists/acceptance.md) |
| 53 | [FE-25](../documents/p4/frontend/fe-25.md) | Admin | [Spec](053-fe-25/spec.md) · [Plan](053-fe-25/plan.md) · [Tasks](053-fe-25/tasks.md) · [Nghiệm thu](053-fe-25/checklists/acceptance.md) |
| 54 | [FE-29](../documents/p4/frontend/fe-29.md) | Chung | [Spec](054-fe-29/spec.md) · [Plan](054-fe-29/plan.md) · [Tasks](054-fe-29/tasks.md) · [Nghiệm thu](054-fe-29/checklists/acceptance.md) |
| 55 | [FE-30](../documents/p4/frontend/fe-30.md) | Admin | [Spec](055-fe-30/spec.md) · [Plan](055-fe-30/plan.md) · [Tasks](055-fe-30/tasks.md) · [Nghiệm thu](055-fe-30/checklists/acceptance.md) |
| 56 | [FE-31](../documents/p4/frontend/fe-31.md) | Chung | [Spec](056-fe-31/spec.md) · [Plan](056-fe-31/plan.md) · [Tasks](056-fe-31/tasks.md) · [Nghiệm thu](056-fe-31/checklists/acceptance.md) |
| 57 | [FE-59](../documents/p4/frontend/fe-59.md) | Admin | [Spec](057-fe-59/spec.md) · [Plan](057-fe-59/plan.md) · [Tasks](057-fe-59/tasks.md) · [Nghiệm thu](057-fe-59/checklists/acceptance.md) |
| 58 | [FE-61](../documents/p4/frontend/fe-61.md) | Admin | [Spec](058-fe-61/spec.md) · [Plan](058-fe-61/plan.md) · [Tasks](058-fe-61/tasks.md) · [Nghiệm thu](058-fe-61/checklists/acceptance.md) |
| 59 | [FE-33](../documents/p4/frontend/fe-33.md) | Admin | [Spec](059-fe-33/spec.md) · [Plan](059-fe-33/plan.md) · [Tasks](059-fe-33/tasks.md) · [Nghiệm thu](059-fe-33/checklists/acceptance.md) |
| 60 | [FE-34](../documents/p4/frontend/fe-34.md) | Admin | [Spec](060-fe-34/spec.md) · [Plan](060-fe-34/plan.md) · [Tasks](060-fe-34/tasks.md) · [Nghiệm thu](060-fe-34/checklists/acceptance.md) |
| 61 | [FE-35](../documents/p4/frontend/fe-35.md) | Admin | [Spec](061-fe-35/spec.md) · [Plan](061-fe-35/plan.md) · [Tasks](061-fe-35/tasks.md) · [Nghiệm thu](061-fe-35/checklists/acceptance.md) |
| 62 | [FE-36](../documents/p4/frontend/fe-36.md) | Chung | [Spec](062-fe-36/spec.md) · [Plan](062-fe-36/plan.md) · [Tasks](062-fe-36/tasks.md) · [Nghiệm thu](062-fe-36/checklists/acceptance.md) |
