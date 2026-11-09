# Stay — Quản lý nhà trọ

Ứng dụng quản lý nhà trọ chạy trong monorepo P4, nhóm theo dự án:

```
apps/stay/api     @stay/api     Express + Sequelize, cổng 3011
apps/stay/web     @stay/web     Vite + @itclabs/react-ui, cổng 5174
libs/stay/shared  @stay/shared  enum, type, schema Valibot dùng chung API/web
libs/stay/billing @stay/billing công thức tính tiền thuần (không DB), có unit test
libs/stay/sdk     @stay/sdk     sinh từ OpenAPI của stay
libs/server-core, libs/ability  dùng chung với P4
```
 Người dùng chính là **chủ trọ** (hiện tại một người, một toà nhà). Mô hình dữ liệu và phân quyền vẫn thiết kế cho **nhiều toà** và **nhiều người quản lý** để mở rộng không phải viết lại.

Đây là kế hoạch triển khai, không phải checklist. Task chỉ đổi trạng thái sau khi chạy thật và ghi kết quả kiểm chứng vào phần cuối file task.

- [Quy tắc tính tiền và trạng thái](rules.md)
- [Mô hình dữ liệu](data-model.md)
- Tham chiếu MVP cũ: dự án SCM (`smart-connection-monorepo`, app `stay-*`) — chỉ lấy nghiệp vụ, không mang code và các lỗi đã liệt kê trong [rules.md](rules.md#những-lỗi-của-scm-không-được-lặp-lại).

## Quyết định đã chốt

| Chủ đề | Quyết định |
| --- | --- |
| Quy mô | Một toà lúc đầu; mọi dữ liệu gắn `buildingId`, UI chọn toà khi có từ hai toà trở lên |
| Đơn giá | Giá cố định theo **cấu hình hệ thống** (điện/kWh, nước/m³, dịch vụ); toà có thể ghi đè; hoá đơn lưu snapshot đơn giá |
| Kỳ thu | Hoá đơn tháng **M** = tiền phòng **M** + dịch vụ **M** + điện nước tiêu thụ **M−1** (chi tiết ở [rules.md](rules.md#công-thức-hoá-đơn-kỳ-m)) |
| Người dùng | MVP chỉ chủ trọ; người quản lý theo toà và cổng người thuê để giai đoạn sau |
| Domain / deploy | Chưa chốt; task deploy để cuối giai đoạn 4 |
| Quy trình | Chưa dùng spec-kit; tài liệu task này là nguồn duy nhất |

## Thứ tự triển khai

| STT | Mã | Task | Phạm vi | Phụ thuộc | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| 1 | ST-01 | [Tách lõi server dùng chung](st-01.md) | Nền tảng | Không có | Chưa bắt đầu |
| 2 | ST-02 | [Phân quyền CASL đa ứng dụng](st-02.md) | Nền tảng | Không có | Chưa bắt đầu |
| 3 | ST-03 | [Khởi tạo stay-api, DB và SDK](st-03.md) | API | ST-01, ST-02 | Chưa bắt đầu |
| 4 | ST-04 | [Khởi tạo stay-web và khung giao diện](st-04.md) | Web | ST-03 | Chưa bắt đầu |
| 5 | ST-05 | [CI, test integration và dữ liệu seed](st-05.md) | Nền tảng | ST-03, ST-04 | Chưa bắt đầu |
| 6 | ST-06 | [Cấu hình hệ thống: dịch vụ, đơn giá, kỳ thu](st-06.md) | API + Web | ST-05 | Chưa bắt đầu |
| 7 | ST-07 | [Toà nhà](st-07.md) | API + Web | ST-06 | Chưa bắt đầu |
| 8 | ST-08 | [Phòng và sơ đồ phòng](st-08.md) | API + Web | ST-07 | Chưa bắt đầu |
| 9 | ST-09 | [Người thuê và import](st-09.md) | API + Web | ST-07 | Chưa bắt đầu |
| 10 | ST-10 | [Hợp đồng thuê](st-10.md) | API + Web | ST-08, ST-09 | Chưa bắt đầu |
| 11 | ST-11 | [Sổ tiền cọc](st-11.md) | API + Web | ST-10 | Chưa bắt đầu |
| 12 | ST-12 | [Gia hạn, đổi phòng, thêm/bớt người ở](st-12.md) | API + Web | ST-10 | Chưa bắt đầu |
| 13 | ST-13 | [Chốt chỉ số điện nước](st-13.md) | API + Web | ST-10 | Chưa bắt đầu |
| 14 | ST-14 | [Lập hoá đơn kỳ](st-14.md) | API + Web | ST-06, ST-13 | Chưa bắt đầu |
| 15 | ST-15 | [Thu tiền và trạng thái hoá đơn](st-15.md) | API + Web | ST-14 | Chưa bắt đầu |
| 16 | ST-16 | [Chia sẻ hoá đơn và VietQR](st-16.md) | API + Web | ST-15 | Chưa bắt đầu |
| 17 | ST-17 | [Trả phòng và thanh lý](st-17.md) | API + Web | ST-11, ST-15 | Chưa bắt đầu |
| 18 | ST-18 | [Công nợ](st-18.md) | API + Web | ST-15 | Chưa bắt đầu |
| 19 | ST-19 | [Tổng quan tháng](st-19.md) | API + Web | ST-15, ST-18 | Chưa bắt đầu |
| 20 | ST-20 | [Chi phí vận hành](st-20.md) | API + Web | ST-07 | Chưa bắt đầu |
| 21 | ST-21 | [Báo cáo và xuất Excel](st-21.md) | API + Web | ST-19, ST-20 | Chưa bắt đầu |
| 22 | ST-22 | [Bảo trì và sửa chữa](st-22.md) | API + Web | ST-08, ST-20 | Chưa bắt đầu |
| 23 | ST-23 | [Lịch sử thay đổi](st-23.md) | API + Web | ST-03 | Chưa bắt đầu |
| 24 | ST-24 | [Deploy production](st-24.md) | Vận hành | ST-19 | Chưa bắt đầu |
| 25 | ST-25 | [Cổng người thuê](st-25.md) | API + Web | ST-16, ST-22 | Chưa bắt đầu |
| 26 | ST-26 | [Tự động hoá kỳ thu và nhắc nợ](st-26.md) | API | ST-14, ST-18 | Chưa bắt đầu |
| 27 | ST-27 | [Người quản lý theo toà](st-27.md) | API + Web | ST-02, ST-19 | Chưa bắt đầu |
| 28 | ST-28 | [Danh sách khai báo tạm trú](st-28.md) | API + Web | ST-09, ST-10 | Chưa bắt đầu |
| 29 | ST-29 | [Nghiệm thu tổng](st-29.md) | Chung | Tất cả task trước | Chưa bắt đầu |

## Các mốc bàn giao

1. **Nền tảng (ST-01 → ST-05):** stay-api/stay-web chạy local, đăng nhập, CASL, SDK, CI xanh, seed dev. P4 không đổi hành vi.
2. **Dữ liệu nền (ST-06 → ST-09):** cấu hình đơn giá, toà, phòng, người thuê.
3. **MVP vận hành hằng tháng (ST-10 → ST-19):** hợp đồng → chốt số → hoá đơn → thu tiền → chia sẻ → trả phòng → công nợ → tổng quan. **Đủ để dùng thật từ mốc này.**
4. **Quản lý (ST-20 → ST-24):** chi phí, báo cáo, bảo trì, lịch sử, deploy.
5. **Mở rộng (ST-25 → ST-29):** cổng người thuê, tự động hoá, người quản lý, tạm trú, nghiệm thu tổng.

## Quy ước chung

- **Stack và quy ước giống P4** ([CLAUDE.md](../../CLAUDE.md)): Express + Sequelize + Postgres, Better Auth, audit, `requireAbility`, list API chuẩn (`page/pageSize/q/sortBy/sortOrder` → `{ data, meta }`), OpenAPI → SDK, `@itclabs/react-ui`, Valibot, i18next (VI trước, EN sau).
- **Mọi bản ghi nghiệp vụ có `buildingId`** (trực tiếp hoặc qua phòng/hợp đồng). Danh sách lọc theo toà đang chọn; API kiểm tra quyền theo toà từ đầu dù MVP chỉ có chủ trọ.
- **Tiền là số nguyên VND** (`BIGINT`), không dùng float. Hiển thị bằng `formatCurrency` của `@itclabs/react-ui/format`.
- **Ngày và kỳ theo `Asia/Ho_Chi_Minh`.** Kỳ hoá đơn lưu dạng `YYYY-MM`.
- **Tính tiền ở server.** Web chỉ hiển thị kết quả và bản xem trước do API trả về.
- **Ghi nghiệp vụ dùng `auditedCommand`/`auditedTransaction`;** thay đổi có `version` (optimistic lock); thao tác tạo hàng loạt có `Idempotency-Key`.
- **Không xoá cứng dữ liệu đã phát sinh tiền** (hoá đơn đã phát hành, thanh toán, hợp đồng đã kích hoạt): dùng huỷ/void/lưu trữ có lý do.
- **Mobile-first:** chủ trọ chốt số và thu tiền trên điện thoại. Mỗi màn kiểm tra ở 375px và desktop, bàn phím, loading/empty/error/retry.
- **Kiểm chứng:** typecheck, lint, unit test cho công thức, integration test cho API (chạy qua `scripts/test-api-integration.sh` tương tự P4), thao tác thật trên web local. Ghi endpoint, tình huống, kết quả vào phần **Kết quả thực hiện** của task.

## Cấu trúc một file task

Mỗi `st-NN.md` gồm: Trạng thái · Ưu tiên/Giai đoạn · Phụ thuộc · Mục tiêu · API · Dữ liệu · Màn hình · Quy tắc · Điều kiện nghiệm thu · Ngoài phạm vi · Kết quả thực hiện. Endpoint trong task là **đề xuất**, chốt lại trong OpenAPI ở bước đầu của task.
