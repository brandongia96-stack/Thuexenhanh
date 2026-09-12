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

// Đọc từ view `listing_card`. KHÔNG select * cho danh sách (HIEU-NANG.md 2.1).
// Không có contact_phone: số chỉ lấy qua Edge Function reveal-phone.
type ListingCard = {
  id: Uuid
  status: ListingStatus
  brand_text: string
  model_text: string
  year: number | null
  seats: number | null
  transmission: 'so_san' | 'so_tu_dong' | null
  fuel: 'xang' | 'dau' | 'dien' | 'hybrid' | null
  price_per_day: number
  province_id: number | null
  district_id: number | null
  is_verified: boolean
  published_at: string | null
  expires_at: string | null
  owner_id: Uuid
  cover_thumb: string | null   // 400w
  cover_blur: string | null    // base64 20px, < 1KB, hiện ngay, 0 request
  cover_width: number | null   // bắt buộc đặt aspect-ratio -> không vỡ CLS
  cover_height: number | null
}

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
// Danh sách — LUÔN đọc view listing_card, không đọc bảng listings.
// Phân trang KEYSET, không OFFSET. 20 tin mỗi lần, cuộn vô hạn.
// Không đếm tổng số kết quả — chỉ cần biết còn nữa hay hết.
const TRANG = 20
let q = supabase.from('listing_card').select('*')
  .in('status', ['dang_hien_thi', 'sap_het_han'])
  .order('published_at', { ascending: false })
  .order('id', { ascending: false })
  .limit(TRANG + 1)                       // lấy dư 1 để biết "còn nữa"

if (cursor) {                              // cursor = { published_at, id } của tin cuối
  q = q.or(`published_at.lt.${cursor.published_at},` +
           `and(published_at.eq.${cursor.published_at},id.lt.${cursor.id})`)
}
const { data } = await q
const conNua = data.length > TRANG
const items = data.slice(0, TRANG)

// Chi tiết tin — chỉ ở đây mới lấy mô tả, thông số, danh sách ảnh.
// Vẫn KHÔNG lấy contact_phone.
supabase.from('listings')
  .select('*, listing_images(url_medium,url_full,blur_base64,width,height,sort_order,is_cover)')
  .eq('id', id).single()

// Tin của chính chủ xe (RLS tự lọc)
supabase.from('listing_card').select('*').eq('owner_id', uid)

// Số dư ví (chỉ đọc)
supabase.from('wallet_balances').select('*').eq('user_id', uid).single()

// Số liệu cho chủ xe — ĐỌC TỪ BẢNG TỔNG HỢP, không quét bảng events thô.
supabase.from('events_daily').select('day,kind,count')
  .eq('listing_id', id).gte('day', tuNgay).order('day')
```

Tìm kiếm toàn văn (luồng 04): dùng cột `search_tsv`, khớp chuỗi đã bỏ dấu.
Debounce 300ms, huỷ request cũ bằng `AbortController` (HIEU-NANG.md mục 2.5).

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

Mỗi ảnh lưu **4 bản** (HIEU-NANG.md mục 1.1). Danh sách chỉ được dùng bản `thumb`.

```
listing-images/<owner_id>/<listing_id>/<uuid>_thumb.webp     400w,  < 25KB
listing-images/<owner_id>/<listing_id>/<uuid>_medium.webp    800w,  < 70KB
listing-images/<owner_id>/<listing_id>/<uuid>_full.webp     1600w,  < 200KB
listing-images/<owner_id>/<listing_id>/<uuid>_orig.webp     lưu trữ, không phục vụ
```

Bản `blur` 20px **không** nằm ở Storage — nhúng base64 thẳng vào cột
`listing_images.blur_base64` để danh sách không tốn thêm request nào.

Client nén trước khi tải lên: cạnh dài tối đa 1600px, chất lượng 0.8.
Tên file có hash nội dung → cache `max-age=31536000, immutable`.

---

## 6. Biến môi trường

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_ENV=dev|prod
```

`service_role` key **chỉ nằm ở Edge Function**, không bao giờ có tiền tố `VITE_`.
