# Hướng Dẫn Thiết Kế Giao Diện Đẹp Như Mioto (Concept "Beyond the Window")

Tài liệu này tổng hợp ngôn ngữ thiết kế, hệ thống mã màu, font chữ, bố cục layout và các component UI từ ứng dụng **Mioto** (phiên bản tái định vị thương hiệu thực hiện bởi **NAR8 Studio** với triết lý thiết kế hiện đại, mượt mà và trực quan). Hãy áp dụng các chỉ dẫn này để nâng cấp giao diện trang web thuê xe trở nên cao cấp, chuyên nghiệp và tăng tỷ lệ chuyển đổi.

---

## 1. Thiết Kế Nhận Diện & Tokens (Design Tokens)

Mioto sử dụng phong cách **Clean & Modern Digital Experience**, nhấn mạnh vào khoảng trống (whitespace), bo góc mềm mại và các tương tác nhỏ (micro-interactions) tinh tế.

### 1.1. Bảng Màu (Color Palette)
Hệ màu thương hiệu của Mioto mang tính hiện đại, kết hợp tông xanh lục bảo tươi sáng (emerald green) với các gam màu tối/sáng sâu.

*   **Primary Green (Xanh Lục Bảo):** `#5FCF86` (Màu chủ đạo cho nút CTA quan trọng, icon active, trạng thái khả dụng).
*   **Primary Hover:** `#48B670` (Màu xanh đậm hơn một chút khi hover).
*   **Primary Light (Soft Green):** `#E8F7EE` (Dùng cho background badge, nền nhãn hoạt động).
*   **Deep Charcoal (Tối sâu):** `#151515` (Màu chữ tiêu đề, font chính, tạo chiều sâu thay vì dùng màu đen thuần `#000`).
*   **Secondary Text (Xám):** `#767676` (Màu mô tả phụ, chi tiết kỹ thuật xe).
*   **Border & Divider (Đường viền):** `#E0E0E0` hoặc `#F0F0F0` (Rất mảnh để phân định không gian).
*   **Background Gray (Nền phụ):** `#F6F6F6` (Dùng làm nền cho trang, thẻ thông tin phụ).
*   **Urgent / Accent Red (Đỏ):** `#FA2535` (Màu cho giá thuê nổi bật, giảm giá, cảnh báo hết xe).
*   **Review Yellow (Vàng):** `#FFB700` (Màu sao đánh giá).

### 1.2. Font Chữ & Phân Cấp (Typography)
*   **Font chữ chính:** **Gilroy** (hoặc các font không chân hiện đại tương tự như **Inter**, **Outfit**, **Plus Jakarta Sans** làm fallback từ Google Fonts).
*   **Font-weight:**
    *   `Bold` (700) cho tiêu đề lớn, giá tiền.
    *   `SemiBold` (600) cho tiêu đề card xe, nút hành động.
    *   `Medium` (500) cho nhãn bộ lọc, tab hoạt động.
    *   `Regular` (400) cho mô tả chi tiết xe.

### 1.3. Bo Góc & Đổ Bóng (Border Radius & Shadows)
*   **Bo góc (Border Radius):**
    *   `4px` hoặc `8px` cho badge nhỏ.
    *   `10px` cho nút nhấn, input tìm kiếm.
    *   `16px` đến `20px` cho Container, Modal, Car Card (tạo vẻ ngoài bầu bĩnh, hiện đại).
*   **Đổ bóng mềm (Soft Shadows):**
    *   `box-shadow: 0px 8px 30px rgba(0, 0, 0, 0.04);` (Bình thường).
    *   `box-shadow: 0px 12px 40px rgba(0, 0, 0, 0.08);` (Hover hoặc Modal nổi lên).

---

## 2. Cấu Trúc Các Component Core (Bản Vẽ Thiết Kế)

Để tạo nên giao diện "chuẩn Mioto", hãy xây dựng các thành phần theo thiết kế chi tiết dưới đây:

### 2.1. Header (Thanh Điều Hướng)
Thiết kế tinh gọn, sử dụng nền trắng kính (Glassmorphism) nhẹ nhàng khi cuộn trang.
*   **Trái:** Logo Mioto (Dạng phẳng, chữ xanh lá tối giản kèm biểu tượng cửa sổ ô tô).
*   **Giữa:** Links điều hướng chính (`Về Mioto`, `Trở thành chủ xe`, `Blog`).
*   **Phải:** Nút `Đăng ký` / `Đăng nhập` (Dạng viền mảnh border) + Nút chọn ngôn ngữ `VI/EN`.

### 2.2. Hero & Search Widget (Khu Vực Tìm Kiếm Trung Tâm)
Mioto thu hút khách hàng ngay từ cái nhìn đầu tiên với khu vực tìm kiếm nổi bật trên hình ảnh/video banner chất lượng cao.
*   **Bố cục widget:**
    *   **Tab Switcher:** 2 tab bo góc tròn trịa: `Xe tự lái` (tích hợp icon vô lăng) & `Xe có tài xế` (tích hợp icon người lái). Khi active sẽ có màu trắng trên nền xanh lục bảo hoặc ngược lại.
    *   **Form tìm kiếm (Grid 3 cột):**
        1.  *Địa điểm:* Ô nhập địa chỉ giao xe, hỗ trợ tự động gợi ý vị trí (autocomplete).
        2.  *Thời gian nhận:* Chọn ngày và giờ (VD: `21:00, 15/06/2026`).
        3.  *Thời gian trả:* Chọn ngày và giờ trả xe.
    *   **Nút tìm kiếm (CTA):** Nút tròn hoặc hình chữ nhật bo góc mạnh mẽ màu xanh lục bảo `#5FCF86`, chữ trắng in đậm: **TÌM XE NGAY**.

### 2.3. Car Card (Thẻ Thông Tin Xe)
Thẻ hiển thị xe là thành phần quan trọng nhất quyết định tỷ lệ nhấn vào của người dùng.
*   **Ảnh đại diện xe:** Tỷ lệ `16:9`, bo góc trên `16px`. Tích hợp badge nhỏ đè lên ảnh:
    *   Góc trái trên: Badge giảm giá đỏ `#FA2535` hoặc badge loại hộp số `Số tự động`/`Số sàn`.
    *   Góc phải dưới: Trạng thái xe (VD: `Bản đồ`, `Giao xe nhanh` dạng xanh lá nhạt).
*   **Phần thông tin chi tiết (Body Card):**
    *   *Dòng 1:* Nhãn truyền động & Nhiên liệu (VD: `Số tự động` · `Xăng`) - màu xám nhỏ `#767676`.
    *   *Dòng 2:* Tên xe (VD: **MAZDA 3 LUXURY 2023**) - font chữ đậm màu đen `#151515`, kích thước khoảng `18px`.
    *   *Dòng 3 (Địa điểm & Đánh giá):*
        *   Icon Star vàng `#FFB700` + số điểm đánh giá (VD: `5.0 (28 chuyến)`).
        *   Icon MapPin + Quận/Huyện (VD: `Quận 7, TP. HCM`).
    *   *Dòng 4 (Giá & Đặt cọc):*
        *   Giá xe nổi bật màu xanh hoặc đỏ (VD: **850.000đ**`/ ngày`).
        *   Thông tin cọc hoặc ưu đãi hiển thị nhỏ bên dưới.

### 2.4. Tính Năng Bộ Lọc Thông Minh (Filter Bar)
*   **Dạng ngang (Desktop):** Nằm ngay dưới Header, gồm các dropdown chọn nhanh: `Hãng xe`, `Mức giá`, `Loại xe`, `Nhiên liệu`, `Tính năng phụ (Camera 360, Cửa sổ trời...)`.
*   **Chip hoạt động:** Khi chọn bộ lọc nào sẽ hiển thị thẻ Tag (Chip) có nút `X` để người dùng dễ dàng tắt đi.

---

## 3. Hệ Thống CSS Biến Số (CSS Custom Variables)

Hãy dán đoạn CSS sau vào file `src/styles.css` để định hình lại giao diện theo phong cách Mioto.

```css
/* Mioto Design System Tokens */
:root {
  --mioto-primary: #5fc986;       /* Xanh lục bảo chủ đạo */
  --mioto-primary-hover: #48b670; /* Xanh lục bảo khi hover */
  --mioto-primary-light: #e8f7ee; /* Nền xanh lá nhạt */
  --mioto-dark: #151515;          /* Chữ đen sâu */
  --mioto-text-sec: #767676;      /* Chữ phụ màu xám */
  --mioto-border: #f0f0f0;        /* Đường viền siêu mảnh */
  --mioto-bg-gray: #f6f6f6;       /* Nền xám phụ */
  --mioto-red: #fa2535;           /* Màu đỏ giá tiền, giảm giá */
  --mioto-yellow: #ffb700;        /* Màu vàng sao đánh giá */
  
  /* Fonts & Shadows */
  --font-display: 'Inter', system-ui, sans-serif;
  --mioto-shadow-soft: 0px 8px 30px rgba(0, 0, 0, 0.04);
  --mioto-shadow-hover: 0px 16px 40px rgba(0, 0, 0, 0.08);
  --mioto-radius-btn: 10px;
  --mioto-radius-card: 16px;
  --mioto-radius-modal: 24px;
  --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Base resets & styles */
body {
  font-family: var(--font-display);
  background-color: #ffffff;
  color: var(--mioto-dark);
}

/* Premium Button Mioto */
.btn-mioto-primary {
  background-color: var(--mioto-primary);
  color: #ffffff;
  font-weight: 600;
  border: none;
  border-radius: var(--mioto-radius-btn);
  padding: 12px 24px;
  transition: var(--transition-smooth);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-mioto-primary:hover {
  background-color: var(--mioto-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0px 4px 12px rgba(95, 201, 134, 0.3);
}

.btn-mioto-secondary {
  background-color: var(--mioto-primary-light);
  color: var(--mioto-primary-hover);
  font-weight: 600;
  border: 1px solid transparent;
  border-radius: var(--mioto-radius-btn);
  padding: 12px 24px;
  transition: var(--transition-smooth);
  cursor: pointer;
}

.btn-mioto-secondary:hover {
  background-color: #ffffff;
  border-color: var(--mioto-primary);
}

/* Premium Car Card */
.mioto-car-card {
  background: #ffffff;
  border: 1px solid var(--mioto-border);
  border-radius: var(--mioto-radius-card);
  overflow: hidden;
  box-shadow: var(--mioto-shadow-soft);
  transition: var(--transition-smooth);
}

.mioto-car-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--mioto-shadow-hover);
  border-color: rgba(95, 201, 134, 0.2);
}

/* Status Badge overlay */
.mioto-badge-green {
  background-color: var(--mioto-primary-light);
  color: var(--mioto-primary-hover);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
}

.mioto-badge-red {
  background-color: #ffeaea;
  color: var(--mioto-red);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
}

/* Custom pricing text */
.mioto-price {
  color: var(--mioto-red);
  font-weight: 700;
  font-size: 20px;
}
```

---

## 4. React Code Hướng Dẫn Nâng Cấp Giao Diện

Dưới đây là cách chuyển đổi component card hiện tại của bạn thành giao diện có cấu trúc đẹp mắt tương tự như Mioto.

### 4.1. CarCard Component
Sử dụng cấu trúc thẻ gọn gàng, có hình ảnh chất lượng cao và cách hiển thị giá, đánh giá nổi bật.

```jsx
import React from 'react';
import { Star, MapPin, Gauge, Shield, HelpCircle } from 'lucide-react';

function MiotoCarCard({ car, onView }) {
  const image = car.images?.[0]?.url || "https://images.unsplash.com/photo-1549925245-f20a5fe1f75a?auto=format&fit=crop&w=600&q=80";
  
  return (
    <div className="mioto-car-card">
      {/* Container Ảnh & Badge Đè */}
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
        <img 
          src={image} 
          alt={car.basicInfo.name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
          className="card-image-zoom"
        />
        
        {/* Hộp số badge */}
        <span style={{ 
          position: 'absolute', 
          top: '12px', 
          left: '12px', 
          background: 'rgba(21, 21, 21, 0.75)', 
          color: '#fff', 
          padding: '4px 10px', 
          borderRadius: '20px', 
          fontSize: '11px',
          fontWeight: 600
        }}>
          {car.technicalInfo.transmission === "Số tự động" ? "Số tự động" : "Số sàn"}
        </span>

        {/* Trạng thái trống xe */}
        {car.rentalInfo.status === "available" && (
          <span style={{ 
            position: 'absolute', 
            bottom: '12px', 
            right: '12px', 
            background: '#5FCF86', 
            color: '#fff', 
            padding: '4px 10px', 
            borderRadius: '6px', 
            fontSize: '12px',
            fontWeight: 700
          }}>
            Đặt lịch nhanh
          </span>
        )}
      </div>

      {/* Nội dung chi tiết */}
      <div style={{ padding: '20px', display: 'grid', gap: '10px' }}>
        
        {/* Phân loại và Nhiên liệu */}
        <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--mioto-text-sec)', fontWeight: 500 }}>
          <span>{car.basicInfo.vehicleType || "Xe tiện ích"}</span>
          <span>·</span>
          <span>{car.technicalInfo.fuel || "Xăng"}</span>
        </div>

        {/* Tên Xe */}
        <h3 style={{ 
          margin: 0, 
          fontSize: '18px', 
          fontWeight: 700, 
          color: 'var(--mioto-dark)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {car.basicInfo.brand} {car.basicInfo.model} {car.basicInfo.year}
        </h3>

        {/* Vị trí & Đánh giá */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
          {/* Sao đánh giá (Giả lập) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Star size={14} fill="var(--mioto-yellow)" color="var(--mioto-yellow)" />
            <span style={{ fontWeight: 600 }}>5.0</span>
            <span style={{ color: 'var(--mioto-text-sec)' }}>(15+ chuyến)</span>
          </div>

          {/* Vị trí quận */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--mioto-text-sec)' }}>
            <MapPin size={14} />
            <span>{car.rentalInfo.pickupLocation.split(',')[0]}</span>
          </div>
        </div>

        {/* Đường kẻ ngang nhẹ nhàng */}
        <div style={{ height: '1px', background: 'var(--mioto-border)', margin: '4px 0' }} />

        {/* Khu vực hiển thị giá */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <span className="mioto-price">
              {Number(car.rentalInfo.dayPrice).toLocaleString('vi-VN')}đ
            </span>
            <span style={{ fontSize: '12px', color: 'var(--mioto-text-sec)', marginLeft: '4px' }}>/ngày</span>
          </div>
          
          {/* Nút xem chi tiết xe */}
          <button 
            onClick={() => onView(car)}
            className="btn-mioto-secondary"
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            Chi tiết
          </button>
        </div>

      </div>
    </div>
  );
}
```

---

## 5. Danh Sách Kiểm Tra UX/UI Tinh Tế Để "WOW" Người Dùng

Để trang web thuê xe của bạn có trải nghiệm tốt tương tự như ứng dụng di động của Mioto:

1.  **Hiệu ứng Zoom nhẹ khi di chuột vào ảnh xe:** Sử dụng CSS selector `img:hover { transform: scale(1.04); }` kèm `transition: transform 0.4s ease;` trên phần tử cha có `overflow: hidden`.
2.  **Đặt lịch tức thì:** Các xe có trạng thái `available` nên hiển thị nút hành động nhanh màu xanh nổi bật để tăng kích thích đặt thuê.
3.  **Trực quan hóa Bản đồ:** Khi click vào địa điểm nhận xe, hãy hiển thị popup Google Maps dạng tròn/bo góc có hiển thị bán kính giao xe hỗ trợ miễn phí.
4.  **Bản tối (Dark Mode):** Mioto giữ giao diện sáng sủa thoáng mát nhưng sử dụng nền màu xám dịu để làm nổi các bức ảnh xe rực rỡ sắc màu. Đảm bảo ảnh xe có độ phân giải tốt và đã được làm sạch phông nền xung quanh.
5.  **Dùng Icon đồng bộ:** Sử dụng hệ thư viện Lucide-React với thuộc tính `strokeWidth={1.8}` hoặc `2` để giữ nét vẽ thanh mảnh, đồng bộ trên toàn bộ trang web.
