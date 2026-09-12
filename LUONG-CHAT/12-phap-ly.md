# Luồng 12 — Pháp lý & trang tĩnh

> Mở luồng mới, dán: `Đọc CLAUDE.md và LUONG-CHAT/12-phap-ly.md rồi bắt đầu.`

**Phụ thuộc:** 01 · **Chặn: luồng 06 không được bật nạp tiền thật khi luồng này chưa xong**

---

## Mục tiêu

App thu tiền và thu số điện thoại của người dùng. Không có mấy trang này là hoạt động sai luật, và không cổng thanh toán nào duyệt.

## Module trong luồng

- `legal/terms` — Điều khoản sử dụng
- `legal/privacy` — Chính sách bảo mật
- `legal/refund` — **Chính sách hoàn token** *(bắt buộc vì có ví nạp trước)*
- `static/about` — Về Thuexenhanh
- `static/help` — Câu hỏi thường gặp

## Nội dung bắt buộc trong Điều khoản

Phải nói rõ, không được lấp liếm — đây chính là mô hình kinh doanh:

1. **Thuexenhanh là nền tảng thông tin, không phải bên cho thuê xe.**
2. **Không thu hoa hồng, không giữ tiền.** Giá, cọc, giao nhận do hai bên tự thoả thuận.
3. **Không chịu trách nhiệm** về chất lượng xe, tranh chấp, tai nạn, mất cọc.
4. Chủ xe **tự chịu trách nhiệm** về tính chính xác của tin đăng và tính pháp lý của xe.
5. Phí trên nền tảng là **phí hiển thị tin đăng**, không phải phí giao dịch.
6. Điều kiện bị khoá tài khoản / gỡ tin.

## Chính sách hoàn token — phải rõ ràng

Trả lời dứt khoát các câu sau, đừng để mập mờ:

- Token đã nạp có hoàn thành tiền được không? Trong bao lâu?
- Tin bị từ chối duyệt → có hoàn token không? *(khuyến nghị: **có**, hoàn toàn bộ)*
- Tin bị gỡ do vi phạm → có hoàn không? *(khuyến nghị: **không**)*
- Token có hạn sử dụng không? *(khuyến nghị: **không hết hạn** — hết hạn dễ bị coi là chiếm dụng)*
- App ngừng hoạt động thì token chưa tiêu xử lý ra sao?

## Chính sách bảo mật — nêu đúng thực tế

Thu: tên, email, avatar (Google), **số điện thoại**, ảnh xe, ảnh giấy tờ xe, lịch sử truy cập.
Nói rõ: **số điện thoại chủ xe sẽ hiển thị công khai cho khách khi họ bấm xem** — đây là mục đích chính của nền tảng.
Ảnh giấy tờ: chỉ dùng để xác minh, không công khai, xoá sau khi duyệt.

## Tiêu chí hoàn thành

- [ ] 3 trang pháp lý viết xong bằng tiếng Việt dễ hiểu, không sao chép mẫu của bên khác
- [ ] Có link ở chân trang mọi màn hình
- [ ] Lúc đăng ký có ô tích đồng ý điều khoản, **lưu lại thời điểm đồng ý và phiên bản điều khoản**
- [ ] Điều khoản có đánh số phiên bản + ngày hiệu lực
- [ ] Trang FAQ trả lời ít nhất: cách đăng xe, token là gì, vì sao tin bị ẩn, báo cáo tin sai ở đâu
- [ ] Ghi một dòng vào `CHANGELOG.md`

## Cấm

- Không sao chép điều khoản của Mioto/Chợ Tốt rồi đổi tên.
- Không viết câu hứa hẹn app không làm được ("cam kết xe chất lượng", "hoàn tiền 100%").
- Không bật nạp tiền thật trước khi trang hoàn token có hiệu lực.

> Khi nội dung chạm tới nghĩa vụ tiền bạc thật, nên cho một người có chuyên môn pháp lý đọc lại. Em soạn được bản nháp, nhưng không thay thế được tư vấn pháp lý.
