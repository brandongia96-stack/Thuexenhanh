# Luồng 01 — Nền tảng & CSDL

> Mở luồng mới, dán: `Đọc CLAUDE.md và LUONG-CHAT/01-nen-tang.md rồi bắt đầu.`

**Phụ thuộc:** không · **Chặn:** tất cả các luồng còn lại

---

## Mục tiêu

Dựng bộ khung mới (quyết định **B** — không vá `App.jsx` cũ) và **khoá cứng hợp đồng chung** để 11 luồng sau không đá nhau.

Đầu ra bắt buộc — 3 file hợp đồng, tổng dưới 20KB:
- `contracts/schema.sql` — toàn bộ bảng Postgres
- `contracts/api.md` — endpoint + kiểu dữ liệu vào/ra
- `contracts/tokens.css` — design token + component dùng chung

## Module trong luồng

- `core/db` — schema Postgres + migration
- `core/auth` — đăng nhập Google + phiên + chỗ cắm OTP SĐT (OTP thật làm ở luồng 08)
- `core/rbac` — vai trò: `khach`, `chu_xe`, `kiem_duyet`, `admin`
- `core/config` — biến môi trường, feature flag
- `core/ui-kit` — bê design token từ `Web thue xe/src/styles.css`, dựng component chung
- `analytics/events` — bảng sự kiện + hàm ghi sự kiện (dashboard làm ở luồng 03 và 10)

## Bảng CSDL phải định nghĩa ở luồng này

Tất cả các bảng, kể cả bảng của luồng sau — để schema là một khối thống nhất:

```
users, user_roles
listings, listing_images, listing_blocked_dates, listing_events, saved_listings
wallets, wallet_transactions, topups, charges, boosts
reviews, reports, moderation_queue, otp_codes
events                      -- view_listing, reveal_phone, click_call, click_zalo, search, topup, renew
events_daily                -- bảng tổng hợp theo ngày, cron gộp mỗi đêm
notifications
brands, models, provinces, districts, amenities
admin_actions               -- nhật ký thao tác admin, không được xoá
```

Ngoài bảng, luồng này phải tạo sẵn:
- View **`listing_card`** — chỉ ~10 cột cho thẻ xe trong danh sách (`HIEU-NANG.md` mục 2.1). Cấm để luồng sau `select *`.
- `listing_images` có cột **`blur_base64`** (< 1 KB) để trả kèm JSON, không tốn request.
- Index theo `HIEU-NANG.md` mục 2.3.
- Cron gộp `events` → `events_daily`, dọn bảng thô sau 90 ngày.

Quy ước bắt buộc:
- Tên bảng/cột **snake_case tiếng Anh**. Nội dung hiển thị tiếng Việt.
- Mọi bảng có `id`, `created_at`, `updated_at`.
- **Không xoá cứng.** Dùng `deleted_at` (soft delete).
- Tiền: `wallet_transactions` chỉ **ghi thêm**, không sửa, không xoá. Số dư = tổng dòng, không lưu số dư rời rồi tự cộng trừ.
- Tách rõ `token_da_nap` và `token_da_tieu` — token nạp trước là **nghĩa vụ nợ**, không phải doanh thu.
- RLS bật cho mọi bảng. Chủ xe chỉ đọc/sửa tin của chính mình.
- `listings.is_verified` và mọi cột liên quan tiền: **client không được ghi**, chỉ server/admin.

## Cấu trúc thư mục phải tạo

```
src/
├─ main.jsx
├─ App.jsx              ← chỉ routing + layout, DƯỚI 200 dòng
├─ modules/             ← mỗi luồng sau làm một thư mục ở đây
├─ components/          ← component dùng chung
├─ data/                ← dữ liệu tĩnh: hãng xe, tỉnh thành, tiện nghi
└─ lib/                 ← format, phone, validate, supabase client
```

## Tiêu chí hoàn thành

- [ ] 3 file `contracts/` tồn tại và đầy đủ
- [ ] Dự án Supabase tạo xong, migration chạy được
- [ ] Đăng nhập Google chạy, tạo được user với vai trò
- [ ] Khung React mới chạy `npm run dev` không lỗi
- [ ] `App.jsx` mới dưới 200 dòng
- [ ] Dữ liệu tĩnh (27 hãng xe, 39 tỉnh, quận/huyện, 13 tiện nghi) đã bê từ code cũ sang `src/data/`
- [ ] Ghi một dòng vào `CHANGELOG.md`

## Cấm

- Không bê nguyên `App.jsx` cũ sang. Chỉ bê **dữ liệu tĩnh** và **design token**.
- Không dùng TailwindCSS.
- Không viết logic nghiệp vụ của module khác — luồng này chỉ dựng khung và hợp đồng.

## Tham chiếu từ code cũ

- Design token: `Web thue xe/src/styles.css` (60 dòng đầu)
- Dữ liệu tĩnh: `Web thue xe/src/App.jsx` dòng 42–99
- Cấu trúc dữ liệu xe cũ: `CLAUDE.md` mục 4
