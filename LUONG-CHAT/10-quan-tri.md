# Luồng 10 — Trang quản trị (admin)

> Mở luồng mới, dán: `Đọc CLAUDE.md và LUONG-CHAT/10-quan-tri.md rồi bắt đầu.`

**Phụ thuộc:** 01, 06 · **Chặn:** không

---

## Mục tiêu

Anh vận hành app mà không cần mở Supabase Studio và không sửa dữ liệu bằng tay. Code cũ kích hoạt gói bằng `mailto:` — không thể vận hành như vậy.

## Module trong luồng

- `admin/listings` — duyệt / từ chối / khoá tin
- `admin/users` — khoá user, xem lịch sử
- `admin/wallet-ops` — cộng / trừ token thủ công, hoàn tiền
- `admin/revenue` — doanh thu, tỷ lệ gia hạn
- `admin/master-data` — hãng xe, tỉnh thành, tiện nghi
- `analytics/dashboard` — số liệu toàn hệ thống

## Màn hình

**Hàng đợi duyệt tin** — tin `cho_duyet`, xem đủ thông tin + ảnh, duyệt / từ chối kèm lý do, cảnh báo trùng biển số.

**Người dùng** — tìm theo SĐT/email, xem tin + ví + lịch sử, khoá/mở khoá, duyệt giấy tờ xác minh.

**Ví & giao dịch** — xem sổ, cộng/trừ token tay **bắt buộc ghi lý do**, xử lý hoàn tiền.

**Doanh thu** — token nạp trong kỳ, token tiêu, **nợ token chưa tiêu**, số chủ xe trả tiền, tỷ lệ gia hạn, doanh thu theo tỉnh.

**Sức khoẻ hệ thống** — tin đang hiển thị theo tỉnh, tổng lượt xem/lấy số theo ngày, tin bị báo cáo.

## Phân quyền

| Vai trò | Được làm |
|---|---|
| `kiem_duyet` | Duyệt tin, xử lý báo cáo. **Không** đụng ví |
| `admin` | Tất cả, kể cả thao tác ví |

**Mọi thao tác admin ghi vào `admin_actions`** — ai, lúc nào, làm gì, lý do. Bảng này **không được xoá**.

## Bảng CSDL

Đọc: gần như tất cả · Ghi: `admin_actions`, `moderation_queue`, `wallet_transactions` (qua hàm server), cột trạng thái

## Tiêu chí hoàn thành

- [ ] Duyệt / từ chối tin, chủ xe nhận được lý do
- [ ] Khoá user → tin của họ ẩn theo
- [ ] Cộng/trừ token tay, ghi sổ đúng, có lý do
- [ ] Trang doanh thu tách rõ **token đã tiêu (doanh thu)** và **token chưa tiêu (nợ)**
- [ ] Người không phải admin mở `/admin` → bị chặn (test thật)
- [ ] `admin_actions` ghi đủ mọi thao tác
- [ ] Ghi một dòng vào `CHANGELOG.md`

## Cấm

- Không sửa số dư trực tiếp trong bảng. Mọi thay đổi đi qua sổ giao dịch.
- Không xoá cứng bất cứ thứ gì. Soft delete.
- Không để đường dẫn admin đoán được mà không có kiểm tra quyền ở server.
