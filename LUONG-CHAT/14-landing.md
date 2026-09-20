# Luồng 14 — Landing page & SEO

> Mở luồng mới, dán: `Đọc CLAUDE.md, HIEU-NANG.md và LUONG-CHAT/14-landing.md rồi bắt đầu.`

**Phụ thuộc:** 01 · **Nên làm sau:** 04 (để có ô tìm kiếm dùng lại)
**Model đề xuất:** Sonnet 5

---

## Mục tiêu

Trang `/` hiện là `src/modules/shell/TrangChu.jsx` — **54 dòng**, luồng 01 dựng tạm. Không ô tìm kiếm, không xe, không ảnh, không SEO. Luồng này biến nó thành mặt tiền thật.

Trang `/` phải làm được 3 việc, theo đúng thứ tự ưu tiên:
1. Khách thuê **tìm được xe ngay trên hero**
2. Chủ xe hiểu **vì sao nên đăng ở đây** (không hoa hồng) và bấm được vào luồng đăng tin
3. Google và trợ lý AI **đọc hiểu được** trang này

## Module trong luồng

- `src/modules/shell/TrangChu.jsx` — viết lại
- `index.html` — thẻ meta SEO *(file khung, luồng này được sửa; báo lại trong CHANGELOG)*
- `public/` — logo, favicon, ảnh og

---

## 1. Hero — ô tìm kiếm là thành phần quan trọng nhất

Với app thuê xe, ô tìm kiếm ngay trên hero là thứ chuyển đổi mạnh nhất (`Web thue xe/skill-ui.md` mục 2.2). **Không được thay bằng một nút "Khám phá ngay".**

Bố cục: tiêu đề + ô tìm kiếm + 1 đường dẫn phụ cho chủ xe.

Ô tìm kiếm tối thiểu: **Địa điểm** (tỉnh → quận) + nút **Tìm xe** → chuyển sang `/thue-xe` kèm tham số trên URL.

Dùng lại component lọc của luồng 04, **không viết lại bộ lọc thứ hai**. Nếu luồng 04 chưa xong thì làm ô địa điểm đơn giản rồi để lại `TODO` ghi rõ chỗ cần thay.

## 2. Khối "Xe mới đăng" — có điều kiện

Hiện tối đa 8 tin **thật**, lấy từ view `listing_card`, trạng thái `dang_hien_thi`, sắp xếp mới nhất.

🔴 **Chưa có tin thật thì ẩn cả khối.** Không ảnh mẫu, không xe minh hoạ, không "1.200 xe đang cho thuê". Nguyên tắc 1.2.

Thẻ xe dùng `thumb` 400w + nền `blur`, có `aspect-ratio` — `HIEU-NANG.md` mục 1.

## 3. Khối cho chủ xe

Nêu đúng mô hình, bằng con số thật đã chốt:
- Không hoa hồng. Chủ xe giữ trọn tiền thuê.
- Phí hiển thị **10 token/xe/tháng = 40.000đ**.
- Tích xanh **miễn phí**, xét theo giấy tờ.

Nút: *Đăng xe của bạn* → `/chu-xe/dang-tin`.

## 4. SEO — phần v0.2 đang thiếu hẳn

`index.html` hiện chỉ có `title` + `description`. Bổ sung:

```html
<meta name="robots" content="index, follow" />
<meta name="theme-color" content="#3b82f6" />
<link rel="canonical" href="https://thuexenhanh.com/" />

<meta property="og:type"        content="website" />
<meta property="og:title"       content="..." />
<meta property="og:description" content="..." />
<meta property="og:image"       content="/og-image.jpg" />
<meta property="og:locale"      content="vi_VN" />
<meta name="twitter:card"       content="summary_large_image" />
```

Thêm JSON-LD `Organization` + `WebSite` (có `SearchAction`).

Thêm `public/robots.txt` và `public/sitemap.xml` (tạm liệt kê các trang tĩnh).

> **Bỏ thẻ `keywords`.** Google không dùng từ 2009. Bản `dev` có thẻ này — đừng bê sang.
> **Không sao chép `<meta http-equiv="Cache-Control" content="no-cache...">`** như bản `dev`: nó phá cache asset, đi ngược `HIEU-NANG.md` mục 5. Cache do `public/_headers` lo.

## 5. Logo & favicon

Bản `dev` đã có `/logo.png` và `/logo-white.png`. Lấy về đặt vào `public/`, kèm `favicon.ico`, `apple-touch-icon.png`, `og-image.jpg` (1200×630).

Nếu không lấy được file gốc → **hỏi anh**, đừng tự vẽ logo mới.

---

## Tiêu chí hoàn thành

- [ ] Hero có ô tìm kiếm chạy được, sang `/thue-xe` đúng tham số
- [ ] Khối "Xe mới đăng" hiện tin thật, **chưa có tin thì ẩn cả khối**
- [ ] Khối chủ xe nêu đúng giá 10 token/tháng = 40.000đ
- [ ] `index.html` đủ og/twitter/canonical/robots + JSON-LD
- [ ] `robots.txt`, `sitemap.xml`, favicon, og-image có mặt trong `dist/` sau build
- [ ] LCP < 2,5s, CLS < 0,1 trên 4G giả lập; Lighthouse mobile ≥ 90
- [ ] Không có ảnh mẫu, không số liệu bịa
- [ ] Ghi một dòng vào `CHANGELOG.md`

## Cấm

- Cấm ảnh xe mẫu / xe minh hoạ trên trang chủ.
- Cấm số liệu bịa ("1.200 xe", "4.9★", "10.000 khách").
- Cấm câu cam kết app không thực hiện được: *"bảo hiểm tiêu chuẩn"*, *"giao dịch an toàn"*, *"nhận xe trong 5 phút"*, *"bảo mật tuyệt đối"*.
- Cấm nút "Đặt xe ngay" — nút là **"Xem số điện thoại"** hoặc **"Liên hệ chủ xe"**.
- Cấm viết bộ lọc thứ hai; dùng lại của luồng 04.
- Cấm sửa file ngoài `TrangChu.jsx`, `index.html`, `public/`.
