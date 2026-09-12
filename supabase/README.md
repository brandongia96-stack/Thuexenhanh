# Dựng Supabase — 6 bước

Em không tạo hộ được vì cần tài khoản của anh. Anh làm theo thứ tự dưới, khoảng 10 phút.

## 1. Tạo dự án
supabase.com → **New project** → vùng **Singapore** (gần Việt Nam nhất).
Đặt mật khẩu CSDL và lưu lại chỗ nào an toàn.

## 2. Chạy migration
Vào **SQL Editor**, dán và chạy **đúng thứ tự**:

1. `supabase/migrations/0001_init.sql` — bảng, index, RLS
2. `supabase/migrations/0002_auth_hooks.sql` — trigger tạo user/ví, chặn tự nâng quyền
3. `supabase/migrations/0003_seed_static.sql` — 26 hãng xe, 173 dòng xe, 39 tỉnh, 68 quận/huyện, 13 tiện nghi

Nếu chạy lại từ đầu: xoá schema `public` rồi tạo lại, đừng chạy chồng.

## 3. Bật đăng nhập Google
**Authentication → Providers → Google** → bật.
Client ID / Secret lấy ở Google Cloud Console (OAuth 2.0 Client, loại Web).
Redirect URL dán vào Google Console: `https://<ref>.supabase.co/auth/v1/callback`
Trong Supabase → **URL Configuration → Site URL**: `http://localhost:5173` khi dev.

## 4. Tạo bucket ảnh
**Storage → New bucket**
- `listing-images` — **public**
- `verify-docs` — **private** (giấy tờ xét tích xanh, chỉ admin đọc)

## 5. Nối vào app
```bash
cp .env.example .env
```
Điền `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` lấy ở **Settings → API**.
Khoá `service_role` **không** đặt vào `.env` — nó chỉ nằm trong Edge Function.

## 6. Tự cấp quyền admin
Đăng nhập lần đầu bằng Google, rồi chạy trong SQL Editor:

```sql
insert into user_roles (user_id, role)
select id, 'admin' from users where email = 'huynhbaogia.le@gmail.com'
on conflict do nothing;
```

---

## Cron còn phải đặt (chưa bật, cần khi có dữ liệu thật)

Dùng `pg_cron` trong Supabase:

| Việc | Lệnh | Tần suất |
|---|---|---|
| Gộp sự kiện theo ngày | `select rollup_events_daily();` | 02:00 hằng ngày |
| Dọn bảng events thô | `select prune_events(90);` | 03:00 hằng ngày |
| Đánh dấu tin sắp/đã hết hạn | luồng 02 viết | hằng ngày |

## Kiểm tra RLS trước khi thu tiền thật

Đăng nhập bằng tài khoản thường rồi thử — cả 4 lệnh dưới **phải lỗi**:

```sql
update listings set is_verified = true where id = '<tin cua nguoi khac>';
update listings set expires_at = now() + interval '10 years' where owner_id = auth.uid();
insert into wallet_transactions (wallet_id, kind, amount) values ('<vi cua minh>', 'nap', 1000);
update users set verify_status = 'da_xac_minh' where id = auth.uid();
```
