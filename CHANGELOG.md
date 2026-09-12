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
| 01 | Nền tảng & CSDL | ⬜ chưa làm | |
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
