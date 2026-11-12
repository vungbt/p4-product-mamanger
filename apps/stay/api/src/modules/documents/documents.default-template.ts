/**
 * Default "Hợp đồng thuê phòng trọ" (ST-30): a common Vietnamese residential lease, filled from
 * the template variables. Owners copy it ("Tạo từ mẫu mặc định") and edit their copy.
 */
export const DEFAULT_CONTRACT_TEMPLATE_NAME = 'Hợp đồng thuê phòng trọ';

export const DEFAULT_CONTRACT_TEMPLATE_HTML = `
<p style="text-align: center"><strong>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
<p style="text-align: center"><strong>Độc lập – Tự do – Hạnh phúc</strong></p>
<p style="text-align: center">———————</p>
<h2 style="text-align: center">HỢP ĐỒNG THUÊ PHÒNG TRỌ</h2>
<p style="text-align: center">Số: {{van_ban.ma}}</p>
<p>Căn cứ Bộ luật Dân sự số 91/2015/QH13 và nhu cầu, khả năng của các bên.</p>
<p>Hôm nay, {{van_ban.ngay_lap}}, tại {{van_ban.noi_lap}}, chúng tôi gồm:</p>
<h3>BÊN CHO THUÊ (BÊN A)</h3>
<p>Ông/Bà: <strong>{{ben_cho_thue.ho_ten}}</strong> · Ngày sinh: {{ben_cho_thue.ngay_sinh}}</p>
<p>CCCD số: {{ben_cho_thue.cccd}} · Ngày cấp: {{ben_cho_thue.ngay_cap_cccd}}</p>
<p>Thường trú: {{ben_cho_thue.thuong_tru}}</p>
<p>Điện thoại: {{ben_cho_thue.sdt}}</p>
<h3>BÊN THUÊ (BÊN B)</h3>
<p>Ông/Bà: <strong>{{ben_thue.ho_ten}}</strong> · Ngày sinh: {{ben_thue.ngay_sinh}}</p>
<p>CCCD số: {{ben_thue.cccd}} · Ngày cấp: {{ben_thue.ngay_cap_cccd}}</p>
<p>Thường trú: {{ben_thue.thuong_tru}}</p>
<p>Điện thoại: {{ben_thue.sdt}} · Nghề nghiệp: {{ben_thue.nghe_nghiep}}</p>
<p>Người ở cùng Bên B:</p>
<p>{{nguoi_o.danh_sach}}</p>
<p>Hai bên thoả thuận ký kết hợp đồng thuê phòng với các điều khoản sau:</p>
<h3>Điều 1. Phòng cho thuê</h3>
<p>Bên A đồng ý cho Bên B thuê phòng <strong>{{phong.ma}}</strong>, tầng {{phong.tang}}, diện tích {{phong.dien_tich}} m², thuộc {{toa.ten}}, địa chỉ {{toa.dia_chi}}, để ở. Số người ở tối đa: {{phong.so_nguoi_toi_da}} người.</p>
<h3>Điều 2. Thời hạn thuê</h3>
<p>Thời hạn thuê {{hop_dong.thoi_han_thang}} tháng, từ ngày {{hop_dong.ngay_bat_dau}} đến ngày {{hop_dong.ngay_ket_thuc}}. Hết hạn, hai bên có thể thoả thuận gia hạn.</p>
<h3>Điều 3. Giá thuê, tiền cọc và thanh toán</h3>
<ul>
<li><p>Giá thuê: <strong>{{hop_dong.gia_thue}} đồng/tháng</strong> (bằng chữ: {{hop_dong.gia_thue_bang_chu}}).</p></li>
<li><p>Tiền đặt cọc: <strong>{{hop_dong.tien_coc}} đồng</strong> (bằng chữ: {{hop_dong.tien_coc_bang_chu}}). Tiền cọc được hoàn trả khi thanh lý hợp đồng, sau khi cấn trừ các khoản Bên B còn nợ hoặc phải bồi thường.</p></li>
<li><p>Kỳ thu: {{ky_thu.cach_tinh}}. Hoá đơn phát hành {{ky_thu.ngay_phat_hanh}}, hạn thanh toán {{ky_thu.han_thanh_toan}}.</p></li>
<li><p>Chuyển khoản tới: {{thanh_toan.ngan_hang}} · Số tài khoản {{thanh_toan.so_tai_khoan}} · Chủ tài khoản {{thanh_toan.chu_tai_khoan}}; hoặc tiền mặt cho Bên A.</p></li>
</ul>
<h3>Điều 4. Dịch vụ</h3>
<p>Các dịch vụ và đơn giá tại ngày bắt đầu thuê:</p>
<p>{{dich_vu.bang}}</p>
<p>Đơn giá dịch vụ có thể thay đổi theo giá nhà cung cấp; Bên A báo trước cho Bên B ít nhất 30 ngày.</p>
<p>Xe đăng ký gửi: {{xe.danh_sach}}</p>
<h3>Điều 5. Quyền và nghĩa vụ của Bên A</h3>
<ul>
<li><p>Giao phòng và trang thiết bị trong phòng cho Bên B đúng thời hạn.</p></li>
<li><p>Bảo đảm cho Bên B sử dụng phòng ổn định trong thời hạn thuê; sửa chữa hư hỏng không do lỗi của Bên B.</p></li>
<li><p>Hướng dẫn và hỗ trợ Bên B đăng ký tạm trú theo quy định.</p></li>
<li><p>Thông báo trước ít nhất 30 ngày nếu chấm dứt hợp đồng trước hạn.</p></li>
</ul>
<h3>Điều 6. Quyền và nghĩa vụ của Bên B</h3>
<ul>
<li><p>Thanh toán tiền thuê và các khoản phí đúng hạn.</p></li>
<li><p>Sử dụng phòng đúng mục đích, giữ gìn tài sản; bồi thường hư hỏng do lỗi của mình.</p></li>
<li><p>Không cho người khác ở cùng ngoài danh sách đã đăng ký khi chưa được Bên A đồng ý; không chuyển nhượng hoặc cho thuê lại.</p></li>
<li><p>Chấp hành nội quy của toà nhà và quy định về an ninh trật tự, phòng cháy chữa cháy, vệ sinh môi trường.</p></li>
<li><p>Báo trước ít nhất 30 ngày khi muốn trả phòng trước hạn; trả phòng đúng hiện trạng khi nhận.</p></li>
</ul>
<h3>Điều 7. Nội quy</h3>
{{noi_quy}}
<h3>Điều 8. Chấm dứt hợp đồng</h3>
<p>Hợp đồng chấm dứt khi hết hạn mà không gia hạn, khi hai bên thoả thuận, hoặc khi một bên vi phạm nghiêm trọng nghĩa vụ. Bên đơn phương chấm dứt trái thoả thuận phải bồi thường thiệt hại theo quy định của pháp luật; Bên B tự ý trả phòng trước hạn không báo trước thì không được hoàn tiền cọc.</p>
<h3>Điều 9. Điều khoản chung</h3>
<p>Hai bên cam kết thực hiện đúng hợp đồng. Tranh chấp được giải quyết bằng thương lượng; không thương lượng được thì đưa ra Toà án có thẩm quyền. Hợp đồng được ký bằng chữ ký điện tử đơn giản theo Luật Giao dịch điện tử 2023 hoặc ký tay; mỗi bên giữ một bản và có giá trị như nhau.</p>
`.trim();
