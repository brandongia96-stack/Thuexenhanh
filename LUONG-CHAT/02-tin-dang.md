# Luồng 02 — Tin đăng xe (chủ xe)

> Mở luồng mới, dán: `Đọc CLAUDE.md và LUONG-CHAT/02-tin-dang.md rồi bắt đầu.`

**Phụ thuộc:** 01 · **Chặn:** 03, 04, 05, 08

---

## Mục tiêu

Chủ xe đăng được một chiếc xe lên hệ thống, có ảnh, có lịch chặn ngày, và tin đó có **vòng đời + hạn sử dụng**.

## Module trong luồng

- `listing/editor` — form đăng/sửa xe, 2 gói trường (Cơ Bản / Đầy đủ)
- `listing/media` — upload ảnh, nén ở client, sắp xếp, chọn ảnh bìa
- `listing/availability` — lịch chặn ngày xe không cho thuê
- `listing/lifecycle` — trạng thái tin + gia hạn

## Vòng đời tin — bắt buộc đúng

```
nhap → cho_duyet → dang_hien_thi → sap_het_han → het_han → an
                ↘ tu_choi (có lý do)
```

- Tin **luôn có hạn**. Không có tin sống vĩnh viễn (gói "vĩnh viễn 199K" đã bị bỏ).
- `sap_het_han` = còn 3 ngày → kích hoạt thông báo (luồng 11).
- `het_han` → tin **ẩn khỏi tìm kiếm** nhưng dữ liệu giữ nguyên, gia hạn là hiện lại.
- Hết token → tin tự chuyển `het_han` (logic trừ tiền ở luồng 06, luồng này chỉ để sẵn cột và trạng thái).

## Bảng CSDL

`listings`, `listing_images`, `listing_blocked_dates`, `listing_events`

Cột quan trọng: `status`, `expires_at`, `published_at`, `rejected_reason`, `is_verified` *(client không được ghi)*.

## Hai gói trường

Giữ nguyên logic cũ, **đổi tên cho đúng bản chất**:

| | Gói Cơ Bản | Gói Đầy Đủ |
|---|---|---|
| Trường | hãng, dòng, năm, biển số, số chỗ, giá ngày, cọc, nơi nhận, tên + SĐT | thêm: kỹ thuật, giấy tờ, giới hạn km, phí vượt km, Zalo, lịch chặn ngày |

Cả hai gói **đều tốn 10 token/tháng**. Gói Đầy Đủ không phải gói trả phí riêng — nó chỉ là nhiều trường hơn. Tích xanh là chuyện của luồng 08 (xác minh giấy tờ), **không mua bằng tiền**.

> Đây là thay đổi so với code cũ: trước kia "Tích Xanh" vừa là gói trả phí vừa là huy hiệu tin cậy. Gộp hai thứ đó là bán niềm tin — bỏ.

## Tiêu chí hoàn thành

- [ ] Đăng được xe mới, lưu vào Postgres
- [ ] Sửa được xe đã đăng
- [ ] Upload ≥ 5 ảnh, nén ở client, chọn được ảnh bìa
- [ ] Lịch chặn ngày lưu và hiện lại đúng
- [ ] Tin có `expires_at`, đổi trạng thái đúng vòng đời
- [ ] Graceful degradation: gói Cơ Bản thiếu dữ liệu thì **ẩn UI**, không hiện ô trống
- [ ] Ghi một dòng vào `CHANGELOG.md`

## Cấm

- Không tự chế thêm bảng ngoài `contracts/schema.sql`. Cần bảng mới → báo, mở luồng nền tảng.
- Không cho client ghi `is_verified`.
- Không thêm nút hứa hẹn thứ chưa có.

## Tham chiếu từ code cũ

- Form đăng xe: `Web thue xe/src/App.jsx` → `AddCarForm` (dòng 2153) và `getFieldGroups` (dòng 372)
- Nén ảnh: `ImageUploadOptimizer` (dòng 2450)
- Lịch chặn ngày: `BlockedDatesManager` (dòng 1922)

Đọc **đúng các đoạn đó**, không đọc cả file 131KB.
