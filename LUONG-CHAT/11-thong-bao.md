# Luồng 11 — Thông báo (Email / SMS / Zalo / in-app)

> Mở luồng mới, dán: `Đọc CLAUDE.md và LUONG-CHAT/11-thong-bao.md rồi bắt đầu.`

**Phụ thuộc:** 01, 06 · **Chặn:** không

---

## Mục tiêu

Chủ xe không bao giờ mất tin vì quên gia hạn. Đây là **tính năng giữ doanh thu**, không phải tiện ích phụ.

## Module trong luồng

- `notify/email`
- `notify/sms-zalo`
- `notify/inapp` *(có thể cắt khỏi bản đầu)*

## Danh sách thông báo — theo mức quan trọng

### 🔴 Bắt buộc, liên quan tiền
| Sự kiện | Kênh | Nội dung |
|---|---|---|
| Tin còn 3 ngày hết hạn | Email + Zalo | "Xe X còn 3 ngày. Số dư Y token." |
| Tin còn 1 ngày | Zalo | nhắc lần cuối |
| Tin đã hết hạn | Email | "Tin đã ẩn. Nạp token để hiện lại." |
| Token không đủ để gia hạn | Email + Zalo | kèm link nạp |
| Nạp token thành công | Email | biên nhận, số dư mới |

### 🟠 Vận hành
Tin được duyệt · Tin bị từ chối (kèm lý do) · Tin bị báo cáo và tạm ẩn · Tài khoản bị khoá

### 🟡 Tăng trưởng — *làm sau*
Tuần này xe của bạn có N lượt xem, M lượt lấy số · Có người lưu xe của bạn

## Nguyên tắc

1. **Mỗi thông báo phải có việc để làm.** Không gửi tin vô nghĩa.
2. **Gửi một lần.** Bảng `notifications` khoá theo `(user_id, type, ref_id)` — cron chạy lại không gửi trùng.
3. **Tắt được.** Trừ các thông báo liên quan tiền và tài khoản.
4. **Zalo ZNS cho việc gấp, email cho việc có chứng từ.** SMS chỉ dùng cho OTP vì đắt.
5. Mọi lần gửi ghi lại: gửi lúc nào, kênh nào, thành công hay không.

## Bảng CSDL

`notifications`

## Tiêu chí hoàn thành

- [ ] Cron quét tin sắp hết hạn, gửi đúng mốc 3 ngày / 1 ngày
- [ ] Chạy cron 2 lần không gửi trùng
- [ ] Nạp token xong có email biên nhận
- [ ] Tin bị từ chối → chủ xe nhận được lý do
- [ ] Trang cài đặt tắt/bật thông báo
- [ ] Ghi một dòng vào `CHANGELOG.md`

## Cấm

- Không gửi quảng cáo cho khách thuê khi chưa có sự đồng ý.
- Không dùng SMS cho việc không gấp — tốn tiền vô ích.
- Không gửi email có số điện thoại chủ xe ra ngoài.
