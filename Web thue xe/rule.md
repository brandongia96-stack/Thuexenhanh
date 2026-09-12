# Quy tắc Phát triển Ứng dụng (AI Instructions)

Dưới đây là các quy tắc cốt lõi AI cần tuân thủ nghiêm ngặt khi phát triển và bảo trì dự án này.

## 1. Công nghệ & Kiến trúc
- **Framework:** React.js (Vite).
- **Styling:** CSS thuần (Vanilla CSS) đặt trong `styles.css`. Tuyệt đối **KHÔNG** sử dụng TailwindCSS hay các thư viện CSS ngoài trừ khi được yêu cầu.
- **Icon:** Sử dụng thư viện `lucide-react`.
- **Lưu trữ:** Hiện tại đang sử dụng `localStorage` để lưu data giả lập (Mock Data) nhằm dễ dàng test offline.

## 2. Tiêu chuẩn Giao diện (Aesthetics)
- Giao diện phải mang phong cách **Hiện đại, Sạch sẽ, và Đẹp mắt (Premium UI)**.
- Bắt buộc sử dụng hệ thống Design Tokens (các biến CSS `var(--m-...)`) đã được định nghĩa trong `styles.css` (ví dụ: `var(--m-green)`, `var(--m-bg)`, `var(--m-subtle)`).
- Chú trọng vào hiệu ứng bo góc (`border-radius: 12px` đến `16px`), đổ bóng (`box-shadow`), và hiệu ứng hover (mượt mà với `transition`).
- Không sử dụng các đường viền đứt nét thô kệch (`border: dashed`) cho các thành phần UI chính thức.

## 3. Quy trình Xuất File Offline (Preview Offline)
- Để người dùng có thể nhấp đúp (double-click) mở giao diện kiểm tra ngay trên máy tính mà không cần chạy `npm run dev`, dự án đã được tích hợp `vite-plugin-singlefile`.
- **Hành động bắt buộc của AI:** Sau khi AI hoàn thành bất kỳ bản cập nhật tính năng hay giao diện nào, AI **phải tự động chạy lệnh** `npm run build`. 
- Lệnh build sẽ tự động đóng gói toàn bộ code React và CSS thành một file HTML duy nhất là `preview_offline.html` nằm ngay tại thư mục gốc.

## 4. Nghiệp vụ (Business Logic)
- Luôn đảm bảo phân tách rõ ràng luồng UI của **Khách Thuê** và **Chủ Xe**. 
- Hệ thống Gói đăng xe (Cơ bản vs Tích Xanh) có sự ảnh hưởng lớn tới số lượng trường dữ liệu hiển thị, phải cẩn thận dùng `graceful degradation` (ẩn bớt UI nếu thiếu data) thay vì render ra khoảng trống hoặc lỗi.
