# contracts/api.md — Hợp đồng dữ liệu & API

> **Chỉ luồng 01 được sửa file này.** Luồng khác cần thêm endpoint → dừng, báo anh.
> Mọi luồng module đọc file này để biết gọi gì, nhận về kiểu gì.

---

## 0. Nguyên tắc

| Luật | Nội dung |
|---|---|
| Đọc | Client gọi thẳng Supabase (PostgREST), RLS chặn. |
| Ghi thường | Client ghi thẳng bảng của mình (`listings`, `listing_images`, `saved_listings`, `reviews`, `reports`). |
| Ghi tiền | **Cấm client.** Đi qua Edge Function, chạy bằng `service_role`. |
| Ghi `is_verified`, `published_at`, `expires_at`, `status` sang `dang_hien_thi` | **Cấm client.** Chỉ server/admin. |
| Idempotent | Mọi thao tác trừ token phải gửi `idem_key`. Gửi lại cùng key → không trừ lần hai. |
| Không xoá cứng | `DELETE` = set `deleted_at`. |

---

## 1. Kiểu dữ liệu dùng chung

```ts
type Uuid = string

type ListingStatus =
  | 'nhap' | 'cho_duyet' | 'tu_choi'
  | 'dang_hien_thi' | 'sap_het_han' | 'het_han' | 'an'

type UserRole = 'khach' | 'chu_xe' | 'kiem_duyet' | 'admin'

type Listing = {
  id: Uuid
  owner_id: Uuid
  status: ListingStatus
  reject_reason: string | null

  brand_text: string          // "Toyota"
  model_text: string          // "Innova"
  year: number | null
  seats: number | null
  transmission: 'so_san' | 'so_tu_dong' | null
  fuel: 'xang' | 'dau' | 'dien' | 'hybrid' | null
  body_style: string | null
  description: string | null

  price_per_day: number       // VNĐ/ngày
  price_per_month: number | null
  deposit_note: string | null
  limit_km_per_day: number | null
  extra_km_fee: number | null

  province_id: number | null
  district_id: number | null
  address_text: string | null

  amenity_codes: string[]     // khớp amenities.code
  contact_phone: string       // CHỈ trả về sau khi gọi reveal_phone
  contact_zalo: string | null

  is_verified: boolean        // chỉ đọc
  published_at: string | null
  expires_at: string | null
  created_at: string
}

type ListingCard = Pick<Listing,
  'id'|'brand_text'|'model_text'|'year'|'seats'|'transmission'
  |'price_per_day'|'province_id'|'district_id'|'is_verified'|'expires_at'>
  & { cover_url: string | null }

type WalletBalance = {
  wallet_id: Uuid
  user_id: Uuid
  token_da_nap: number     // nghĩa vụ nợ
  token_da_tieu: number    // doanh thu đã ghi nhận
  so_du: number            // = tổng các dòng sổ
}
```

**Quy ước rỗng:** thiếu dữ liệu → API trả `null`, UI **ẩn cả khối**, không render ô trống.
**Cấm** trả về số sao / số chuyến / lượt xem giả. Chưa có thì `null` hoặc `0` kèm trạng thái rỗng.

---

## 2. Đọc trực tiếp qua Supabase client

```js
// Danh sách tin đang hiển thị
supabase.from('listings')
  .select('id,brand_text,model_text,year,seats,transmission,price_per_day,province_id,district_id,is_verified,listing_images(url,is_cover)')
  .in('status', ['dang_hien_thi', 'sap_het_han'])
  .is('deleted_at', null)
  .order('published_at', { ascending: false })

// Chi tiết tin — KHÔNG select contact_phone ở bước này
supabase.from('listings').select('*').eq('id', id).single()

// Tin của chính chủ xe (RLS tự lọc)
supabase.from('listings').select('*').eq('owner_id', uid)

// Số dư ví (chỉ đọc)
supabase.from('wallet_balances').select('*').eq('user_id', uid).single()
```

Tìm kiếm toàn văn (luồng 04): dùng cột `search_tsv`, khớp chuỗi đã bỏ dấu.

---

## 3. Edge Function — server-only

Gốc: `${VITE_SUPABASE_URL}/functions/v1/`. Gửi kèm `Authorization: Bearer <access_token>`.

### `POST /reveal-phone`
Đổi lấy số điện thoại + ghi sự kiện. Đây là **hàng hoá đem bán**, phải đếm.

```jsonc
// vào
{ "listing_id": "uuid", "session_id": "string" }
// ra
{ "phone": "0901234567", "zalo": "0901234567" }
```

### `POST /submit-listing`
Chủ xe gửi tin đi duyệt. Server đẩy `nhap → cho_duyet`, tạo dòng `moderation_queue`.

```jsonc
{ "listing_id": "uuid" }              // vào
{ "status": "cho_duyet" }             // ra
```

### `POST /publish-listing`  *(luồng 06 gọi sau khi trừ token)*
Trừ token **và** bật hiển thị trong **một transaction**.

```jsonc
// vào
{ "listing_id": "uuid", "months": 1, "idem_key": "publish:<listing_id>:<yyyymm>" }
// ra
{ "charge_id": "uuid", "token_charged": 10, "expires_at": "2026-10-12T00:00:00Z", "so_du": 40 }
// lỗi
{ "error": "khong_du_token", "so_du": 3, "can_co": 10 }
```

Giá: **10 token / 1 xe / 1 tháng**, tuyến tính (3 tháng = 30 token). Không có gói vĩnh viễn.

### `POST /create-topup`
Tạo yêu cầu nạp + sinh mã VietQR động.

```jsonc
// vào
{ "token_amount": 25 }
// ra
{ "topup_id": "uuid", "vnd_amount": 100000, "transfer_code": "TXN8H3K2", "qr_url": "https://..." }
```

### `POST /webhook/bank`  *(không cần token người dùng, xác thực bằng chữ ký nhà cung cấp)*
Đối soát chuyển khoản → cộng token. Idempotent theo `provider_ref`.

### `POST /track`
Ghi sự kiện phân tích. Không cần đăng nhập.

```jsonc
{ "kind": "view_listing", "listing_id": "uuid", "session_id": "abc", "meta": {} }
```

`kind` hợp lệ: `view_listing` · `reveal_phone` · `click_call` · `click_zalo` · `search` · `topup` · `renew` · `save_listing`

### `POST /moderate-listing`  *(vai trò `kiem_duyet` hoặc `admin`)*
```jsonc
{ "listing_id": "uuid", "decision": "duyet" | "tu_choi", "reason": "string|null" }
```

### `POST /set-verified`  *(chỉ `admin`)*
Tích xanh — **xét giấy tờ, miễn phí, không bán**.
```jsonc
{ "user_id": "uuid", "verify_status": "da_xac_minh" | "tu_choi", "note": "string|null" }
```

---

## 4. Mã lỗi chung

| Mã | Nghĩa |
|---|---|
| `chua_dang_nhap` | Thiếu / hết hạn token |
| `khong_co_quyen` | RLS hoặc vai trò chặn |
| `khong_du_token` | Số dư ví không đủ |
| `trang_thai_khong_hop_le` | Tin sai trạng thái cho thao tác này |
| `du_lieu_khong_hop_le` | Validate thất bại, kèm `fields` |
| `qua_nhieu_yeu_cau` | Chặn spam |

Dạng trả về lỗi: `{ "error": "<ma>", "message": "<tiếng Việt>", "fields"?: {...} }`

---

## 5. Storage

| Bucket | Dùng cho | Quyền |
|---|---|---|
| `listing-images` | ảnh xe | đọc công khai, ghi = chủ tin |
| `verify-docs` | giấy tờ xét tích xanh | **riêng tư**, chỉ admin đọc |

Đường dẫn: `listing-images/<owner_id>/<listing_id>/<uuid>.webp`
Client nén trước khi tải lên: cạnh dài tối đa 1600px, dưới 400KB.

---

## 6. Biến môi trường

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_ENV=dev|prod
```

`service_role` key **chỉ nằm ở Edge Function**, không bao giờ có tiền tố `VITE_`.
