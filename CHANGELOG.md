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
| 05 | Trang chi tiết xe | ⬜ | |
| 06 | Ví token & thanh toán | ⬜ | |
| 07 | Đẩy tin | ⬜ để sau | |
| 08 | Tin cậy & kiểm duyệt | ⬜ | |
| 09 | Đánh giá thật | ⬜ để sau | |
| 10 | Trang quản trị | ⬜ | |
| 11 | Thông báo | ⬜ | |
| 12 | Pháp lý & trang tĩnh | ⬜ | |
| 13 | Triển khai GitHub + Cloudflare | ⬜ | |
