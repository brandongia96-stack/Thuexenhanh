# Đưa lên Supabase thật — quy trình đầy đủ

Em không tạo hộ được vì cần tài khoản Google/Supabase của anh và trình duyệt của anh.
Anh làm theo đúng thứ tự dưới. Tổng khoảng 25–30 phút.

Xong bước nào báo em bước đó, đặc biệt là **bước 7** — em cần nguyên khối kết quả.

---

## 1. Tạo dự án

supabase.com → **New project**
- Region: **Southeast Asia (Singapore)** — gần Việt Nam nhất
- Đặt mật khẩu CSDL, lưu lại chỗ an toàn (không nhắn qua chat)

Xong vào **Settings → API**, lấy 2 thứ:
- `Project URL` → chính là `VITE_SUPABASE_URL`
- `anon public` key → chính là `VITE_SUPABASE_ANON_KEY`

Lấy thêm `Project ref` (đoạn `xxxx` trong `https://xxxx.supabase.co`) để dùng ở bước 5.

> `service_role` key cũng nằm ở trang đó. **Tuyệt đối không** đặt nó vào `.env`
> và không dán vào chat. Nó chỉ sống trong biến môi trường của Edge Function.

## 2. Chạy migration — ĐÚNG THỨ TỰ NÀY

**Cách nhanh — dán một lần.** Chạy lệnh này để chép toàn bộ SQL vào clipboard:

```bash
cat supabase/chay-tat-ca.sql | clip
```

Rồi mở SQL Editor, dán (Ctrl+V), bấm **Run**. File đó là 8 file dưới nối lại,
bọc trong `BEGIN/COMMIT` — lỗi ở đâu là huỷ sạch, không để CSDL dở dang.
Sửa migration xong nhớ chạy lại `node scripts/gop-migration.mjs`.

**Cách chậm — dán từng file.** Nếu trình duyệt ì vì file to, chạy lần lượt 8 file
theo đúng dãy:

| # | File | Nội dung |
|---|---|---|
| 1 | `0001_init.sql` | 26 bảng, index, RLS, view `listing_card` / `wallet_balances` |
| 2 | `0002_auth_hooks.sql` | trigger tạo user + ví, chặn tự nâng quyền |
| 3 | `0003_seed_static.sql` | 26 hãng, 173 dòng xe, 39 tỉnh, 68 quận/huyện, 13 tiện nghi |
| 4 | `0004_billing.sql` | ví token: `wallet_so_du`, `charge_and_publish`, `credit_topup`… |
| 5 | `0005_trust.sql` | chống gian lận: chuẩn hoá biển số, hạn mức lấy số *(bản nháp)* |
| 6 | `0006_legal_consent.sql` | **file rỗng có chủ ý** — bảng đã gộp vào `0001` |
| 7 | `0007_notify.sql` | thông báo: outbox, quét hạn |
| 8 | `0008_admin.sql` | 8 hàm `admin_*` ghi nhật ký `admin_actions` |

> **Thứ tự không đảo được.** `0007` và `0008` đều gọi `wallet_so_du()` — hàm này
> sinh ra ở `0004`. Chạy sai thứ tự là lỗi "function does not exist".
>
> Chạy lại từ đầu thì xoá schema `public` rồi tạo lại, đừng chạy chồng.

## 3. Bật đăng nhập Google

**Authentication → Providers → Google** → bật.
Client ID / Secret lấy ở Google Cloud Console (OAuth 2.0 Client, loại Web).

- Redirect URL dán vào Google Console: `https://<ref>.supabase.co/auth/v1/callback`
- Supabase → **URL Configuration → Site URL**: `http://localhost:5173` (khi dev)
- **Redirect URLs** thêm cả: `http://localhost:5173/**` và `https://thuexenhanh.pages.dev/**`

## 4. Tạo bucket ảnh

**Storage → New bucket**
- `listing-images` — **public**
- `verify-docs` — **private** (giấy tờ xét tích xanh, chỉ admin đọc)

## 5. Deploy 6 Edge Function

Trong thư mục dự án, chạy lần lượt:

```bash
npx supabase login
```
```bash
npx supabase link --project-ref <ref-cua-anh>
```

Đặt biến môi trường trước khi deploy — thiếu là function chạy nhưng lỗi lúc gọi:

```bash
npx supabase secrets set APP_ORIGIN=http://localhost:5173 NAP_TIEN_THAT=0 CRON_SECRET=$(openssl rand -hex 24)
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` Supabase tự cấp,
không cần đặt tay.

Rồi deploy:

```bash
npx supabase functions deploy reveal-phone publish-listing create-topup bank-webhook admin-ops send-notifications
```

**Biến đặt sau, khi nào dùng tới:**

| Biến | Cho function | Khi nào cần |
|---|---|---|
| `VIETQR_BANK`, `VIETQR_ACCOUNT`, `VIETQR_NAME` | `create-topup` | trước khi nạp token thật |
| `BANK_PROVIDER`, `BANK_WEBHOOK_KEY` | `bank-webhook` | khi nối SePay/PayOS |
| `NAP_TIEN_THAT=1` | `create-topup` | **chỉ khi** trang `/hoan-token` đã lên |
| `RESEND_API_KEY`, `MAIL_FROM` | `send-notifications` | khi bật email |
| `ZALO_ACCESS_TOKEN`, `ZALO_TEMPLATE_ID` | `send-notifications` | khi bật Zalo ZNS |

## 6. Nối vào app

```bash
cp .env.example .env
```

Điền `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` lấy ở bước 1, rồi:

```bash
npm run dev
```

Đăng nhập bằng Google một lần. Sau đó tự cấp quyền admin trong SQL Editor:

```sql
insert into user_roles (user_id, role)
select id, 'admin' from users where email = 'huynhbaogia.le@gmail.com'
on conflict (user_id, role) do nothing;
```

## 7. ⚠️ KIỂM TRA RLS — bắt buộc, không được bỏ

Đây là bước quan trọng nhất. Nếu RLS hở, bất kỳ ai cũng tự nạp token và tự cấp
tích xanh cho mình được.

**SQL Editor** → dán cả file [`kiem-tra-rls.sql`](kiem-tra-rls.sql) → Run.

Script đóng vai một người dùng thường (`set local role authenticated` + giả JWT)
rồi thử làm 12 việc bậy. Kết quả in ra dạng `PASS` / `FAIL` từng mục, rồi
`rollback` sạch — không để lại dòng dữ liệu nào.

**Gửi em nguyên khối kết quả ở tab Results/Messages.**

Muốn kiểm đủ thì đăng nhập bằng **hai** tài khoản Google khác nhau trước khi chạy —
có 1 tài khoản thì 4 mục cách ly giữa hai người sẽ bị bỏ qua.

12 mục kiểm:

| # | Thử làm gì | Phải |
|---|---|---|
| 1 | Tự đặt `verify_status = da_xac_minh` | bị chặn |
| 2 | Tự ghi 1000 token vào ví mình | bị chặn |
| 3 | Sửa một dòng sổ ví đã ghi | bị chặn |
| 4 | Tự cấp vai trò `admin` | bị chặn |
| 5 | Sửa bằng chứng đã đồng ý điều khoản | bị chặn |
| 6 | Tự kéo dài hạn tin mà không trả token | bị chặn |
| 7 | Sửa giá tin của người khác | bị chặn |
| 8 | Đăng tin đứng tên người khác | bị chặn |
| 9 | Đọc sổ ví của người khác | 0 dòng |
| 10 | Đọc lượt xem của chủ xe khác | 0 dòng |
| 11 | Đọc bảng mã OTP | 0 dòng |
| 12 | Đọc tin đang hiển thị | **phải đọc được** |

Mục 12 là đối chứng ngược. Không có nó thì một cấu hình RLS chặn sạch mọi thứ
cũng sẽ "toàn PASS" mà app thì trắng trang.

**Có một `FAIL` là dừng, báo em. Chưa toàn `PASS` thì không bật nạp tiền thật.**

---

## 8. Cron — đặt sau, khi đã có dữ liệu thật

**Database → Extensions** bật `pg_cron`, rồi:

| Việc | Lệnh | Giờ |
|---|---|---|
| Gộp sự kiện theo ngày | `select rollup_events_daily();` | 02:00 |
| Dọn bảng `events` thô | `select prune_events(90);` | 03:00 |
| Đánh dấu tin hết hạn | `select expire_listings();` | 01:00 |
| Nhắc sắp hết hạn | `select scan_expiry_reminders();` | 08:00 |
| Đẩy hàng đợi thông báo | gọi `send-notifications` kèm `CRON_SECRET` | mỗi 5 phút |
