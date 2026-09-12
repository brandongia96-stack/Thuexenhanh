# Luồng 06 — Ví token & thanh toán

> Mở luồng mới, dán: `Đọc CLAUDE.md và LUONG-CHAT/06-vi-token.md rồi bắt đầu.`

**Phụ thuộc:** 01, 03 · **Chặn:** 07, 10, 11

⚠️ **Luồng nhạy cảm nhất.** Sai ở đây là mất tiền thật của người khác. Đọc hết trước khi viết dòng code đầu tiên.

---

## Mục tiêu

Chủ xe nạp tiền → nhận token → token bị trừ để tin được hiển thị.

## Mô hình giá đã chốt

| | |
|---|---|
| **1 token** | **4.000đ** |
| **Giá hiển thị** | **10 token / 1 xe / 1 tháng** = 40.000đ |
| 3 tháng | 30 token (tuyến tính, chưa giảm giá) |
| Gói vĩnh viễn | **ĐÃ BỎ** — không có tin sống mãi |
| Trừ theo lead | **chưa bật** — hạ tầng ví có sẵn để bật sau |
| Đẩy tin | luồng 07, chưa bật |

## Module trong luồng

- `billing/wallet` — số dư + sổ giao dịch
- `billing/topup` — nạp token qua VietQR + webhook đối soát
- `billing/charging` — trừ token theo tin/tháng, gia hạn, hết token → ẩn tin
- `billing/receipt` — biên nhận *(có thể để sau)*

## Luật kế toán — không được vi phạm

1. **`wallet_transactions` chỉ ghi thêm.** Không UPDATE, không DELETE. Ghi sai thì ghi dòng đảo ngược.
2. **Số dư = tổng các dòng giao dịch.** Không lưu một cột `balance` rồi tự cộng trừ — lệch là không truy được.
3. **Tách `token_da_nap` và `token_da_tieu`.** Token đã nạp chưa tiêu là **nợ phải trả**, không phải doanh thu.
4. Mỗi dòng giao dịch phải có: loại, số token, số dư sau, lý do, tham chiếu (mã tin / mã nạp), thời điểm.
5. **Trừ token phải idempotent.** Webhook ngân hàng bắn 2 lần thì chỉ cộng 1 lần — khoá theo mã giao dịch ngân hàng.
6. **Client không bao giờ được ghi vào bảng ví.** Mọi thay đổi số dư đi qua server/Edge Function.

## Nạp tiền

- **VietQR động** qua SePay / PayOS / Casso — mã QR có sẵn số tiền + nội dung chuyển khoản có mã đối soát.
- Webhook ngân hàng về → đối chiếu nội dung → cộng token → ghi giao dịch.
- **Cấm** kiểu cũ: QR tĩnh + nút "Tôi đã thanh toán" + `mailto:` kích hoạt tay. QR trong code cũ **không phải QR ngân hàng**, chỉ là ảnh chứa chuỗi text.

## Trừ tiền

- Tin đăng/gia hạn → trừ 10 token, `expires_at = now + 30 ngày`.
- Trước hạn 3 ngày → thông báo (luồng 11).
- Đến hạn, đủ token và chủ xe bật tự gia hạn → trừ tiếp.
- Đến hạn, **không đủ token** → tin chuyển `het_han`, ẩn khỏi tìm kiếm, **dữ liệu giữ nguyên**, nạp vào là hiện lại.

## Bảng CSDL

`wallets`, `wallet_transactions`, `topups`, `charges`

## Tiêu chí hoàn thành

- [ ] Nạp tiền thật qua VietQR, webhook cộng token tự động
- [ ] Webhook gửi trùng 2 lần → chỉ cộng 1 lần
- [ ] Đăng tin trừ đúng 10 token, ghi đúng sổ
- [ ] Hết token → tin tự ẩn, nạp vào hiện lại nguyên vẹn
- [ ] Tổng sổ giao dịch = số dư hiển thị, kiểm tra bằng câu SQL đối chiếu
- [ ] Client gọi thẳng vào bảng ví → **bị RLS chặn** (phải test thật)
- [ ] Trang điều khoản hoàn token đã có (luồng 12) trước khi bật nạp tiền thật
- [ ] Ghi một dòng vào `CHANGELOG.md`

## Cấm

- Không giữ tiền thuê xe. App **chỉ** thu phí hiển thị. Không escrow, không hoa hồng (nguyên tắc 1.1).
- Không cho token âm.
- Không bật nạp tiền thật khi chưa có `legal/refund`.

## Tham chiếu từ code cũ

- `Web thue xe/src/App.jsx` → `UpgradeModal` (dòng 1672) — **chỉ để xem cái sai**, không bê sang.
