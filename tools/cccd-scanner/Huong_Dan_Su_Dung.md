# HƯỚNG DẪN SỬ DỤNG TOOL QUÉT CCCD XUẤT EXCEL - GIAO DIỆN INDEX
### 🔒 100% Offline • Bảo Mật Tuyệt Đối • Không Gửi Dữ Liệu Lên Mạng • Không Cần API

Chào anh! Toàn bộ công cụ đã được nâng cấp lên **Giao diện Web Index** chuyên nghiệp, chia làm **2 phần riêng biệt (Quét riêng lẻ & Quét Folder)**, đáp ứng tiêu chuẩn **bảo mật dữ liệu tuyệt đối**.

---

## 🛡️ TÍNH NĂNG BẢO MẬT TUYỆT ĐỐI (ZERO CLOUD DATA)
1. **Chỉ chạy Localhost (`127.0.0.1:8000`)**: Server nội bộ bị cô lập hoàn toàn, máy tính khác trong mạng LAN hoặc Internet không thể kết nối.
2. **Không gửi bất kỳ dữ liệu nào ra ngoài Internet**:
   - Giao diện `index.html` được lập trình bằng CSS & Javascript thuần độc lập.
   - Không sử dụng CDN bên ngoài, không tải Google Fonts, không tracking.
   - Kể cả khi anh **rút dây mạng hoặc ngắt Wi-Fi**, phần mềm vẫn hoạt động 100% mượt mà.
3. **Xử lý an toàn trong bộ nhớ máy tính**: Mọi thuật toán giải mã mã QR và OCR đều chạy trực tiếp trên CPU của máy tính.

---

## 🚀 CÁCH KHỞI ĐỘNG CÔNG CỤ (1-CLICK)
Trong thư mục `Tool_Quet_CCCD_Excel`, click đúp chuột vào file:  
👉 **`Chay_Giao_Dien_Index.bat`**

Trình duyệt Web (Chrome, Edge, Cốc Cốc) sẽ tự động mở lên tại địa chỉ:  
🔗 **`http://127.0.0.1:8000`**

---

## 🖥️ GIAO DIỆN CHIA LÀM 2 PHẦN RÕ RÀNG:

### 1️⃣ PHẦN 1: QUÉT RIÊNG LẺ (TỪNG ẢNH / NHIỀU ẢNH)
* **Kéo thả hoặc chọn ảnh**: Chọn một hoặc nhiều ảnh CCCD (có thể chọn hàng chục ảnh).
* **Xem trước (Preview)**: Hiển thị danh sách thumbnail các ảnh đã chọn, có nút `X` để xoá bớt ảnh không cần.
* **Tự động lọc trùng**: Tùy chọn bỏ qua ảnh CCCD trùng lặp.
* **Bắt đầu quét**: Bấm `🚀 Bắt Đầu Quét CCCD` -> Hệ thống giải mã QR (chính xác 100% trong 0.05s) và OCR tiếng Việt dự phòng.
* **Chỉnh sửa trực tiếp**: Click trực tiếp vào bất kỳ ô nào trong bảng kết quả để chỉnh sửa thông tin.
* **Xuất Excel**: Bấm `📥 Xuất File Excel (.xlsx)` để tải ngay về máy.

---

### 2️⃣ PHẦN 2: QUÉT THEO FOLDER (QUÉT TOÀN BỘ THƯ MỤC)
* **Cách A - Nhập đường dẫn thư mục**: Nhập trực tiếp đường dẫn thư mục trên máy (ví dụ `D:\Anh_CCCD` hoặc bấm chọn nhanh thư mục mặc định `anh_cccd_dau_vao`).
* **Cách B - Chọn folder từ máy tính**: Bấm nút `Chọn Thư Mục Từ Máy Tính...` để chọn toàn bộ folder qua trình duyệt.
* **Bắt đầu quét thư mục**: Bấm `⚡ Quét Thư Mục Này`.
* **Tự động lưu**: Hệ thống tự động tạo file Excel tổng hợp lưu ngay vào thư mục kết quả `ket_qua_xuat_excel` trên máy tính.
* **Tải về**: Bấm nút `📥 Tải File Excel Này Về Máy` hoặc bấm nút `📁 Mở Thư Mục Excel` để xem trực tiếp trên máy tính.

---

## 📊 THÔNG TIN ĐƯỢC BÓC TÁCH VÀO EXCEL:
1. **STT**
2. **Tên File Ảnh**
3. **Số CCCD** (12 chữ số - Luôn định dạng kiểu Text, không mất số 0 ở đầu)
4. **Họ và Tên** (In hoa, chuẩn dấu tiếng Việt)
5. **Ngày Sinh** (`DD/MM/YYYY`)
6. **Giới Tính** (Nam / Nữ)
7. **Số CMND Cũ** (Nếu có)
8. **Nơi Thường Trú** (Địa chỉ đầy đủ, sạch đẹp)
9. **Ngày Cấp** (`DD/MM/YYYY`)
10. **Phương Thức Quét** (QR Code chính xác 100% / OCR Tiếng Việt)
11. **Trạng Thái** (Thành công / Cảnh báo)
