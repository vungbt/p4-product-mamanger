# Quy tắc tính tiền và trạng thái

Tài liệu nguồn cho mọi task liên quan tới tiền. Công thức được cài trong `@stay/billing` (thư viện thuần, không truy cập DB), chạy **ở server** và có unit test bao phủ từng ví dụ trong file này. Thay đổi quy tắc phải sửa file này trước, rồi mới sửa code.

## Thuật ngữ

| Thuật ngữ | Nghĩa |
| --- | --- |
| Kỳ `M` | Tháng tính tiền, lưu dạng `YYYY-MM`, theo giờ `Asia/Ho_Chi_Minh` |
| Ngày chốt số | Ngày ghi chỉ số điện nước của kỳ trước, mặc định **ngày cuối tháng M−1** (cấu hình theo toà) |
| Ngày phát hành | Ngày lập hoá đơn kỳ M, mặc định **ngày 1 tháng M** |
| Hạn thanh toán | Mặc định **ngày 5 tháng M** (cấu hình theo toà) |
| Đơn giá | Lấy từ cấu hình hệ thống, toà có thể ghi đè; **chụp lại (snapshot) vào dòng hoá đơn** lúc phát hành |

## Công thức hoá đơn kỳ M

Hoá đơn kỳ M của một hợp đồng gồm ba nhóm dòng:

1. **Tiền phòng tháng M** (trả trước) = giá thuê chốt trong hợp đồng × tỷ lệ ngày ở trong tháng M.
2. **Dịch vụ tháng M** (trả trước), theo cách tính của từng dịch vụ:
   - `per_room`: cố định theo phòng (internet, rác, vệ sinh chung).
   - `per_person`: đơn giá × **số người ở đang đăng ký trong hợp đồng tại ngày phát hành**.
   - `per_vehicle`: đơn giá × số xe đăng ký trong hợp đồng tại ngày phát hành.
   - Áp dụng cùng tỷ lệ ngày ở như tiền phòng khi hợp đồng bắt đầu/kết thúc trong tháng M.
3. **Điện nước tiêu thụ tháng M−1** (trả sau) = (chỉ số chốt cuối M−1 − chỉ số chốt cuối M−2) × đơn giá.
   - Hợp đồng bắt đầu trong tháng M−1: chỉ số đầu là **chỉ số lúc nhận phòng** ghi trong hợp đồng.
   - Thay đồng hồ giữa kỳ: tiêu thụ = (số cuối đồng hồ cũ − số đầu kỳ) + (số chốt đồng hồ mới − số đầu đồng hồ mới).
   - Tiêu thụ âm là lỗi nhập liệu: chặn phát hành, không tự đưa về 0.

Ngoài ra có thể có:
- **Phụ thu / giảm trừ** do chủ trọ thêm tay (có lý do), ví dụ đền đồ hỏng, giảm giá tháng đầu.
- **Điều chỉnh kỳ trước**: chênh lệch khi sửa chỉ số đã khoá hoặc sửa đơn giá sau khi phát hành (xem [Sửa sai](#sửa-sai-sau-khi-phát-hành)).
- **Nợ cũ** không cộng vào hoá đơn mới. Mỗi hoá đơn độc lập; công nợ hiển thị tổng các hoá đơn chưa thu đủ.

### Tỷ lệ ngày ở

`tỷ lệ = số ngày ở trong tháng / số ngày của tháng`, đếm cả ngày bắt đầu và ngày kết thúc. Ví dụ nhận phòng 20/11 (tháng 30 ngày) thì tỷ lệ = 11/30. **Ngày trả phòng được tính là ngày đã ở.**

Hợp đồng có **hoá đơn nhận phòng** cho kỳ M thì **không** lập thêm hoá đơn kỳ M; hoá đơn kỳ đầu tiên tiếp theo là kỳ M+1.

### Làm tròn

- Mỗi dòng tính ra số nguyên đồng (làm tròn half-up; số âm làm tròn ra xa số 0, ví dụ −759.999 → −760.000 khi làm tròn tới 1.000đ).
- Dịch vụ theo người/xe tính **một lần** trên `đơn giá × số lượng × tỷ lệ` rồi mới làm tròn.
- Tổng hoá đơn làm tròn theo `roundingUnit` của toà (mặc định **1.000đ**, half-up). Phần chênh hiện thành dòng "Làm tròn" để tổng các dòng luôn khớp tổng tiền.

### Ví dụ

Toà mặc định: điện 3.500đ/kWh, nước 20.000đ/m³, internet 100.000đ/phòng, rác 30.000đ/phòng, phí chung 50.000đ/người, xe 100.000đ/xe.

**Kỳ 2026-11, hợp đồng đủ tháng**: giá thuê 3.000.000đ, 2 người, 1 xe; điện chốt 31/10 là 1.250, chốt 30/09 là 1.130; nước 31/10 là 88, 30/09 là 80.

| Dòng | Cách tính | Tiền |
| --- | --- | --- |
| Tiền phòng 11/2026 | 3.000.000 × 30/30 | 3.000.000 |
| Internet 11/2026 | 100.000 | 100.000 |
| Rác 11/2026 | 30.000 | 30.000 |
| Phí chung 11/2026 | 50.000 × 2 người | 100.000 |
| Gửi xe 11/2026 | 100.000 × 1 xe | 100.000 |
| Điện 10/2026 | (1.250 − 1.130) × 3.500 | 420.000 |
| Nước 10/2026 | (88 − 80) × 20.000 | 160.000 |
| **Tổng** | | **3.910.000** |

**Nhận phòng giữa tháng** (20/11/2026, cùng điều kiện): lập **hoá đơn nhận phòng** ngay lúc kích hoạt hợp đồng, gồm tiền phòng và dịch vụ 20–30/11 theo tỷ lệ 11/30, **không có điện nước**. Điện nước từ 20/11 đến 30/11 sẽ nằm trong hoá đơn kỳ 2026-12. Tiền cọc **không** nằm trong hoá đơn; nó được ghi riêng ở [sổ cọc](#tiền-cọc).

## Trả phòng và thanh lý

Khi trả phòng ngày `D` trong tháng M, lập **hoá đơn thanh lý** gồm:

1. Điện nước từ lần chốt gần nhất tới **chỉ số lúc trả phòng**.
2. **Tiền phòng và dịch vụ của những ngày đã ở nhưng chưa có hoá đơn** (ví dụ trả phòng 03/12 khi hoá đơn kỳ 12 chưa phát hành: tính 01–03/12 theo tỷ lệ ngày). Kỳ đã có hoá đơn thì không tính lại.
3. Hoàn tiền phòng/dịch vụ của những ngày chưa ở trong tháng M (đã trả trước). Có làm hay không tuỳ cấu hình toà `refundUnusedRent` (mặc định **không hoàn**; khi bật thì hoàn theo tỷ lệ ngày).
4. Phụ thu thanh lý (hư hỏng, dọn dẹp) do chủ trọ nhập kèm lý do.
5. Các hoá đơn trước còn nợ: **liệt kê, không cộng vào hoá đơn thanh lý**; tính vào số phải trả khi cấn trừ cọc, nhưng thanh toán vẫn ghi vào đúng hoá đơn gốc.
6. **Cấn trừ cọc:** số cọc đang giữ trừ đi tổng phải thu. Kết quả là **chủ trọ hoàn lại** hoặc **người thuê trả thêm**.

## Mã hoá đơn

`{mã toà}-{YYYYMM}-{số thứ tự 3 chữ số}`, ví dụ `A-202611-001`. Số thứ tự tăng theo toà và kỳ, cấp lúc **phát hành** (bản nháp chưa có mã), tối đa 999 hoá đơn mỗi toà mỗi kỳ. Hoá đơn nhận phòng và thanh lý dùng chung dãy số với kỳ của ngày phát hành, kèm loại hoá đơn.

## Ràng buộc

- Mỗi hợp đồng chỉ có **một hoá đơn kỳ (`monthly`) cho mỗi kỳ**, không tính hoá đơn đã void (unique `contract_id, period, kind` với điều kiện `status <> 'void'`).
- Mỗi phòng chỉ có **một hợp đồng đang hiệu lực** tại một thời điểm.
- Mỗi phòng có **một chỉ số điện và một chỉ số nước cho mỗi kỳ chốt**.
- Lập hoá đơn hàng loạt dùng `Idempotency-Key`; gọi lại không tạo trùng.
- Tiền là số nguyên VND; tổng các dòng luôn bằng tổng hoá đơn.

## Sửa sai sau khi phát hành

- **Hoá đơn chưa có thanh toán:** void (bắt buộc ghi lý do) rồi lập lại. Chỉ số của kỳ được mở khoá lại.
- **Hoá đơn đã có thanh toán:** không void. Thêm **dòng điều chỉnh** (âm hoặc dương) vào hoá đơn kỳ sau, có tham chiếu tới hoá đơn gốc.
- Đổi đơn giá **không** ảnh hưởng hoá đơn đã phát hành.

## Trạng thái

### Phòng
`vacant` (trống) → `reserved` (đã cọc giữ chỗ) → `occupied` (đang thuê) → `vacant`. `maintenance` (bảo trì) chỉ bật/tắt được khi phòng không có hợp đồng hiệu lực. Trạng thái `reserved`/`occupied` **suy ra từ hợp đồng**, không cho sửa tay.

### Hợp đồng
`draft` → `active` → `ending` (đã báo trả phòng, có ngày dự kiến) → `ended`. Ngoài ra: `draft` → `cancelled`; `active` → `ended` (thanh lý ngay, không cần báo trước); `ending` → `active` (huỷ báo trả phòng). Gia hạn giữ trạng thái `active` và lưu lịch sử ngày kết thúc.

### Hoá đơn
`draft` → `issued` → `partially_paid` → `paid`; `issued` có thể thẳng sang `paid`, và lùi lại khi huỷ bút toán thu (trạng thái luôn tính lại từ tổng đã thu). `issued` có thể chuyển `void` khi chưa có thanh toán. **Quá hạn** là trạng thái suy ra: `issued`/`partially_paid` và đã qua hạn thanh toán; không lưu thành cột.

### Thanh toán
Không sửa, không xoá. Ghi sai thì tạo **bút toán huỷ** (`reversed`, có lý do); trạng thái hoá đơn tự tính lại.

### Tiền cọc
`held` (đang giữ) → một phần hoặc toàn bộ `applied` (cấn trừ khi thanh lý), `refunded` (đã hoàn) hoặc `forfeited` (mất cọc, có lý do). Tổng các bút toán không vượt quá số đã thu.

### Chỉ số điện nước
`draft` → `locked` khi hoá đơn dùng chỉ số đó được phát hành; void hoá đơn thì mở khoá lại. Chỉ số là **số nguyên không âm** (kWh, m³).

## Giá trị mặc định cần xác nhận khi làm ST-06

Các giá trị dưới đây là mặc định đề xuất. Tất cả đều cấu hình được theo toà:

- Ngày chốt số: cuối tháng. Ngày phát hành: ngày 1. Hạn thanh toán: ngày 5.
- `roundingUnit` = 1.000đ. `refundUnusedRent` = không.
- Số người tính phí lấy tại ngày phát hành (không lấy số lớn nhất trong tháng).

## Những lỗi của SCM không được lặp lại

- Hoá đơn tham chiếu đơn giá "sống", nên sửa gói dịch vụ làm đổi hoá đơn cũ → **lưu snapshot**.
- Tính tiền ở trình duyệt, tiền lưu bằng `FLOAT` → **tính ở server, lưu `BIGINT`**.
- Không ràng buộc unique hoá đơn theo phòng/kỳ → **unique theo hợp đồng + kỳ + loại**.
- Import CSV: `roomId` sai thì tự gán phòng cũ nhất, trường thiếu thì điền `"000000000"` → **báo lỗi từng dòng, không đoán**.
- Màn tạo hàng loạt: cột "phí cố định" hiển thị khác với tổng thực tính → **một công thức duy nhất, bản xem trước lấy từ API**.
- Form một hoá đơn không chặn chỉ số mới nhỏ hơn số cũ → **validate ở server cho mọi đường nhập**.
- Xoá dữ liệu không kiểm tra phụ thuộc; không có trạng thái/hạn thanh toán; không có migration; API không xác thực → **đều nằm trong các task nền tảng**.
