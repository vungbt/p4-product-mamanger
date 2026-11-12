# Spec màn hình

Danh sách **đầy đủ** các màn hình của Stay, chia theo vai trò. Mỗi màn ghi: đường dẫn, quyền, task sở hữu, nội dung, thao tác, kiểm tra hợp lệ và các trạng thái. File task (`st-NN.md`) giữ phần API và nghiệm thu; khi hai nơi mâu thuẫn, **sửa file này trước** rồi cập nhật task.

Quy ước chung cho mọi màn:

- **Mobile-first** (375px), desktop từ 1024px. Tiền hiển thị `3.910.000 ₫`; ngày `dd/MM/yyyy`; kỳ `11/2026`.
- Danh sách: tìm kiếm debounce 300ms, bộ lọc nằm trên URL (giữ khi reload/chia sẻ), phân trang từ server, trạng thái **đang tải / rỗng / lỗi + thử lại**.
- Form: lỗi field hiện tại field; lỗi chung ở đầu form; nút lưu có trạng thái đang xử lý; rời trang khi còn thay đổi chưa lưu thì hỏi lại. Sửa đồng thời → thông báo "Dữ liệu đã thay đổi, tải lại?" (409).
- Hành động có hậu quả về tiền (phát hành, void, huỷ thu, thanh lý, mất cọc) luôn có hộp xác nhận nêu rõ số tiền và bắt buộc lý do khi spec yêu cầu.
- Mọi màn quản lý nằm trong **toà đang chọn** (header); đổi toà thì dữ liệu tải lại.

## Mục lục

| Mã | Màn hình | Vai trò | Task | Mốc |
| --- | --- | --- | --- | --- |
| C-01 | Đăng nhập | Chủ trọ, quản lý | ST-04 | Nền tảng |
| C-02 | Khung ứng dụng (sidebar, bottom nav, chọn toà) | Chủ trọ, quản lý | ST-04 | Nền tảng |
| C-03 | Trang lỗi 403 / 404 / mất kết nối | Tất cả | ST-04 | Nền tảng |
| O-01 | Tổng quan tháng | Chủ trọ, quản lý | ST-19 | MVP |
| O-02 | Cài đặt: dịch vụ & đơn giá | Chủ trọ | ST-06 | MVP |
| O-03 | Cài đặt: kỳ thu | Chủ trọ | ST-06 | MVP |
| O-04 | Danh sách toà | Chủ trọ | ST-07 | MVP |
| O-05 | Form toà | Chủ trọ | ST-07 | MVP |
| O-06 | Đơn giá của toà | Chủ trọ | ST-07 | MVP |
| O-07 | Sơ đồ phòng | Chủ trọ, quản lý | ST-08 | MVP |
| O-08 | Chi tiết phòng | Chủ trọ, quản lý | ST-08 | MVP |
| O-09 | Form phòng | Chủ trọ | ST-08 | MVP |
| O-10 | Tạo nhanh nhiều phòng | Chủ trọ | ST-08 | MVP |
| O-11 | Danh sách người thuê | Chủ trọ, quản lý | ST-09 | MVP |
| O-12 | Hồ sơ người thuê | Chủ trọ, quản lý | ST-09 | MVP |
| O-13 | Form người thuê | Chủ trọ, quản lý | ST-09 | MVP |
| O-14 | Import người thuê | Chủ trọ | ST-09 | MVP |
| O-15 | Danh sách hợp đồng | Chủ trọ, quản lý | ST-10 | MVP |
| O-16 | Tạo hợp đồng (5 bước) | Chủ trọ, quản lý | ST-10 | MVP |
| O-17 | Chi tiết hợp đồng | Chủ trọ, quản lý | ST-10, ST-12 | MVP |
| O-18 | Sổ cọc | Chủ trọ | ST-11 | MVP |
| O-19 | Chốt số điện nước | Chủ trọ, quản lý | ST-13 | MVP |
| O-20 | Lập hoá đơn kỳ | Chủ trọ, quản lý | ST-14 | MVP |
| O-21 | Danh sách hoá đơn | Chủ trọ, quản lý | ST-14 | MVP |
| O-22 | Chi tiết hoá đơn | Chủ trọ, quản lý | ST-14, ST-15, ST-16 | MVP |
| O-23 | Sổ thu | Chủ trọ | ST-15 | MVP |
| O-24 | Thanh lý hợp đồng | Chủ trọ | ST-17 | MVP |
| O-25 | Công nợ | Chủ trọ, quản lý | ST-18 | MVP |
| O-26 | Yêu cầu từ người thuê | Chủ trọ, quản lý | ST-25 | MVP |
| O-27 | Chi phí vận hành | Chủ trọ | ST-20 | Quản lý |
| O-28 | Báo cáo | Chủ trọ | ST-21 | Quản lý |
| O-29 | Bảo trì (danh sách) | Chủ trọ, quản lý | ST-22 | Quản lý |
| O-30 | Chi tiết việc bảo trì | Chủ trọ, quản lý | ST-22 | Quản lý |
| O-31 | Lịch sử thay đổi | Chủ trọ | ST-23 | Quản lý |
| O-32 | Thông báo cho người thuê | Chủ trọ | ST-25 | Quản lý |
| O-33 | Thành viên (người quản lý) | Chủ trọ | ST-27 | Mở rộng |
| O-34 | Tạm trú | Chủ trọ, quản lý | ST-28 | Mở rộng |
| T-01 | Hoá đơn công khai | Bất kỳ ai có link | ST-16 | MVP |
| T-02 | Vào cổng người thuê | Người thuê | ST-25 | MVP |
| T-03 | Trang chủ người thuê | Người thuê | ST-25 | MVP |
| T-04 | Hoá đơn của tôi | Người thuê | ST-25 | MVP |
| T-05 | Chi tiết hoá đơn và thanh toán | Người thuê | ST-25 | MVP |
| T-06 | Hợp đồng của tôi | Người thuê | ST-25 | MVP |
| T-07 | Điện nước của tôi | Người thuê | ST-25 | MVP |
| T-08 | Báo hỏng (danh sách + tạo) | Người thuê | ST-25 | MVP |
| T-09 | Gửi yêu cầu cho chủ trọ | Người thuê | ST-25 | MVP |
| T-10 | Thông báo và nội quy | Người thuê | ST-25 | Quản lý |
| T-11 | Link hết hạn / bị thu hồi | Người thuê | ST-25 | MVP |
| O-35 | Thông tin bên cho thuê và chữ ký | Chủ trọ | ST-30 | Hợp đồng online |
| O-36 | Mẫu hợp đồng (danh sách) | Chủ trọ | ST-30 | Hợp đồng online |
| O-37 | Soạn mẫu hợp đồng | Chủ trọ | ST-30 | Hợp đồng online |
| O-38 | Chi tiết văn bản hợp đồng | Chủ trọ, quản lý | ST-30 | Hợp đồng online |
| O-39 | Tài sản phòng | Chủ trọ, quản lý | ST-30 (30b) | Hợp đồng online |
| T-12 | Ký văn bản | Người thuê | ST-30 | Hợp đồng online |
| T-13 | Văn bản của tôi | Người thuê | ST-30 | Hợp đồng online |
| P-01 | Kiểm tra văn bản (`/verify/:code`) | Công khai | ST-30 | Hợp đồng online |

Tổng: **3 màn chung, 39 màn chủ trọ/quản lý, 13 màn người thuê, 1 màn công khai**, cộng các hộp thoại liệt kê ở [cuối file](#hộp-thoại-và-sheet).

> Phần người thuê được **đưa vào MVP** (trước đây ST-25 ở giai đoạn mở rộng) vì đây là cách chủ trọ gửi hoá đơn và nhận báo hỏng hằng tháng. Thứ tự trong [README](README.md) đã cập nhật tương ứng.

---

## Chung

### C-01 Đăng nhập
- **Route** `/login` · công khai · ST-04
- **Nội dung:** email, mật khẩu (hiện/ẩn), "Ghi nhớ email trên máy này", nút Đăng nhập; liên kết "Quên mật khẩu" (gửi email đặt lại).
- **Kiểm tra:** email hợp lệ, mật khẩu ≥ 8 ký tự. Sai thông tin → "Email hoặc mật khẩu không đúng" (không nói rõ trường nào sai). Quá số lần → thông báo thử lại sau N phút (429).
- **Sau đăng nhập:** về trang đang định vào, mặc định Tổng quan. Đã đăng nhập mà vào `/login` → chuyển về Tổng quan.

### C-02 Khung ứng dụng
- **Desktop:** sidebar trái: Tổng quan · Phòng · Chốt số · Hoá đơn · Công nợ · Hợp đồng · Người thuê · Yêu cầu (badge số mới) · Chi phí · Báo cáo · Cài đặt. Menu chỉ hiện mục có quyền (`useCanAccess`).
- **Mobile:** bottom nav 5 mục: Tổng quan · Phòng · **Chốt số** · Hoá đơn · Thêm (mở danh sách còn lại).
- **Header:** bộ chọn toà (ẩn khi chỉ có một toà; nhớ toà gần nhất trên máy), chuông yêu cầu mới, menu tài khoản (đổi mật khẩu, đăng xuất).
- **Breadcrumb** trên desktop; mobile hiện nút quay lại + tiêu đề màn.

### C-03 Trang lỗi
- **403:** "Bạn không có quyền xem trang này" + về Tổng quan. **404:** không tìm thấy (cũng dùng khi bản ghi thuộc toà khác). **Mất kết nối:** banner trên cùng, tự ẩn khi có mạng lại; màn Chốt số vẫn cho nhập (lưu tạm trên máy).

---

## Chủ trọ và người quản lý

### O-01 Tổng quan tháng
- **Route** `/` · read Report · ST-19
- **Bộ chọn kỳ** (mặc định kỳ hiện tại).
- **Thẻ số liệu:** Phải thu kỳ này · Đã thu · Còn lại · Công nợ quá hạn (tổng mọi kỳ) · Phòng: đang thuê / trống / đã cọc / bảo trì · Tỷ lệ lấp đầy. Mỗi thẻ bấm được để mở danh sách tương ứng.
- **Việc cần làm** (sắp theo lịch tháng, ẩn mục đã xong): Chốt số (còn X/Y phòng) · Lập hoá đơn kỳ M (chưa lập / còn X nháp) · Hoá đơn chưa gửi link · Hoá đơn quá hạn · Yêu cầu mới từ người thuê · Hợp đồng hết hạn trong 30 ngày · Người đã báo trả phòng.
- **Biểu đồ:** đã thu 6 kỳ gần nhất (cột) so với phải thu (đường).
- **Rỗng:** toà chưa có phòng → hướng dẫn 3 bước: cấu hình đơn giá → tạo phòng → tạo hợp đồng.

### O-02 Cài đặt: dịch vụ & đơn giá
- **Route** `/settings/services` · manage Settings · ST-06
- **Bảng:** tên · cách tính (Điện theo kWh / Nước theo m³ / Theo phòng / Theo người / Theo xe) · đơn vị · đơn giá mặc định · trạng thái bật/tắt · thứ tự (kéo thả).
- **Thao tác:** thêm dịch vụ; sửa trên dòng (mobile: sheet); bật/tắt.
- **Kiểm tra:** tên bắt buộc, không trùng; đơn giá số nguyên ≥ 0; chỉ một dịch vụ Điện và một Nước đang bật.
- **Cảnh báo khi sửa giá:** "Áp dụng cho hoá đơn lập từ nay; hoá đơn đã phát hành không đổi." Tắt dịch vụ đang dùng → hỏi gỡ khỏi các hợp đồng từ kỳ sau hay giữ.

### O-03 Cài đặt: kỳ thu
- **Route** `/settings/billing` · manage Settings · ST-06
- **Trường:** ngày chốt số (1–28 hoặc cuối tháng) · ngày phát hành · hạn thanh toán · đơn vị làm tròn (1đ / 100đ / 1.000đ) · hoàn tiền phòng khi trả sớm (có/không) · mẫu nội dung chuyển khoản (mặc định `{mã hoá đơn}`).
- **Xem trước:** "Hoá đơn kỳ 12/2026 sẽ phát hành 01/12, hạn 05/12, gồm điện nước tháng 11."

### O-04 Danh sách toà
- **Route** `/buildings` · read Building · ST-07
- **Thẻ toà:** tên, mã, địa chỉ, số phòng, lấp đầy %, công nợ. Có một toà → vào thẳng O-05/O-07.
- **Thao tác:** thêm toà, lưu trữ (chặn khi còn hợp đồng hiệu lực, hiện danh sách phòng gây chặn).

### O-05 Form toà
- **Route** `/buildings/new`, `/buildings/:id/edit` · manage Building · ST-07
- **Trường:** mã (A–Z, 0–9, tối đa 6 ký tự; khoá khi đã có hoá đơn) · tên · địa chỉ · kỳ thu (để trống = theo hệ thống) · làm tròn · hoàn tiền phòng · **tài khoản nhận tiền**: ngân hàng (chọn trong danh sách VietQR có tìm kiếm), số tài khoản, tên chủ tài khoản (in hoa không dấu) · nội quy toà (văn bản, hiện cho người thuê ở T-10) · số điện thoại liên hệ hiển thị cho người thuê.
- **Xem trước** mã VietQR thử với số tiền 10.000đ để kiểm tra tài khoản.

### O-06 Đơn giá của toà
- **Route** `/buildings/:id/prices` · manage Building · ST-07
- **Bảng:** dịch vụ · giá mặc định · giá của toà · áp dụng từ ngày · lịch sử thay đổi (mở rộng dòng).
- **Thao tác:** đặt giá riêng từ một ngày; bỏ giá riêng (quay về mặc định từ một ngày).

### O-07 Sơ đồ phòng
- **Route** `/rooms` · read Room · ST-08
- **Lưới theo tầng** (desktop) / danh sách gọn theo tầng (mobile). Mỗi ô: mã phòng · màu trạng thái (trống xám, đã cọc vàng, đang thuê xanh, bảo trì cam) · tên người đại diện · số người · badge **Nợ** (số tiền) · biểu tượng có việc bảo trì/yêu cầu mở.
- **Bộ lọc:** trạng thái, tầng, có nợ, sắp hết hạn; tìm theo mã phòng hoặc tên người thuê.
- **Chú thích màu** cố định ở cuối; tổng số theo trạng thái ở đầu.
- **Thao tác nhanh** trên ô (menu): Tạo hợp đồng (phòng trống) · Thu tiền (có nợ) · Chốt số · Xem chi tiết.

### O-08 Chi tiết phòng
- **Route** `/rooms/:id` · read Room · ST-08
- **Khối:** thông tin phòng (tầng, diện tích, giá niêm yết, số người tối đa, dịch vụ mặc định) · hợp đồng hiện tại (người đại diện, ngày vào, giá chốt, cọc đang giữ; nút Tạo hợp đồng khi trống) · người ở · đồng hồ điện/nước (số gần nhất, thay đồng hồ) · 6 hoá đơn gần nhất · việc bảo trì đang mở.
- **Thao tác:** sửa phòng · bật/tắt bảo trì (chỉ khi trống) · lưu trữ.

### O-09 Form phòng
- **Route** `/rooms/new`, `/rooms/:id/edit` · manage Room · ST-08
- **Trường:** mã (duy nhất trong toà) · tầng · diện tích m² · giá niêm yết · số người tối đa · dịch vụ mặc định (checkbox) · khi tạo mới: số điện ban đầu, số nước ban đầu, số seri đồng hồ (tuỳ chọn) · ghi chú.

### O-10 Tạo nhanh nhiều phòng
- **Route** `/rooms/bulk` · manage Room · ST-08
- **Trường:** số tầng (từ – đến) · số phòng mỗi tầng · mẫu mã `{tầng}{số 2 chữ số}` (ví dụ 101–104) · giá niêm yết chung · số người tối đa chung · dịch vụ mặc định.
- **Xem trước** danh sách mã sẽ tạo, đánh dấu mã đã tồn tại (bỏ qua); sửa giá từng phòng trên bảng xem trước trước khi tạo.

### O-11 Danh sách người thuê
- **Route** `/tenants` · read Tenant · ST-09
- **Cột:** họ tên · SĐT (bấm gọi/Zalo trên mobile) · phòng hiện tại · trạng thái (đang ở / đã rời / chưa có hợp đồng) · đã khai báo tạm trú.
- **Lọc:** trạng thái, phòng; tìm theo tên, SĐT, 4 số cuối CCCD.
- **Thao tác:** thêm · import · xuất danh sách.

### O-12 Hồ sơ người thuê
- **Route** `/tenants/:id` · read Tenant · ST-09
- **Khối:** thông tin cá nhân · CCCD (số che giữa, nút hiện đủ có ghi audit; ảnh mặt trước/sau xem qua URL ký ngắn hạn) · xe (biển số, loại) · hợp đồng đã/đang ở · trạng thái truy cập cổng người thuê (đã mở link lần cuối lúc nào).

### O-13 Form người thuê
- **Route** `/tenants/new`, `/tenants/:id/edit` · manage Tenant · ST-09
- **Bắt buộc:** họ tên, SĐT (10 số, bắt đầu 0). **Tuỳ chọn:** email, CCCD (12 số, duy nhất), ngày cấp, ngày sinh, giới tính, quê quán, thường trú, nghề nghiệp/nơi làm, ảnh CCCD (2 mặt), xe, ghi chú.
- CCCD trùng → lỗi kèm liên kết tới hồ sơ đã có.
- Nút **Quét CCCD**: camera sau hoặc ảnh thẻ → đọc mã QR trên máy → điền họ tên, CCCD, ngày sinh, giới tính, thường trú, ngày cấp và báo các trường đã điền; chủ trọ kiểm tra rồi lưu. Lỗi quyền camera/không có camera/không đọc được → thông báo rõ, nhập tay.

### O-14 Import người thuê
- **Route** `/tenants/import` · manage Tenant · ST-09
- **Bước:** tải file mẫu (XLSX/CSV) → chọn file → **bảng xem trước**: mỗi dòng trạng thái Hợp lệ / Lỗi (tô đỏ ô lỗi, tooltip lý do) / Trùng (đã có SĐT hoặc CCCD) → chọn "Nhập X dòng hợp lệ" → kết quả.
- Không tự gán phòng, không tự điền giá trị.

### O-15 Danh sách hợp đồng
- **Route** `/contracts` · read Contract · ST-10
- **Cột:** mã HĐ · phòng · người đại diện · ngày bắt đầu · ngày kết thúc · giá thuê · cọc đang giữ · trạng thái (Nháp / Hiệu lực / Đã báo trả / Đã kết thúc / Đã huỷ).
- **Lọc:** trạng thái, sắp hết hạn (≤ 30 ngày), phòng.

### O-16 Tạo hợp đồng
- **Route** `/contracts/new?roomId=` · manage Contract · ST-10 · dạng 5 bước, lưu nháp ở mỗi bước.
1. **Phòng & thời hạn:** phòng (chỉ phòng trống) · ngày nhận phòng · thời hạn (6 / 12 tháng / tuỳ chọn ngày kết thúc) · giá thuê chốt (mặc định giá niêm yết) · ghi chú điều khoản.
2. **Người ở:** chọn người thuê có sẵn hoặc tạo nhanh (tên + SĐT) · đánh dấu người đại diện (bắt buộc 1) · cảnh báo vượt số người tối đa.
3. **Dịch vụ & xe:** danh sách dịch vụ (mặc định theo phòng) với đơn giá đang áp dụng · chọn xe tính phí từ xe của người ở.
4. **Cọc & chỉ số:** tiền cọc · đã thu chưa (phương thức, ngày, ghi chú) · số điện, số nước lúc nhận phòng (≥ số chốt gần nhất) · ảnh đồng hồ (tuỳ chọn).
5. **Xem trước & kích hoạt:** tóm tắt hợp đồng + **hoá đơn nhận phòng** do server tính (từng dòng) · chọn "Phát hành hoá đơn ngay" hoặc "Để nháp" → Kích hoạt. Sau kích hoạt: nút Chia sẻ hoá đơn và **Gửi link cổng người thuê**.

### O-17 Chi tiết hợp đồng
- **Route** `/contracts/:id` · read Contract · ST-10, ST-12
- **Tab Tổng quan:** phòng, thời hạn, giá thuê hiện tại (và lịch sử), người ở (từ ngày – đến ngày), dịch vụ, xe.
- **Tab Hoá đơn:** các hoá đơn của hợp đồng. **Tab Cọc:** bút toán và số dư (ST-11). **Tab Yêu cầu:** yêu cầu/báo hỏng từ người thuê. **Tab Lịch sử.**
- **Menu Thay đổi:** Gia hạn · Đổi giá thuê · Thêm người ở · Người ở rời đi · Thêm/bớt xe · Bật/tắt dịch vụ · Đổi phòng · Báo trả phòng · Thanh lý (O-24). Mỗi thao tác mở hộp thoại có ngày hiệu lực và khối "Ảnh hưởng tới hoá đơn".
- **Cổng người thuê:** tạo/sao chép/thu hồi link, xem lần mở gần nhất.

### O-18 Sổ cọc
- **Route** `/deposits` · read Deposit · ST-11
- **Cột:** phòng · hợp đồng · người đại diện · đã thu · đã cấn trừ · đã hoàn · đang giữ. **Tổng** cọc đang giữ của toà ở đầu trang.
- **Thao tác** (theo dòng): Thu thêm cọc · Hoàn cọc · Mất cọc (bắt buộc lý do).

### O-19 Chốt số điện nước
- **Route** `/readings?period=` · manage MeterReading · ST-13
- **Đầu trang:** kỳ (mặc định kỳ cần chốt), lọc tầng, tiến độ "đã nhập 7/9", nút "Lập hoá đơn kỳ M" khi đủ.
- **Thẻ mỗi phòng:** mã phòng · Điện: số cũ → **ô số mới** → tiêu thụ · Nước: tương tự · ảnh (tuỳ chọn) · trạng thái đã lưu / đang lưu / chưa đồng bộ / lỗi.
- **Nhập:** bàn phím số; Enter chuyển ô kế tiếp, hết phòng thì sang phòng sau; lưu tự động từng phòng.
- **Kiểm tra:** số mới < số cũ → chặn (đỏ) · tiêu thụ > 2 lần trung bình 3 kỳ → cảnh báo vàng, cần xác nhận · tiêu thụ 0 khi phòng có người → cảnh báo nhẹ.
- **Thay đồng hồ:** hộp thoại nhập số cuối đồng hồ cũ, số đầu đồng hồ mới, ngày thay, seri mới.
- **Offline:** giữ bản nhập trên máy, đồng bộ khi có mạng; báo rõ số phòng chưa đồng bộ.

### O-20 Lập hoá đơn kỳ
- **Route** `/billing/:period` · manage Invoice · ST-14
- **Bước 1 – Kiểm tra:** bảng hợp đồng · đủ chỉ số? (thiếu → liên kết sang O-19) · tiền phòng · dịch vụ · điện · nước · tổng dự kiến. Hợp đồng bị loại hiện lý do.
- **Bước 2 – Bản nháp:** nút "Tạo bản nháp" (gọi lại an toàn) · danh sách nháp · mở từng hoá đơn để thêm **phụ thu / giảm trừ** (mô tả, số tiền, lý do).
- **Bước 3 – Phát hành:** chọn tất cả/một số → xác nhận "Phát hành X hoá đơn, tổng Y đ" → cấp mã. Sau phát hành: nút **Chia sẻ hàng loạt** (danh sách link + ảnh từng phòng).

### O-21 Danh sách hoá đơn
- **Route** `/invoices` · read Invoice · ST-14
- **Cột:** mã · phòng · loại (Kỳ / Nhận phòng / Thanh lý) · kỳ · tổng · đã thu · còn lại · hạn · trạng thái (Nháp / Chưa thu / Thu một phần / Đã thu / **Quá hạn** / Đã huỷ) · đã gửi link chưa.
- **Lọc:** kỳ, trạng thái, loại, phòng, quá hạn. **Tổng** của bộ lọc ở cuối bảng.

### O-22 Chi tiết hoá đơn
- **Route** `/invoices/:id` · read Invoice · ST-14, ST-15, ST-16
- **Đầu:** mã, phòng, kỳ, ngày phát hành, hạn, trạng thái.
- **Bảng dòng:** mô tả · cách tính (ví dụ "(1.250 − 1.130) kWh × 3.500 đ") · thành tiền; dòng làm tròn; **tổng**.
- **Thanh toán:** lịch sử (ngày, số tiền, phương thức, người ghi) · nút **Thu tiền** · huỷ bút toán (lý do).
- **Thao tác:** Chia sẻ (sao chép link, Web Share, tải ảnh, in PDF) · Thu hồi link · Void (khi chưa có thanh toán, bắt buộc lý do) · Thêm phụ thu/giảm trừ (khi còn nháp).

### O-23 Sổ thu
- **Route** `/payments` · read Payment · ST-15
- **Lọc:** khoảng ngày, phương thức. **Cột:** ngày · hoá đơn · phòng · số tiền · phương thức · mã giao dịch · người ghi · trạng thái (đã huỷ gạch ngang). **Tổng** theo phương thức để đối chiếu sao kê.

### O-24 Thanh lý hợp đồng
- **Route** `/contracts/:id/settle` · manage Contract · ST-17
1. Ngày trả phòng · số điện, số nước cuối (≥ số chốt gần nhất) · ảnh.
2. Phụ thu thanh lý: nhiều dòng (mô tả, số tiền, lý do), ví dụ hư hỏng, dọn dẹp.
3. **Tổng hợp từ server:** điện nước cuối · hoàn tiền ngày chưa ở (nếu toà bật) · phụ thu · nợ các kỳ trước · cọc đang giữ → **Chủ trọ hoàn X đ** hoặc **Người thuê trả thêm Y đ**.
4. Xác nhận → hoá đơn thanh lý + biên bản (chia sẻ như hoá đơn) · phòng về trống · link cổng người thuê tự thu hồi sau 30 ngày (để người thuê xem lại biên bản).

### O-25 Công nợ
- **Route** `/receivables` · read Invoice · ST-18
- **Nhóm:** chưa tới hạn · quá hạn 1–7 ngày · 8–30 ngày · > 30 ngày. **Cột:** phòng · người đại diện · số kỳ nợ · tổng còn lại · quá hạn lâu nhất.
- **Thao tác:** Thu tiền · Gọi · Gửi lại link hoá đơn. **Tổng công nợ** ở đầu trang.

### O-26 Yêu cầu từ người thuê
- **Route** `/requests` · manage Maintenance · ST-25
- **Danh sách** báo hỏng và yêu cầu khác từ T-08/T-09: loại · phòng · người gửi · thời gian · trạng thái (Mới / Đang xử lý / Xong / Từ chối) · ảnh.
- **Thao tác:** nhận xử lý · chuyển thành việc bảo trì (O-30) · trả lời (người thuê thấy ở T-08/T-09) · từ chối (lý do) · với yêu cầu **báo trả phòng**: xác nhận → hợp đồng sang "Đã báo trả".

### O-27 Chi phí vận hành
- **Route** `/expenses` · manage Expense · ST-20
- **Danh sách theo kỳ**, tổng theo danh mục ở đầu. **Form:** số tiền · danh mục · ngày chi · phòng (tuỳ chọn) · ghi chú · ảnh hoá đơn. Quản lý danh mục trong Cài đặt.

### O-28 Báo cáo
- **Route** `/reports` · read Report · ST-21
- **Tab:** Doanh thu – chi phí – lãi/lỗ theo tháng (cột + bảng) · Theo phòng (doanh thu, số tháng có người) · Điện nước (kWh/m³ thu của người thuê so với chi phí điện nước tổng). Chọn khoảng thời gian; **Xuất Excel**.
- Ghi chú cố định: "Đã thu tính theo ngày thu; phải thu tính theo kỳ hoá đơn."

### O-29 Bảo trì (danh sách)
- **Route** `/maintenance` · read Maintenance · ST-22
- **Thẻ theo trạng thái** (Mở / Đang làm / Xong / Huỷ): tiêu đề · phòng · ngày tạo · nguồn (chủ trọ / người thuê) · chi phí.

### O-30 Chi tiết việc bảo trì
- **Route** `/maintenance/:id` · ST-22
- **Nội dung:** mô tả, ảnh, lịch sử trạng thái, trao đổi với người thuê (nếu từ T-08). **Thao tác:** chuyển trạng thái · ghi chi phí (tạo khoản chi O-27).

### O-31 Lịch sử thay đổi
- **Route** `/audit` · read AuditLog · ST-23
- **Dòng thời gian:** thời điểm · người · hành động · bản ghi (liên kết). **Lọc:** người, loại dữ liệu, hành động, khoảng ngày. Không hiện CCCD, token, mật khẩu.

### O-32 Thông báo cho người thuê
- **Route** `/announcements` · manage Building · ST-25
- **Danh sách** thông báo đã gửi. **Form:** tiêu đề · nội dung · gửi cho cả toà hoặc một số phòng · ghim · hết hạn hiển thị. Người thuê thấy ở T-10.

### O-33 Thành viên
- **Route** `/settings/members` · manage Member · ST-27
- **Danh sách** người quản lý (email, toà được gán, nhóm quyền, trạng thái) · mời qua email · sửa toà/quyền · khoá tài khoản.

### O-34 Tạm trú
- **Route** `/residents` · read Tenant · ST-28
- **Danh sách** người đang ở tại một ngày (họ tên, ngày sinh, CCCD, quê quán, phòng, ngày đến) · cột Đã khai báo · lọc người mới chưa khai báo · đánh dấu đã khai báo · **Xuất Excel** (ghi audit).

---

## Người thuê

Người thuê **không tạo tài khoản**. Mỗi người ở trong hợp đồng nhận một **link cổng riêng** (chủ trọ gửi qua Zalo/SMS), mở lần đầu phải **xác minh 4 số cuối SĐT** của chính họ; thiết bị đã xác minh được ghi nhớ 90 ngày. Link thu hồi được và tự hết hiệu lực sau khi hợp đồng kết thúc 30 ngày. Quyền dùng role CASL `tenant` với điều kiện `contractId`. Giao diện riêng tối giản, không có menu quản lý.

Điều hướng cổng (bottom nav): **Trang chủ · Hoá đơn · Báo hỏng · Hợp đồng · Thêm** (Điện nước, Gửi yêu cầu, Thông báo & nội quy, Liên hệ).

### T-01 Hoá đơn công khai
- **Route** `/i/:token` · link chia sẻ của một hoá đơn · ST-16
- **Nội dung:** tên toà · phòng · kỳ · mã hoá đơn · hạn thanh toán · bảng dòng (như O-22, không có ghi chú nội bộ) · tổng · đã thu · **còn lại** · **mã VietQR** (số tiền = còn lại, nội dung = mã hoá đơn) · số tài khoản, ngân hàng, chủ tài khoản (nút sao chép từng trường) · trạng thái "Đã thanh toán" khi đủ.
- **Thao tác:** tải ảnh QR · in/lưu PDF · "Mở cổng người thuê" (nếu đã có link cổng trên máy).
- **Không hiện:** CCCD, SĐT đầy đủ, tên người thuê (chỉ tên viết tắt của người đại diện).

### T-02 Vào cổng người thuê
- **Route** `/p/:token` · ST-25
- Lần đầu trên thiết bị: "Xin chào, phòng 101 – Toà A" + ô nhập **4 số cuối SĐT** → vào T-03. Sai 5 lần → khoá link 15 phút. Đã xác minh → vào thẳng T-03.

### T-03 Trang chủ người thuê
- **Route** `/p` · ST-25
- **Khối:** hoá đơn kỳ hiện tại (tổng, còn lại, hạn, trạng thái, nút **Thanh toán** → T-05) · tổng nợ các kỳ trước (nếu có) · yêu cầu/báo hỏng đang mở · thông báo ghim từ chủ trọ · liên hệ nhanh (gọi / Zalo chủ trọ).

### T-04 Hoá đơn của tôi
- **Route** `/p/invoices` · ST-25
- **Danh sách** theo kỳ: kỳ · tổng · đã thu · còn lại · trạng thái. Bấm để mở T-05.

### T-05 Chi tiết hoá đơn và thanh toán
- **Route** `/p/invoices/:id` · ST-25
- Như T-01, cộng **lịch sử thanh toán** của hoá đơn và nút **"Tôi đã chuyển khoản"**: người thuê nhập số tiền, ngày, ảnh biên lai (tuỳ chọn) → tạo **yêu cầu xác nhận thanh toán** cho chủ trọ (O-26). Chỉ khi chủ trọ xác nhận mới ghi vào sổ thu; người thuê thấy trạng thái "Đang chờ xác nhận".

### T-06 Hợp đồng của tôi
- **Route** `/p/contract` · ST-25 · chỉ xem
- **Nội dung:** phòng · ngày bắt đầu/kết thúc · giá thuê hiện tại · dịch vụ và đơn giá đang áp dụng · người ở cùng (tên) · xe đăng ký · **tiền cọc đang giữ** · ngày phát hành và hạn thanh toán hằng tháng.

### T-07 Điện nước của tôi
- **Route** `/p/usage` · ST-25
- **Bảng** theo kỳ: chỉ số đầu/cuối, tiêu thụ, đơn giá, thành tiền cho điện và nước · **biểu đồ** tiêu thụ 12 kỳ · ảnh đồng hồ (nếu chủ trọ có chụp) để người thuê tự đối chiếu.

### T-08 Báo hỏng
- **Route** `/p/maintenance`, `/p/maintenance/new` · ST-25
- **Danh sách** yêu cầu đã gửi: tiêu đề · ngày · trạng thái · trả lời của chủ trọ.
- **Form:** hạng mục (điện, nước, thiết bị, khác) · mô tả · ảnh (tối đa 5) · mức độ (bình thường / gấp). Giới hạn 10 yêu cầu/ngày/hợp đồng.

### T-09 Gửi yêu cầu cho chủ trọ
- **Route** `/p/requests/new` · ST-25
- **Loại yêu cầu:** **Báo trả phòng** (ngày dự kiến, lý do) · **Thêm/bớt người ở** (tên, SĐT, từ ngày) · **Thêm/bớt xe** (biển số, loại, từ ngày) · **Khác** (nội dung).
- Mọi yêu cầu chỉ là đề nghị: chủ trọ duyệt ở O-26 mới thay đổi hợp đồng. Người thuê thấy trạng thái và trả lời.

### T-10 Thông báo và nội quy
- **Route** `/p/notices` · ST-25
- **Thông báo** của chủ trọ (O-32), mới nhất trên cùng, ghim ở đầu · **nội quy toà** (từ O-05) · thông tin liên hệ chủ trọ.

### T-11 Link hết hạn / bị thu hồi
- Thông báo "Link không còn hiệu lực, vui lòng liên hệ chủ trọ" kèm số điện thoại liên hệ của toà (nếu có). Không tiết lộ link có từng tồn tại hay không.

---

## Hợp đồng online

Chi tiết nghiệp vụ, biến trong mẫu và trạng thái văn bản: [st-30.md](st-30.md).

### O-35 Thông tin bên cho thuê và chữ ký
- **Route** `/settings/landlord` · manage Settings · ST-30
- **Trường:** họ tên, ngày sinh, CCCD, ngày cấp, thường trú, SĐT · **chữ ký mẫu**: vẽ trên màn hình (canvas, nút Xoá/Vẽ lại) hoặc tải ảnh PNG/JPG nền trong; xem trước chữ ký trên trang ký mẫu.
- CCCD và chữ ký lưu riêng tư; chỉ chủ trọ xem.

### O-36 Mẫu hợp đồng
- **Route** `/settings/contract-templates` · manage Settings · ST-30
- **Danh sách** theo loại (Hợp đồng · Phụ lục · Biên bản bàn giao · Biên bản thanh lý) và toà: tên, phiên bản hiện tại, ngày sửa, số văn bản đã dùng.
- **Thao tác:** tạo từ mẫu mặc định · tạo trống · sao chép · tắt (mẫu đã dùng không xoá).

### O-37 Soạn mẫu hợp đồng
- **Route** `/settings/contract-templates/:id` · manage Settings · ST-30
- **Trái:** trình soạn thảo (`@itclabs/react-ui/editor`): tiêu đề, đoạn, danh sách, bảng, in đậm/nghiêng, căn lề.
- **Phải:** danh sách **biến** theo nhóm, bấm để chèn; mô tả và ví dụ của từng biến; biến không hợp lệ trong nội dung bị gạch đỏ.
- **Xem trước:** với dữ liệu mẫu hoặc chọn một hợp đồng thật; xem như PDF A4.
- **Lưu** tạo phiên bản mới (ghi chú thay đổi); lịch sử phiên bản xem lại được, khôi phục = tạo phiên bản mới từ bản cũ.
- Mobile: chỉ xem và xem trước; soạn thảo trên desktop (hiện thông báo).

### Tab "Văn bản" trong O-17 Chi tiết hợp đồng
- Danh sách văn bản của hợp đồng: mã, loại, trạng thái (Nháp / Đã gửi / Đã xem / Người thuê đã ký / Hoàn tất / Từ chối / Đã huỷ / Ký giấy / Bị thay thế / Hết hạn), ngày.
- **Tạo văn bản:** chọn loại + mẫu → app điền dữ liệu → nếu thiếu trường bắt buộc hiện danh sách và liên kết tới chỗ sửa (hồ sơ người thuê, thông tin bên cho thuê…).

### O-38 Chi tiết văn bản hợp đồng
- **Route** `/contracts/:id/documents/:documentId` · read Contract · ST-30
- **Nội dung** dạng trang A4 (bản nháp sửa được, đánh dấu "đã sửa tay" nếu khác mẫu).
- **Người ký:** từng người, bắt buộc/tuỳ chọn, trạng thái, thời điểm; nút sao chép link ký / gửi lại / thu hồi.
- **Thao tác:** Gửi (chọn người ký, thứ tự ký) · Chủ trọ ký (xác nhận lại mật khẩu) · Tải PDF · Huỷ (lý do) · Đánh dấu ký giấy + tải scan · Tạo văn bản thay thế.
- **Lịch sử sự kiện:** tạo, gửi, xem, ký, từ chối, tải… kèm thời điểm và thiết bị.

### O-39 Tài sản phòng (30b)
- **Trong O-08 Chi tiết phòng**, tab Tài sản: tên, số lượng, tình trạng, giá trị bồi thường, ảnh. Dùng làm danh mục cho biên bản bàn giao.

### T-12 Ký văn bản
- **Route** `/p/documents/:id` · tenant · ST-30
- Hiển thị văn bản đầy đủ, dễ đọc trên điện thoại (cỡ chữ lớn, không cần zoom). Thanh tiến độ đọc; nút **Ký** chỉ bật khi đã cuộn hết.
- **Ký:** tick "Tôi đã đọc và đồng ý toàn bộ nội dung" · nhập họ tên đầy đủ (phải khớp hồ sơ, không phân biệt hoa thường/dấu cách thừa) · nhập 4 số cuối SĐT · **vẽ chữ ký** (hoặc "Dùng chữ ký đánh máy") · Xác nhận.
- **Từ chối:** lý do bắt buộc.
- Sau khi ký: trạng thái "Đã ký, chờ chủ trọ ký" hoặc "Hoàn tất" + nút tải PDF.
- Ghi chú pháp lý ngắn: chữ ký điện tử đơn giản, có giá trị làm bằng chứng; có thể yêu cầu bản giấy.

### T-13 Văn bản của tôi
- **Route** `/p/documents` · tenant · ST-30
- Danh sách văn bản của hợp đồng: loại, trạng thái, ngày; văn bản chờ mình ký nổi lên đầu và hiện badge ở trang chủ (T-03).

### P-01 Kiểm tra văn bản
- **Route** `/verify/:code` · công khai · ST-30
- Nhập/quét mã văn bản (in ở chân trang PDF) → hiện: loại văn bản, toà, trạng thái, số người đã ký, thời điểm hoàn tất. Tải lên file PDF → báo **khớp** hoặc **không khớp** mã băm. Không hiện nội dung, tên hay CCCD.

## Hộp thoại và sheet

| Hộp thoại | Mở từ | Nội dung chính |
| --- | --- | --- |
| Thu tiền | O-07, O-22, O-25 | Số tiền (mặc định còn lại, nút "Thu đủ"), phương thức, ngày, mã giao dịch, ghi chú |
| Xác nhận thanh toán từ người thuê | O-26 | Ảnh biên lai, số tiền người thuê khai → xác nhận (tạo thu) / từ chối (lý do) |
| Huỷ bút toán thu | O-22, O-23 | Lý do bắt buộc, số tiền bị huỷ |
| Chia sẻ hoá đơn | O-20, O-22 | Sao chép link, Web Share, tải ảnh, in PDF, thu hồi |
| Gửi link cổng người thuê | O-16, O-17 | Chọn người ở, sao chép link/tin nhắn mẫu, thu hồi |
| Thay đồng hồ | O-08, O-19 | Số cuối đồng hồ cũ, số đầu đồng hồ mới, ngày, seri |
| Gia hạn | O-17 | Ngày kết thúc mới, giá mới (tuỳ chọn) từ ngày |
| Đổi giá thuê | O-17 | Giá mới, từ ngày, ảnh hưởng hoá đơn |
| Thêm người ở / Người ở rời đi | O-17, O-26 | Người thuê, từ/đến ngày |
| Thêm/bớt xe | O-17, O-26 | Xe, từ ngày |
| Bật/tắt dịch vụ | O-17 | Dịch vụ, từ ngày |
| Đổi phòng | O-17 | Phòng mới, ngày, chỉ số phòng cũ/mới, giá mới |
| Báo trả phòng | O-17, O-26 | Ngày dự kiến, ghi chú |
| Phụ thu / giảm trừ | O-20, O-22 | Mô tả, số tiền (âm/dương), lý do |
| Void hoá đơn | O-22 | Lý do bắt buộc; cảnh báo mở khoá chỉ số |
| Bút toán cọc | O-17, O-18 | Loại (thu thêm / hoàn / mất), số tiền, ngày, lý do |
| Bật/tắt bảo trì phòng | O-08 | Lý do, ngày dự kiến xong |
| Tạo văn bản hợp đồng | O-17 | Loại, mẫu, danh sách trường còn thiếu |
| Gửi văn bản để ký | O-38 | Người ký (bắt buộc/tuỳ chọn), thứ tự ký, sao chép link/tin nhắn mẫu |
| Chủ trọ ký | O-38 | Xem trước chữ ký, xác nhận lại mật khẩu |
| Đánh dấu ký giấy | O-38 | Tải bản scan (PDF/ảnh), ngày ký |
| Vẽ chữ ký | O-35, T-12 | Canvas, Xoá, Vẽ lại, dùng chữ ký đánh máy |

## Thay đổi so với kế hoạch trước

Spec này bổ sung so với các file task, các task tương ứng đã được cập nhật:

- **Cổng người thuê vào MVP** (ST-25 chuyển lên sau ST-19), gồm T-02 → T-09 và T-11; T-10 và O-32 (thông báo) ở mốc Quản lý.
- **Xác minh 4 số cuối SĐT** khi mở cổng lần đầu, link riêng cho từng người ở.
- **"Tôi đã chuyển khoản"** (T-05) → yêu cầu xác nhận thanh toán cho chủ trọ; không tự ghi sổ thu.
- **Yêu cầu từ người thuê** (T-09): báo trả phòng, thêm/bớt người ở, thêm/bớt xe; chủ trọ duyệt ở **O-26**.
- **Toà nhà có nội quy và số liên hệ** hiển thị cho người thuê (O-05).
- Dữ liệu mới: `tenant_portal_links`, `tenant_requests`, `payment_claims`, `announcements` (xem [data-model.md](data-model.md#cổng-người-thuê)).
