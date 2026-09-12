# Luồng 03 — Bảng điều khiển chủ xe

> Mở luồng mới, dán: `Đọc CLAUDE.md và LUONG-CHAT/03-chu-xe.md rồi bắt đầu.`

**Phụ thuộc:** 01, 02 · **Chặn:** 06

---

## Mục tiêu

Chủ xe mở app thấy ngay: **xe của tôi đang thế nào, còn bao lâu hết hạn, tháng qua tôi được bao nhiêu lượt xem và bao nhiêu người bấm lấy số.**

> Đây là **hàng hoá anh bán**. Không có màn này thì lúc gia hạn chủ xe không có lý do gì để nạp token tiếp.

## Module trong luồng

- `owner/dashboard` — danh sách xe của tôi, trạng thái, hạn còn lại, nút gia hạn
- `owner/analytics` — số liệu theo **từng xe** và **tổng của chủ xe**

## Số liệu phải hiện — theo từng xe

| Chỉ số | Nguồn |
|---|---|
| Lượt xem trang xe | `events` where `type = view_listing` |
| Lượt bấm lấy số / Zalo | `events` where `type = reveal_phone` |
| Tỷ lệ lấy số / lượt xem | tính ra % |
| Thứ hạng trong khu vực | so với các tin cùng tỉnh |
| Ngày hết hạn / token còn lại | `listings.expires_at`, `wallets` |

Biểu đồ: 30 ngày gần nhất, **dữ liệu thật hoặc trạng thái rỗng** — cấm số giả.

## Tổng của chủ xe

Tổng lượt xem, tổng lượt lấy số, số xe đang hiển thị / hết hạn, số dư token, ngày hết hạn gần nhất.

## Bảng CSDL

Đọc: `listings`, `events`, `wallets`, `wallet_transactions`
Ghi: không ghi gì (màn chỉ đọc, trừ nút gia hạn gọi sang luồng 06)

## Tiêu chí hoàn thành

- [ ] Danh sách xe của tôi, lọc theo trạng thái
- [ ] Mỗi xe hiện lượt xem + lượt lấy số 30 ngày
- [ ] Biểu đồ đường 30 ngày, có trạng thái rỗng tử tế khi chưa có dữ liệu
- [ ] Cảnh báo rõ khi tin sắp hết hạn (≤ 3 ngày) hoặc token không đủ
- [ ] Chủ xe A **không** xem được số liệu của chủ xe B (kiểm tra RLS)
- [ ] Ghi một dòng vào `CHANGELOG.md`

## Cấm

- **Cấm tuyệt đối số liệu giả.** Chưa có dữ liệu thì hiện "Chưa có lượt xem nào" — không hiện số bịa, không hiện dữ liệu mẫu.
- Không đếm lượt xem của chính chủ xe vào số liệu của họ.
- Không gộp lượt xem trùng: cùng một người xem 10 lần trong 1 giờ tính **1**.

## Tham chiếu từ code cũ

Không có. Màn này hoàn toàn mới — code cũ chưa từng đếm gì.
