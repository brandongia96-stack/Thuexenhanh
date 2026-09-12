# HIỆU NĂNG — quy tắc bắt buộc cho mọi luồng UI

Bối cảnh: người dùng Việt Nam, phần lớn vào bằng **điện thoại Android tầm trung, mạng 4G chập chờn**. Trang rao vặt xe = rất nhiều ảnh. Chậm một giây là mất khách, và khách không quay lại.

**Luồng phải đọc file này:** 02 (tin đăng), 03 (chủ xe), 04 (tìm kiếm), 05 (trang xe), 10 (quản trị).

---

## 0. Ngân sách hiệu năng — không được vượt

Đo trên **4G giả lập + CPU chậm 4×**, không đo trên máy anh.

| Chỉ số | Ngưỡng | Nghĩa là |
|---|---|---|
| **LCP** | < 2,5s | ảnh/tiêu đề lớn nhất hiện xong |
| **CLS** | < 0,1 | trang không nhảy khi ảnh tải xong |
| **INP** | < 200ms | bấm nút thấy phản hồi ngay |
| **JS lần đầu** | < 150 KB gzip | |
| **Trang tìm kiếm, 20 thẻ xe** | < 500 KB tổng | |
| **Truy vấn danh sách** | < 300ms với 1.000 tin | |

Vượt ngưỡng → **không được coi là xong**.

---

## 1. Ảnh — chiếm 80% dung lượng, xử lý trước tiên

### 1.1 Sinh nhiều kích cỡ ngay lúc upload

Chủ xe upload 1 ảnh → hệ thống lưu **4 bản**, không bao giờ trả ảnh gốc ra danh sách:

| Bản | Kích thước | Dùng ở đâu | Dung lượng mục tiêu |
|---|---|---|---|
| `blur` | 20px, nhúng thẳng vào JSON dạng base64 | nền mờ hiện ngay | **< 1 KB** |
| `thumb` | 400w | thẻ xe trong danh sách | < 25 KB |
| `medium` | 800w | ảnh bìa trang chi tiết | < 70 KB |
| `full` | 1600w | chỉ khi bấm phóng to / lướt slider | < 200 KB |

Định dạng: **WebP** (AVIF nếu trình duyệt hỗ trợ), dự phòng JPEG. Ảnh gốc lưu riêng, không phục vụ trực tiếp.

### 1.2 Ba giai đoạn tải — đúng ý anh, có bổ sung

```
1. blur base64   → hiện NGAY, cùng lúc với chữ, 0 request
2. thumb/medium  → đè lên, chuyển mượt 200ms
3. full          → CHỈ khi khách bấm phóng to hoặc lướt slider
```

Bản `blur` nhúng thẳng trong dữ liệu trả về nên **không tốn request nào** — khách thấy hình dạng xe ngay lập tức thay vì ô xám.

### 1.3 Luật cứng cho mọi thẻ `<img>`

- **Luôn có `width` + `height` hoặc `aspect-ratio`.** Thiếu là trang nhảy khi ảnh tải xong → hỏng CLS.
- `loading="lazy"` + `decoding="async"` cho mọi ảnh **ngoài màn hình đầu**.
- Ảnh đầu tiên nhìn thấy: **KHÔNG lazy**, đặt `fetchpriority="high"`.
- Dùng `srcset` + `sizes` để trình duyệt tự chọn kích cỡ theo màn hình — đừng ép một cỡ cho mọi máy.
- Tên file có hash nội dung → cache `max-age=31536000, immutable`.

### 1.4 Slider ảnh

- Chỉ tải ảnh đang xem + **prefetch đúng 1 ảnh kế tiếp**. Không tải sẵn cả 10 ảnh.
- Vuốt qua nhanh → huỷ request ảnh không còn cần.

### 1.5 Lúc upload

Nén ở client trước khi gửi lên (code cũ đã có `browser-image-compression`): tối đa 1600px cạnh dài, chất lượng 0.8. Tiết kiệm băng thông của **chủ xe** — họ cũng dùng 4G.

---

## 2. Dữ liệu & truy vấn

### 2.1 Danh sách chỉ lấy cột cần

Thẻ xe cần ~10 trường. **Cấm `select *`.** Tạo view `listing_card` chỉ gồm: id, tên, giá ngày, tỉnh/quận, số chỗ, hộp số, nhiên liệu, ảnh thumb, blur, trạng thái, huy hiệu.

Thông số kỹ thuật, giấy tờ, mô tả → **chỉ lấy khi mở trang chi tiết**.

### 2.2 Phân trang bằng cursor, không dùng OFFSET

`OFFSET 1000` bắt Postgres đếm qua 1.000 dòng rồi vứt đi — càng lướt càng chậm. Dùng keyset:

```sql
WHERE (published_at, id) < (:last_published_at, :last_id)
ORDER BY published_at DESC, id DESC
LIMIT 20
```

20 tin mỗi lần, cuộn vô hạn. **Không đếm tổng số kết quả** — chỉ cần biết "còn nữa hay hết", đếm tổng là truy vấn đắt mà khách không quan tâm.

### 2.3 Index bắt buộc

```
(province_id, status, published_at DESC)   -- lọc theo tỉnh, mặc định
(status, published_at DESC)                 -- trang chủ
GIN trên tsvector                           -- tìm kiếm tiếng Việt
(owner_id, status)                          -- xe của tôi
(listing_id, type, created_at)              -- bảng events
```

### 2.4 Bảng `events` sẽ phình nhanh nhất

Mỗi lượt xem là một dòng. 1.000 tin × 100 lượt/tháng = 100.000 dòng/tháng.

- Số liệu cho chủ xe đọc từ **bảng tổng hợp theo ngày** (`events_daily`), không quét bảng thô.
- Cron gộp mỗi đêm. Bảng thô giữ 90 ngày rồi dọn.

### 2.5 Tìm kiếm

- **Debounce 300ms.** Gõ 10 chữ = 1 request, không phải 10.
- Gõ tiếp thì **huỷ request cũ** (`AbortController`).
- Nhớ kết quả tìm gần nhất trong phiên — bấm quay lại là hiện ngay, không gọi lại.

---

## 3. Mã JavaScript

- **Chia gói theo route.** Khách vào trang tìm kiếm **không** tải code của ví token, quản trị, form đăng xe.
- `lucide-react`: **import từng icon**, không `import * from`. Cả gói là hơn 1 MB.
- Thư viện nặng (biểu đồ, bản đồ, lịch) → `React.lazy`, chỉ tải khi thực sự mở.
- **Prefetch khi rê chuột / chạm** vào thẻ xe → trang chi tiết mở gần như tức thì.
- Trước khi thêm thư viện mới: cân xem tự viết 30 dòng có xong không.

---

## 4. Kết xuất giao diện

- Danh sách **trên 100 thẻ** → virtualize (chỉ dựng phần đang nhìn thấy).
- Đổi một bộ lọc **không được** dựng lại toàn bộ danh sách — memo thẻ xe theo `id`.
- **Skeleton, không phải spinner.** Khung xám đúng hình dạng thẻ thật → cảm giác nhanh hơn hẳn và không nhảy layout.
- Bản đồ: **ảnh tĩnh + nút "Mở bản đồ"**, không nhúng iframe Google Maps trong danh sách. Mỗi iframe là vài trăm KB.

---

## 5. Bộ nhớ đệm

| Loại | Chính sách |
|---|---|
| Ảnh (tên có hash) | `max-age=31536000, immutable` |
| Danh sách tin | `stale-while-revalidate` 60s — hiện bản cũ ngay, làm mới ngầm |
| Dữ liệu tĩnh (hãng xe, tỉnh thành) | tải 1 lần, lưu `localStorage`, có số phiên bản |
| Khung app | Service Worker (app đã có `manifest.json`) |

Bấm **Quay lại** phải hiện lại danh sách cũ **tức thì**, đúng vị trí đã cuộn — không tải lại từ đầu. Đây là chỗ khách cảm nhận rõ nhất.

---

## 6. Cảm nhận nhanh (quan trọng ngang tốc độ thật)

- **Lưu xe:** đổi màu tim ngay, gọi API ngầm, lỗi thì hoàn lại. Không bắt chờ.
- **Xem số điện thoại:** hiện số ngay, ghi sự kiện ngầm.
- Mọi nút bấm phải phản hồi **dưới 100ms**, kể cả khi việc thật còn đang chạy.
- Chuyển ảnh mờ → nét bằng `opacity` 200ms, đừng đổi đột ngột.

---

## 7. Riêng cho trang quản trị (luồng 10)

Trang admin **không cần** mấy quy tắc trên — ít người dùng, mạng tốt. Đừng tối ưu sớm ở đó. Nhưng:
- Bảng dữ liệu phải phân trang, cấm tải hết.
- Báo cáo doanh thu đọc từ bảng tổng hợp, không quét bảng thô.

---

## 8. Kiểm tra trước khi báo xong

- [ ] Chrome DevTools → Network: **Slow 4G** + Performance: **CPU 4× slowdown**
- [ ] Lighthouse mobile ≥ **90** điểm Performance
- [ ] Tạo 1.000 tin mẫu, đo lại truy vấn danh sách
- [ ] Cuộn hết trang tìm kiếm, xem tổng số byte đã tải
- [ ] Tắt mạng giữa chừng → giao diện báo lỗi tử tế, không treo trắng

---

## 9. Cấm

- Cấm trả ảnh gốc ra danh sách.
- Cấm `<img>` thiếu `width`/`height` hoặc `aspect-ratio`.
- Cấm `select *` cho danh sách.
- Cấm phân trang bằng `OFFSET`.
- Cấm import cả gói `lucide-react`.
- Cấm nhúng iframe bản đồ trong danh sách.
- Cấm tải toàn bộ ảnh của slider ngay khi mở trang.
- Cấm spinner toàn màn hình cho việc dưới 1 giây.
