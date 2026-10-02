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
  price_per_hour: number | null
  limit_km_per_day: number | null
  extra_km_fee: number | null

  // Chi phí: SỐ để tính, note để giải thích. Hai thứ bổ sung nhau.
  deposit_amount: number | null       // cọc TIỀN, VNĐ
  deposit_note: string | null
  collateral_required: boolean        // thế chấp (xe máy, giấy tờ) — KHÁC cọc tiền
  collateral_note: string | null
  delivery_fee: number | null
  delivery_radius_km: number | null
  delivery_fee_note: string | null

  // Xe điện — null hết với xe xăng. Số liệu do CHỦ XE KHAI, không phải
  // thông số hãng; giao diện phải ghi rõ để khách không tưởng app cam kết.
  ev_range_km: number | null
  battery_kwh: number | null
  charge_policy: 'mien_phi' | 'mien_phi_gioi_han' | 'tinh_theo_phan_tram' | 'khach_tu_sac' | null
  free_charge_km: number | null       // chỉ dùng khi mien_phi_gioi_han
  charge_fee_per_pct: number | null   // VNĐ cho mỗi 1% pin
  pickup_min_pct: number | null
  return_min_pct: number | null
  has_portable_charger: boolean | null
  battery_ownership: 'mua' | 'thue' | null

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
  // Xe điện: CHỈ 3 trường. Thẻ nhân 20 tin/trang nên phải nhẹ.
  ev_range_km: number | null
  charge_policy: 'mien_phi' | 'mien_phi_gioi_han' | 'tinh_theo_phan_tram' | 'khach_tu_sac' | null
  collateral_required: boolean
  cover_thumb: string | null   // 400w
  cover_blur: string | null    // base64 20px, < 1KB, hiện ngay, 0 request
  cover_width: number | null   // bắt buộc đặt aspect-ratio -> không vỡ CLS
  cover_height: number | null
  // Hai cột dưới CHỈ để lọc ở luồng 04, KHÔNG hiển thị và không select vào
  // payload: `search_tsv` (tìm full-text đã bỏ dấu), `amenity_codes` (lọc tiện nghi).
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

// Giá xăng/điện đang hiệu lực — cho bảng tính tổng tiền.
// CẤM hardcode giá trong code: giá đổi vài tháng một lần.
// Bảng rỗng (chưa ai nhập) -> ẩn cả khối ước tính, KHÔNG hiện số 0.
supabase.from('reference_price_now').select('code,label,unit,price,source,effective_date')
```

Mỗi con số giá đều kèm `source` và `effective_date` — hiển thị phải dẫn nguồn,
vì khách không kiểm được con số thì không tin được bảng tính.

**Mã `reference_prices.code` đã chốt** (luồng 05 đọc, luồng 10 nhập — hai bên
phải khớp mã, lệch mã thì khối ước tính tự ẩn chứ không báo lỗi):

| `code` | Nhiên liệu | `unit` |
|---|---|---|
| `xang_ron95` | Xăng (RON95) | đ/lít |
| `dau_do` | Dầu (dầu đỏ/diesel) | đ/lít |

Mã khác (vd. giá điện) để sau, chưa cần cho bảng tính hiện tại.

```js
// Tìm kiếm toàn văn (luồng 04): dùng cột `search_tsv`, khớp chuỗi đã bỏ dấu.
// tsquery dựng ở client: bỏ dấu, cắt token, thêm `:*` để khớp tiền tố.
// Cấu hình PHẢI là 'simple' — khớp với to_tsvector('simple', unaccent(...)) lúc ghi.
supabase.from('listing_card')
  .select('id,brand_text,model_text,price_per_day,cover_thumb,cover_blur,...')
  .textSearch('search_tsv', 'vinfast:* & (vf8:* | (vf:* & 8:*))', { config: 'simple' })
  .contains('amenity_codes', ['ghe_da', 'cam_lui'])   // lọc tiện nghi
```
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

## 3b. Bằng chứng đồng ý điều khoản — `user_consents`

Luồng 12 ghi một dòng mỗi lần người dùng tick đồng ý. Đây là **bằng chứng pháp lý**,
không phải dữ liệu tiện ích — nên bảng chỉ ghi thêm.

```ts
type UserConsent = {
  id: Uuid
  user_id: Uuid
  document: 'terms' | 'privacy' | 'refund'   // ⚠️ CHECK ở CSDL, giá trị khác bị từ chối
  version: string                            // 'v1.0' — đổi văn bản thì tăng số
  accepted_at: string
  created_at: string
}
```

Client tự ghi (RLS lọc theo `auth.uid()`), không cần Edge Function:

```js
// Ghi — chỉ ghi được dòng của chính mình.
await supabase.from('user_consents').insert({ document: 'terms', version: 'v1.0', user_id: uid })

// Đọc lại — mỗi người chỉ thấy dòng của mình (admin thấy tất cả, để tra khi tranh chấp).
await supabase.from('user_consents')
  .select('document,version,accepted_at')
  .order('accepted_at', { ascending: false })
```

Ba luật của bảng này:

1. **Không sửa, không xoá** — kể cả `service_role`. Trigger `user_consents_append_only`
   chặn ở tầng CSDL, không chỉ dựa vào việc thiếu policy. Đổi văn bản thì tăng
   `version` và xin đồng ý lại, đừng ghi đè dòng cũ.
2. **Không có `updated_at` / `deleted_at`** — cố ý trái quy ước chung. Bằng chứng mà
   có dấu vết sửa đổi thì không còn là bằng chứng.
3. **`document` bị giới hạn 3 giá trị.** Thêm loại văn bản mới cần tick đồng ý
   (ví dụ Quy chế hoạt động) thì **phải sửa `CHECK` trong `contracts/schema.sql`
   trước** — insert giá trị lạ sẽ bị CSDL từ chối, không phải lỗi client.

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
