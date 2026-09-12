# Luồng 08 — Tin cậy, kiểm duyệt & chống gian lận

> Mở luồng mới, dán: `Đọc CLAUDE.md và LUONG-CHAT/08-tin-cay.md rồi bắt đầu.`

**Phụ thuộc:** 01, 02 · **Chặn:** 10

---

## Mục tiêu

App không giữ tiền, không bảo hiểm. Thứ duy nhất app bán được cho khách là **niềm tin rằng tin đăng là thật**. Luồng này làm ra niềm tin đó.

## Module trong luồng

- `trust/otp` — xác thực số điện thoại
- `trust/verify-owner` — huy hiệu xác minh
- `trust/moderation` — hàng đợi duyệt tin
- `trust/report` — khách báo cáo tin sai / lừa đảo
- `trust/anti-fraud` — chống lạm dụng

## 1. OTP số điện thoại — bắt buộc

**Không có số điện thoại đã xác thực thì không được đăng tin.** Đây là rào cản rẻ nhất và hiệu quả nhất với tin rác.

- Gửi OTP qua eSMS / Zalo ZNS.
- Một số điện thoại gắn với **một tài khoản**.
- Giới hạn: 5 lần gửi OTP / số / ngày.

## 2. Huy hiệu xác minh — thay đổi so với code cũ

Code cũ: **mua "Tích Xanh" bằng tiền**. Bỏ cách đó — bán huy hiệu tin cậy là bán niềm tin giả.

Cách mới, **miễn phí, xét theo giấy tờ**:

| Huy hiệu | Điều kiện |
|---|---|
| ✅ Đã xác thực SĐT | qua OTP |
| ✅ Đã xác minh giấy tờ xe | chủ xe gửi ảnh cà vẹt, biển số khớp tin đăng, admin duyệt |
| ✅ Chủ xe lâu năm | ≥ 6 tháng, ≥ 3 tin, không bị báo cáo |

Ảnh giấy tờ lưu **riêng, không public**, chỉ admin xem, xoá sau khi duyệt xong.

## 3. Kiểm duyệt tin

- Tin mới → `cho_duyet`. Admin duyệt ở luồng 10.
- Tự động chặn: **trùng biển số** với tin đang hiển thị của người khác, ảnh trùng tin đã bị từ chối, giá lệch bất thường so với cùng dòng xe.
- Từ chối phải có **lý do**, hiện cho chủ xe, sửa lại gửi duyệt lại được.

## 4. Báo cáo

Khách bấm "Báo cáo tin này": số không liên lạc được / xe không có thật / giá sai / lừa cọc / khác.
Ngưỡng: **3 báo cáo độc lập → tin tự ẩn**, chờ admin xử lý.

## 5. Chống gian lận

| Nguy cơ | Chặn |
|---|---|
| Bot quét sạch số điện thoại | Giới hạn 20 lượt lấy số / người / ngày; phải đăng nhập |
| Đối thủ bấm phá để đốt ví *(khi bật trừ theo lead)* | Chống trùng theo người + thiết bị, chặn theo IP |
| Một người tạo 50 tài khoản | Một SĐT một tài khoản |
| Chủ xe tự bấm xem tin mình để đẩy số liệu | Không tính sự kiện của chính chủ tin |

## Bảng CSDL

`otp_codes`, `reports`, `moderation_queue`, `admin_actions`, cột xác minh trên `users` / `listings`

## Tiêu chí hoàn thành

- [ ] Không xác thực SĐT thì không đăng được tin
- [ ] Tin mới vào hàng đợi duyệt, không tự lên thẳng
- [ ] Trùng biển số bị chặn
- [ ] Từ chối có lý do, chủ xe sửa và gửi lại được
- [ ] 3 báo cáo → tin tự ẩn
- [ ] Client **không** tự set được huy hiệu xác minh (test thật bằng cách gọi thẳng API)
- [ ] Giới hạn lấy số hoạt động
- [ ] Ghi một dòng vào `CHANGELOG.md`

## Cấm

- **Cấm bán huy hiệu xác minh bằng tiền** dưới mọi hình thức.
- Không để ảnh giấy tờ ở chỗ công khai.
- Không tự động duyệt tin để "cho nhanh".
