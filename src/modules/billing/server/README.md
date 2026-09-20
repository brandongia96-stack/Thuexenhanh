# Ví token — dựng phía server (luồng 06)

Ba phần: **hàm SQL**, **Edge Function**, **webhook ngân hàng**. Làm đúng thứ tự.

> ⚠️ **Chưa bật nạp tiền thật cho tới khi trang `/hoan-token` (luồng 12) đã lên.**
> Hai cổng khoá độc lập, phải mở cả hai: cờ `FLAGS.nap_tien_that` ở
> `src/lib/config.js` và biến môi trường `NAP_TIEN_THAT` của Edge Function.
> Cờ client chỉ giấu nút; cổng thật nằm ở server.

---

## 1. Chạy SQL

File SQL nay nam o `supabase/migrations/0004_billing.sql` (luong 01 chuyen vao
ngay 21/09). Chay theo dung day migration chung — xem `supabase/README.md`.
PHAI chay TRUOC `0007_notify.sql` va `0008_admin.sql`: ca hai goi `wallet_so_du()`.

File này thêm: `wallet_so_du`, `ensure_wallet`, view `wallet_ledger`, trigger
chặn số dư âm, `credit_topup`, `charge_and_publish`, `refund_tokens`,
`expire_listings`, `doi_soat_vi`. **Không** sửa bảng nào của `contracts/`.

## 2. Deploy Edge Function

```bash
supabase functions deploy create-topup
supabase functions deploy publish-listing
supabase functions deploy bank-webhook --no-verify-jwt
```

`bank-webhook` phải có `--no-verify-jwt`: ngân hàng gọi tới, không có JWT người
dùng. Nó tự xác thực bằng `BANK_WEBHOOK_KEY`.

## 3. Biến môi trường

Dashboard → Edge Functions → Secrets:

| Biến | Giá trị | Ghi chú |
|---|---|---|
| `NAP_TIEN_THAT` | `false` | đổi `true` **sau khi** có trang hoàn token |
| `VIETQR_BANK` | vd `MB` | mã ngân hàng theo chuẩn VietQR |
| `VIETQR_ACCOUNT` | số tài khoản nhận | |
| `VIETQR_NAME` | tên chủ tài khoản | hiện trên app ngân hàng của khách |
| `BANK_PROVIDER` | `sepay` | ghi vào `topups.provider` |
| `BANK_WEBHOOK_KEY` | chuỗi ngẫu nhiên ≥ 32 ký tự | **ai có khoá này là in được token** |
| `APP_ORIGIN` | `https://<tên miền>` | CORS. Để `*` khi dev. |

`SUPABASE_SERVICE_ROLE_KEY` Supabase tự cấp sẵn cho Edge Function — không tự đặt,
và **không bao giờ** đưa vào `.env` của web (không có tiền tố `VITE_`).

## 4. Nối SePay

SePay → thêm tài khoản ngân hàng → Webhook:

- URL: `https://<ref>.supabase.co/functions/v1/bank-webhook`
- Kiểu xác thực: **API Key**, giá trị đúng bằng `BANK_WEBHOOK_KEY`
- Sự kiện: chỉ **tiền vào**

Casso/PayOS dùng được nhưng phải sửa lại chỗ đọc payload trong
`bank-webhook/index.ts` (tên trường khác nhau).

## 5. Cron

```sql
select cron.schedule('het-han-tin', '0 1 * * *', $$select expire_listings()$$);
select cron.schedule('doi-soat-vi', '30 1 * * *', $$select * from doi_soat_vi()$$);
```

`expire_listings()` chuyển tin quá hạn sang `het_han` và bắn thông báo trước 3
ngày. **Không xoá dữ liệu gì** — gia hạn là tin hiện lại nguyên vẹn.

---

## 6. Kiểm tra bắt buộc trước khi thu tiền thật

Chưa chạy đủ 6 mục dưới thì **chưa được coi là xong**.

**a. Client không ghi được vào ví.** Đăng nhập bằng tài khoản thường, chạy —
cả ba lệnh phải **lỗi**:

```sql
insert into wallet_transactions (wallet_id, kind, amount)
  values ((select id from wallets where user_id = auth.uid()), 'nap', 1000);
update wallet_transactions set amount = 9999 where wallet_id = (select id from wallets where user_id = auth.uid());
select charge_and_publish(auth.uid(), '<id tin cua minh>', 1, 'publish:x:y');
```

**b. Webhook gửi trùng chỉ cộng một lần.** Gửi đúng một payload hai lần:

```bash
curl -X POST https://<ref>.supabase.co/functions/v1/bank-webhook \
  -H "Authorization: Apikey $BANK_WEBHOOK_KEY" -H "Content-Type: application/json" \
  -d '{"id":1,"transferType":"in","transferAmount":40000,"content":"TXNAB2CD34","referenceCode":"FT001"}'
```

Lần hai phải trả `{"da_xu_ly": true}`. Đếm lại:

```sql
select count(*) from wallet_transactions where idem_key = 'topup:sepay:FT001';  -- phải = 1
```

**c. Đăng tin trừ đúng 10 token, ghi đúng sổ.**

```sql
select kind, amount, so_du_sau, note from wallet_ledger
 where user_id = '<uid>' order by created_at desc limit 3;
```

**d. Bấm hai lần không trừ hai lần.** Gọi `publish-listing` hai lần cùng
`idem_key` → lần hai trả `da_xu_ly: true`, `charges` chỉ có một dòng.

**e. Hết token thì tin ẩn, nạp vào hiện lại nguyên vẹn.** Đặt
`expires_at = now()`, chạy `select expire_listings();` → tin `het_han`, biến khỏi
tìm kiếm. Gia hạn → hiện lại, ảnh và mô tả còn nguyên.

**f. Sổ khớp số dư.** Bảng dưới phải **rỗng**:

```sql
select * from doi_soat_vi();
```

Và với một ví bất kỳ, ba con số này phải khớp:

```sql
select so_du, token_da_nap - token_da_tieu as tinh_lai
  from wallet_balances where user_id = '<uid>';
```

---

## 7. Còn thiếu — cần luồng khác quyết

| Việc | Vướng ở đâu |
|---|---|
| Tự động gia hạn | `listings` chưa có cột `auto_renew`. Thêm cột = sửa `contracts/schema.sql`, chỉ luồng 01 được làm. |
| Chuyển khoản không khớp mã | Hiện chỉ ghi `console.error`. Cần một bảng `unmatched_transfers` để tra tay, cũng là việc của luồng 01. |
| Đường dẫn webhook | `contracts/api.md` ghi `/webhook/bank`; tên Edge Function không chứa `/` nên đường thật là `/bank-webhook`. Luồng 01 sửa lại một dòng trong hợp đồng. |
