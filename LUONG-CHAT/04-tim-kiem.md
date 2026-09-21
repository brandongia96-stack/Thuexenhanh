# Luồng 04 — Tìm kiếm & bộ lọc

> Mở luồng mới, dán: `Đọc CLAUDE.md và LUONG-CHAT/04-tim-kiem.md rồi bắt đầu.`

**Phụ thuộc:** 01, 02 · **Chặn:** không
**Bắt buộc đọc thêm:** `HIEU-NANG.md` mục 2 (truy vấn), 3 (bundle), 4 (render)

> ## 🎨 Giao diện lấy mẫu từ đâu
>
> Bê **`Overview.jsx` (357) + `CarCard.jsx` (317)** từ `_archive/giao-dien-dev/src/modules/` sang — lưới xe, bộ lọc, thẻ xe.
>
> Đọc `_archive/giao-dien-dev/DOC-TRUOC.md` **trước**. Tóm tắt luật:
> chỉ bê phần hiển thị, **không bê logic Firebase** (~88 chỗ gọi Firestore);
> nối vào API Supabase ở `contracts/api.md`; mapbox/recharts **tải trễ**;
> tên hiển thị là **"Thuê Xe Nhanh"**.

---

## Mục tiêu

Khách gõ vài chữ tiếng Việt bất kỳ và tìm ra xe. Đây là màn hình khách gặp đầu tiên — nó quyết định app có dùng được không.

## Module trong luồng

- `discovery/search` — ô tìm kiếm + full-text tiếng Việt
- `discovery/filter` — bộ lọc + chip đang lọc
- `discovery/compare` — **CẮT khỏi bản đầu**, không làm

## Tìm kiếm tiếng Việt — yêu cầu cứng

Dùng Postgres `unaccent` + `tsvector`. Phải chạy đúng các trường hợp:

| Khách gõ | Phải ra |
|---|---|
| `innova` | Toyota Innova, Innova Cross |
| `xe 7 cho` | mọi xe 7 chỗ (không dấu vẫn ra) |
| `vinfast vf8` | VinFast VF 8 (thiếu dấu cách vẫn ra) |
| `xe so tu dong quan 7` | lọc hộp số + quận, không phải tìm chuỗi |

Câu cuối là logic **đoán bộ lọc từ câu chữ** — code cũ đã có, xem `inferSmartFilters`.

## Bộ lọc

Tỉnh/thành → Quận/huyện · Khoảng giá · Số chỗ · Hộp số · Nhiên liệu · Hãng xe · Tiện nghi

Mỗi bộ lọc đang bật hiện thành **chip có nút X**. Bộ lọc lưu vào URL để chia sẻ link được.

## Sắp xếp

Mặc định: **tin còn hạn, mới cập nhật trước**. Các lựa chọn khác: giá tăng/giảm, gần tôi nhất.

> Khi luồng 07 bật đẩy tin, tin được đẩy chèn lên đầu nhưng **phải có nhãn "Tin ưu tiên"** — không được trộn lén vào kết quả tự nhiên.

## Bảng CSDL

Đọc: `listings`, `listing_images`, `brands`, `models`, `provinces`, `districts`, `amenities`
Ghi: `events` (type `search`)

Chỉ trả về tin `status = dang_hien_thi`.

## Tiêu chí hoàn thành

- [ ] Tìm không dấu ra đúng kết quả
- [ ] 4 trường hợp trong bảng trên chạy đúng
- [ ] Bộ lọc tổ hợp được, chip tắt được
- [ ] Bộ lọc lưu trong URL
- [ ] Tin hết hạn / bị ẩn **không** xuất hiện
- [ ] 1.000 tin mẫu vẫn trả kết quả dưới 300ms
- [ ] Phân trang **cursor**, 20 tin/lần, không dùng `OFFSET`, không đếm tổng
- [ ] Thẻ xe dùng ảnh `thumb` + nền `blur`, không dùng ảnh gốc
- [ ] Ô tìm kiếm debounce 300ms, huỷ request cũ
- [ ] Trang tìm kiếm 20 thẻ: tổng tải **dưới 500 KB**, Lighthouse mobile ≥ 90
- [ ] Ghi một dòng vào `CHANGELOG.md`

## Cấm

- Không gọi Algolia hay dịch vụ tìm kiếm ngoài. Postgres FTS là đủ cho giai đoạn này.
- Không hiện tin của chủ xe hết token.
- Không bịa số "15+ chuyến", "5.0 sao" trên thẻ xe như code cũ.

## Tham chiếu từ code cũ

- `Web thue xe/src/App.jsx` → `Overview` (dòng 1149), `inferSmartFilters` (dòng 2700), `activeChips` (dòng 2726), `SearchLocationPicker` (dòng 608)
