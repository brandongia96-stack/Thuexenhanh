# Luồng 05 — Trang chi tiết xe & liên hệ

> Mở luồng mới, dán: `Đọc CLAUDE.md và LUONG-CHAT/05-trang-xe.md rồi bắt đầu.`

**Phụ thuộc:** 01, 02 · **Chặn:** 09
**Bắt buộc đọc thêm:** `HIEU-NANG.md` mục 1.4 (slider), 5 (cache), 6 (cảm nhận nhanh)

---

## Mục tiêu

Khách xem đủ thông tin để quyết định, rồi **bấm lấy số chủ xe**. Sự kiện lấy số đó là thứ duy nhất app này tạo ra — phải ghi nhận chính xác.

## Module trong luồng

- `discovery/listing-page` — trang chi tiết xe
- `discovery/contact` — lộ số điện thoại + Zalo, ghi sự kiện lead
- `discovery/saved` — xe đã lưu *(code cũ hỏng, làm lại)*

## Nút hành động — đọc kỹ

Ruột app là **rao vặt**, không có đặt xe. Nút chính **phải là**:

```
[ Xem số điện thoại ]   →   [ 09xx xxx xxx ]   →   [ Gọi ]  [ Nhắn Zalo ]
```

**Cấm nút "Đặt xe ngay", "Thuê ngay", "Đặt lịch"** — app không giữ chỗ được, hứa là lừa kỳ vọng (nguyên tắc 1.2 trong `CLAUDE.md`).

Dưới nút phải có một dòng nhỏ, không được bỏ:
> *Thuexenhanh chỉ cung cấp thông tin. Giá cả, cọc và giao nhận do anh/chị và chủ xe tự thoả thuận.*

## Ghi nhận sự kiện

| Hành động | Sự kiện ghi vào `events` |
|---|---|
| Mở trang xe | `view_listing` |
| Bấm xem số | `reveal_phone` |
| Bấm Gọi | `click_call` |
| Bấm Zalo | `click_zalo` |

Chống nhiễu: cùng người + cùng xe trong 1 giờ chỉ tính **1 lần**. Chủ xe xem tin của chính mình **không tính**.

## Nội dung trang

Ảnh (slider) · tên xe · giá ngày/giờ/tháng · cọc · nơi nhận · thông số kỹ thuật · giấy tờ yêu cầu · mô tả · tiện nghi · điều kiện thuê · lịch chặn ngày (chỉ hiện, khách không đặt được) · huy hiệu xác minh nếu có.

**Graceful degradation:** tin gói Cơ Bản thiếu thông số → **ẩn cả khối**, không hiện nhãn với ô trống.

## Bảng CSDL

Đọc: `listings`, `listing_images`, `listing_blocked_dates`, `users`
Ghi: `events`, `saved_listings`

## Tiêu chí hoàn thành

- [ ] Trang chi tiết hiện đủ, thiếu dữ liệu thì ẩn khối
- [ ] Luồng lấy số 3 bước chạy, gọi/Zalo mở đúng
- [ ] 4 loại sự kiện ghi đúng vào `events`, có chống trùng 1 giờ
- [ ] Lưu xe **lưu thật vào CSDL** *(code cũ chỉ đổi state, không lưu)*
- [ ] Có dòng miễn trừ trách nhiệm
- [ ] Tin hết hạn mở link trực tiếp → hiện "Tin đã hết hạn", không hiện số điện thoại
- [ ] Ảnh bìa dùng `medium`; `full` **chỉ tải khi bấm phóng to**; slider prefetch đúng 1 ảnh kế tiếp
- [ ] Bấm tim "Lưu xe" đổi màu ngay (optimistic), lỗi thì hoàn lại
- [ ] Bấm **Quay lại** hiện lại danh sách tức thì, đúng vị trí đã cuộn
- [ ] Bản đồ là **ảnh tĩnh + nút "Mở bản đồ"**, không nhúng iframe
- [ ] Ghi một dòng vào `CHANGELOG.md`

## Cấm

- **Gỡ sạch đánh giá giả.** Code cũ hardcode 2 bình luận + 5 sao. Chưa có đánh giá thật (luồng 09) thì hiện "Chưa có đánh giá".
- Cấm "5.0 · 15+ chuyến" bịa trên thẻ xe.
- Không hiện số điện thoại trong HTML trước khi khách bấm — bot sẽ quét sạch.

## Tham chiếu từ code cũ

- `Web thue xe/src/App.jsx` → `CarDetailModal` (dòng 1501), `CarCard` (1385), `ImageSlider` (1350), `InfoPanel` (2137), `MapModal` (2114)
