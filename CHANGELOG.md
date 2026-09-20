# CHANGELOG — Thuexenhanh

**Mục đích:** để không luồng chat nào làm lại việc luồng khác đã làm. Trước khi bắt tay vào việc, **đọc file này trước**.

## Cách ghi

Mỗi việc xong → thêm **một dòng** vào đầu bảng của phiên bản đang làm. Đúng định dạng:

```
| YYYY-MM-DD | <luồng> | <đã làm gì> | <file chính bị đụng> |
```

Quy tắc:
- Ghi **ngay khi xong**, không để dồn cuối buổi.
- Một dòng một việc. Không viết đoạn văn.
- Có phá vỡ tương thích → thêm `⚠️` đầu dòng.
- Có đổi hợp đồng chung (`contracts/`) → thêm `🔒` và **báo lại** để cập nhật `CLAUDE.md`.

---

## v0.2 — Khung mới (Postgres + module) · đang làm

| Ngày | Luồng | Nội dung | File |
|---|---|---|---|
| 2026-09-20 | 10 quản trị | Dựng `/quan-tri/*` (admin): duyệt tin + cảnh báo trùng biển số, người dùng (khoá→ẩn tin, tích xanh), ví (tặng/hoàn/thu hồi tay), doanh thu (tách tiêu/nợ), sức khoẻ + báo cáo. Server: 8 hàm `admin_*` ghi `admin_actions` cùng transaction + Edge Function `admin-ops`. **Chưa chạy thử với Supabase thật; chưa có master-data.** Đụng `App.jsx` đúng 1 route | `src/modules/admin/**`, `supabase/migrations/0005_admin.sql`, `supabase/functions/admin-ops/`, `src/App.jsx` |
| 2026-09-20 | 05 trang xe | Trang `/xe/:id`: slider ảnh (medium, `full` chỉ khi phóng to, prefetch đúng 1 ảnh kế), khối thông số/tiện nghi/giá/mô tả/lịch bận tự ẩn khi thiếu dữ liệu, bản đồ là địa chỉ + nút mở app (không iframe), gỡ sạch đánh giá giả. Luồng lấy số 3 bước qua Edge Function `reveal-phone` (khử trùng lặp 1 giờ + bỏ lượt chủ xe tự xem). Lưu xe ghi THẬT vào `saved_listings`, optimistic + hoàn lại khi lỗi; trang `/da-luu` phân trang keyset. Gói trang xe 11,2 KB gzip, gói đầu vẫn 58,9 KB | `src/modules/discovery/**`, `supabase/functions/reveal-phone/`, `src/App.jsx` |
| 2026-09-20 | 06 ví token | Server: `charge_and_publish` (trừ token + bật hiển thị trong 1 transaction, khoá dòng ví, idempotent theo `idem_key`), `credit_topup` (idempotent theo mã giao dịch ngân hàng), `refund_tokens`, `expire_listings`, `doi_soat_vi`, view `wallet_ledger` (có "số dư sau"), trigger chặn số dư âm; 3 Edge Function `create-topup` / `publish-listing` / `bank-webhook` (VietQR động + webhook SePay). Client: trang `/chu-xe/vi`, hộp nạp token, hộp trả phí hiển thị. **Nạp tiền thật còn TẮT** (2 cổng: `FLAGS.nap_tien_that` + env `NAP_TIEN_THAT`) | `src/modules/billing/**`, `supabase/functions/{create-topup,publish-listing,bank-webhook}/`, `src/lib/config.js`, `src/App.jsx` |
| 2026-09-20 | 12 pháp lý | Viết Điều khoản, Bảo mật, Hoàn token (v1.0), Giới thiệu, FAQ, Liên hệ; ô tích đồng ý ở đăng nhập, ghi phiên bản + thời điểm vào `user_consents` (🔒 bảng mới, luồng 01 cần gộp vào `contracts/schema.sql`); link chân trang | `src/modules/legal/**`, `supabase/migrations/0005_legal_consent.sql`, `src/modules/auth/DangNhap.jsx`, `src/components/Footer.jsx`, `src/App.jsx` |
| 2026-09-20 | 11 thông báo | Server: `notification_outbox` (unique chống gửi trùng) + `notification_prefs`, hàm quét mốc 3 ngày/1 ngày/hết hạn/thiếu token, trigger duyệt/từ chối/bị ẩn/nạp thành công, Edge Function `send-notifications` (Resend + Zalo ZNS, chưa có khoá thì giữ hàng đợi). Client: trang `/thong-bao` + cài đặt bật/tắt. Chưa nối cron, chưa có chuông ở Header, chưa có mốc "tài khoản bị khoá" | `supabase/migrations/0005_notify.sql`, `supabase/functions/send-notifications/`, `src/modules/notify/**`, `src/App.jsx` |
| 2026-09-20 | 08 tin cậy | Nháp server: chặn INSERT tin lên thẳng đang hiển thị, chặn tự gửi duyệt, chuẩn hoá + chặn trùng biển số, 3 báo cáo → tự ẩn, hạn mức lấy số/OTP. Client: `trustApi`, `huyHieu` (chưa nối UI, chưa có Edge Function) | `src/modules/trust/**` |
| 2026-09-20 | 13 deploy | Chuẩn bị hạ tầng Cloudflare Pages: `_redirects` (hết 404 khi F5), `_headers` (cache + bảo mật), `.nvmrc`=20, dọn `thu-luong-02.html`, quét sạch secret, viết `DEPLOY.md` | `public/_redirects`, `public/_headers`, `.nvmrc`, `DEPLOY.md` |
| 2026-09-20 | nền tảng | Thêm luồng 13 (deploy): brief GitHub + Cloudflare Pages. Đổi hosting Netlify/Vercel → Cloudflare Pages | `LUONG-CHAT/13-deploy.md`, `CLAUDE.md` |
| 2026-09-12 | 01 nền tảng | 🔒 Bổ sung theo `HIEU-NANG.md`: view `listing_card`, bảng `events_daily` + hàm gộp/dọn, cột ảnh 4 cỡ + `blur_base64`, index keyset | `contracts/schema.sql`, `contracts/api.md` |
| 2026-09-12 | 01 nền tảng | Tải trễ `@supabase/supabase-js` + tách gói theo route: gói đầu 146,8 → **58,9 KB gzip** | `src/lib/supabase.js`, `src/App.jsx` |
| 2026-09-12 | 01 nền tảng | Sinh migration tự động từ hợp đồng + dữ liệu tĩnh (26 hãng, 173 dòng xe, 39 tỉnh, 68 quận/huyện, 13 tiện nghi) | `scripts/gen-migrations.mjs`, `supabase/migrations/*` |
| 2026-09-12 | 01 nền tảng | Dựng khung React mới ở gốc repo: `App.jsx` 83 dòng chỉ routing, auth Google, rbac, ui-kit, analytics/events | `src/**`, `package.json`, `vite.config.js` |
| 2026-09-12 | 01 nền tảng | 🔒 Viết 3 file hợp đồng chung: 25 bảng + RLS + trigger chống sửa sổ ví, API, design token | `contracts/schema.sql`, `contracts/api.md`, `contracts/tokens.css` |
| 2026-09-12 | nền tảng | 🔒 Thêm `HIEU-NANG.md`: ngân sách LCP/CLS/INP, ảnh 4 cỡ + blur base64, cursor pagination, `listing_card`, `events_daily` | `HIEU-NANG.md`, `CLAUDE.md`, brief 01–05 |
| 2026-09-12 | nền tảng | Tạo 12 brief luồng chat trong `LUONG-CHAT/` | `LUONG-CHAT/*.md` |
| 2026-09-12 | nền tảng | Thêm luật chống mất code, `.gitignore`, script sao lưu, khởi tạo Git | `CLAUDE.md`, `.gitignore`, `scripts/backup.ps1` |
| 2026-09-12 | nền tảng | 🔒 Chốt mô hình giá: ví token, 1 token = 4.000đ, 10 token/xe/tháng, bỏ gói vĩnh viễn | `CLAUDE.md`, `QUYET-DINH.md` |
| 2026-09-12 | nền tảng | 🔒 Chốt chuyển Firestore → Postgres (Supabase); dựng khung mới thay vì vá code cũ | `CLAUDE.md` |

## v0.1 — Bản demo (Firebase) · đã đóng băng

| Ngày | Luồng | Nội dung | File |
|---|---|---|---|
| 2026-09-12 | nền tảng | Giải nén `Web thue xe.rar`, khảo sát code, viết `NGHIEN-CUU.md` | `NGHIEN-CUU.md` |
| 2026-09-12 | nền tảng | Tạo skill `grillme` | `.claude/skills/grillme/SKILL.md` |
| 2026-09-12 | nền tảng | Tạo `CLAUDE.md` | `CLAUDE.md` |

> Toàn bộ code trong `Web thue xe/` thuộc v0.1. **Đóng băng** — chỉ đọc để tham chiếu, không sửa. Khung mới dựng ở luồng 01.

---

## Trạng thái 12 luồng

| # | Luồng | Trạng thái | Ngày xong |
|---|---|---|---|
| 01 | Nền tảng & CSDL | 🟨 khung xong, chờ tạo dự án Supabase | |
| 02 | Tin đăng xe | ⬜ | |
| 03 | Bảng điều khiển chủ xe | ⬜ | |
| 04 | Tìm kiếm & bộ lọc | ⬜ | |
| 05 | Trang chi tiết xe | 🟨 xong phần giao diện + API, chờ Supabase để chạy thật | 2026-09-20 |
| 06 | Ví token & thanh toán | 🟨 code xong, chờ chạy SQL + deploy function + kiểm tra 6 mục ở `src/modules/billing/server/README.md`; chưa bật nạp tiền thật | |
| 07 | Đẩy tin | ⬜ để sau | |
| 08 | Tin cậy & kiểm duyệt | ⬜ | |
| 09 | Đánh giá thật | ⬜ để sau | |
| 10 | Trang quản trị | ⬜ | |
| 11 | Thông báo | ⬜ | |
| 12 | Pháp lý & trang tĩnh | 🟨 bản nháp xong, chờ luật sư đọc + email hỗ trợ | |
| 13 | Triển khai GitHub + Cloudflare | 🟨 hạ tầng repo xong, chờ tạo repo GitHub + nối Cloudflare (xem `DEPLOY.md`) | |
