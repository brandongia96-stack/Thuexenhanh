# TỔNG HỢP CÁC YÊU CẦU & CẬP NHẬT TÍNH NĂNG 

Đây là tài liệu tổng hợp toàn bộ các yêu cầu từ anh và những cập nhật, thay đổi đã được thực hiện trong suốt phiên làm việc này.

---

## 1. Các Yêu Cầu Của Anh (User Requests)
1. Thắc mắc về việc đã duyệt xe rồi nhưng vẫn không hiện lên trang tìm kiếm (phải ở trạng thái hiển thị).
2. Xe bấm duyệt rồi vẫn nằm ở trạng thái "Chờ duyệt".
3. Hỏi về quy trình cập nhật web (phải deploy hay không).
4. Yêu cầu tạo một bộ giả lập (demo) để test toàn bộ luồng hệ thống: tạo tài khoản ảo (chuxe123, khachthue123, admin) để đi hết quy trình mà không bị vướng quyền.
5. Sửa công cụ Deploy UI: Thêm 1 dòng load % hiển thị tiến độ thay vì để nút xám xịt khó hiểu.
6. Hỏi vị trí gõ email để đăng nhập.
7. Yêu cầu làm vĩnh viễn 2 lựa chọn đăng nhập: Google và Email/Mật khẩu.
8. Thêm nút "Đẩy CẢ HAI" (Push lên cả Dev và Main) vào công cụ Deploy, và phải hiện popup % tiến trình thay vì chạy ẩn.
9. Rà soát tổng thể và yêu cầu phát triển thêm tính năng "Xe gần bạn".
10. Sửa thẻ xe: Hiện khoảng cách tại góc dưới bên phải (Ví dụ: `12.3km` hoặc `20+ km`).
11. Thay đổi trải nghiệm người dùng lúc đặt xe: Đổi ô nhập thời gian mặc định thành một bộ lịch popup cho phép kéo/bấm chọn khoảng thời gian (Nhận xe -> Trả xe) giống hệt app Mioto, và tự động tính tiền.
12. Làm lại giao diện Footer (chân trang) chia cột chuyên nghiệp giống các trang lớn.
13. Bổ sung thêm phần logo "Đã đăng ký Bộ Công Thương" và "Phương thức thanh toán" vào Footer.
14. Lấy toàn bộ nội dung chữ (text) từ 6 đường link chính sách của Mioto và gom thành 1 file text duy nhất.
15. Yêu cầu cuối cùng: Viết ra 1 file markdown (.md) tổng hợp toàn bộ các nội dung của cuộc hội thoại này.

---

## 2. Các Tính Năng Đã Hoàn Thiện (Features & Updates)

- **Tài khoản Demo & Phân quyền:** Đã tạo kịch bản dữ liệu mẫu (SQL seed) sinh ra 3 tài khoản ảo (`chuxe123`, `khachthue123`, `admin123` đuôi `@test.com`), tự động cấp sẵn quyền admin, cấp 1000 token vào ví chủ xe để test mượt mà từ A-Z mà không bị vướng.
- **Tính năng Đăng nhập Email/Mật khẩu:** Viết lại giao diện đăng nhập, ghép thêm Form điền Email/Mật khẩu hiển thị vĩnh viễn bên cạnh nút Google. Thêm hàm `signInWithEmail` vào logic Auth.
- **Công cụ Deploy Cải tiến:** 
  - Tạo một Popup hiển thị tiến độ % mượt mà chạy trên màn hình khi deploy.
  - Thêm nút "Đẩy CẢ HAI" giúp tự động gọi liên tiếp 2 lệnh đẩy code lên nhánh `dev` và `main`.
- **Cải thiện luồng Đăng xe & Quản trị:** Cập nhật 10 ảnh xe mẫu cho hệ thống. Mở khóa nút "Thanh toán" cho xe đang "Chờ duyệt" để chủ xe có thể trả phí ngay. Chỉnh sửa cấp quyền (Grants) cho tính năng chặn biển số trùng của admin.
- **Tính năng "Xe Gần Bạn":** 
  - Tích hợp hàm toán học Haversine và API `navigator.geolocation` của trình duyệt. 
  - Radar sẽ xin quyền vị trí, tự quét DB lấy tất cả các xe có toạ độ, tính khoảng cách, lọc các xe trong bán kính 50km và hiển thị lên Trang chủ.
  - Gắn nhãn hiển thị khoảng cách (`12.3km`, `20+ km`) ngay trên góc phải bên dưới của thẻ xe (thay/kèm với nút tích xanh).
- **Lịch Chọn Ngày Giờ Đặt Xe (Date-Time Picker):** 
  - Đập bỏ ô nhập liệu ngày tháng có sẵn, xây mới toàn bộ một Component Lịch Popup (BoChonThoiGian).
  - Cho phép khách nhấp chọn ngày bắt đầu, ngày kết thúc tạo thành dải màu xanh liên tục. Chọn giờ bằng danh sách thả xuống.
  - Tự động bắt lỗi ngày trong quá khứ, giờ trả sớm hơn giờ nhận.
  - Thay đổi lập tức nảy số vào bảng tổng chi phí bên dưới.
- **Giao diện Footer V2:** 
  - Chuyển Footer cũ thành bản 5 cột chuyên nghiệp, hiển thị thông tin Công ty, Hotline, Mạng xã hội, Các cột chính sách, Đối tác.
  - Bổ sung 1 hàng sát dưới cùng chứa logo "Bộ Công Thương" và 4 phương thức thanh toán (MoMo, VNPAY, VISA, ZaloPay).
- **Cào Dữ Liệu (Web Scraping):** 
  - Viết riêng 1 kịch bản bot `puppeteer` chạy ngầm, chui vào 6 đường link chính sách bảo mật của Mioto, chờ giao diện load xong, sau đó copy toàn bộ văn bản và nối thành file `ChinhSachMioto.txt` (nặng ~90KB) lưu thẳng vào máy.

---

## 3. Danh Sách Các File Đã Bị Thay Đổi / Tạo Mới

**A. Các file hệ thống & cơ sở dữ liệu:**
1. `supabase/seed/demo-users.sql` *(Tạo mới - chứa user demo)*
2. `supabase/migrations/0009_grants.sql` *(Sửa lỗi quyền truy cập cho admin)*
3. `supabase/migrations/0013_nearby_cars.sql` *(Tạo mới - chứa hàm CSDL phục vụ tính khoảng cách)*

**B. Các file chức năng cốt lõi (Modules):**
4. `src/modules/auth/AuthProvider.jsx` *(Thêm logic đăng nhập bằng mật khẩu)*
5. `src/modules/auth/DangNhap.jsx` *(Sửa UI để hiện Form đăng nhập)*
6. `src/modules/shell/TrangChu.jsx` *(Nhúng tính năng Xe gần bạn)*
7. `src/modules/discovery/the-xe/TheXe.jsx` *(Hiển thị con số km khoảng cách trên thexe-chan)*
8. `src/modules/discovery/listing-page/BangTinhTongTien.jsx` *(Thay 2 ô input bằng Component Lịch mới)*
9. `tools/deploy-ui/index.html` *(Thêm popup % và nút Đẩy cả hai)*

**C. Các file Thành phần chung (Components) - Mới hoàn toàn hoặc sửa:**
10. `src/components/BoChonThoiGian.jsx` *(Tạo mới - Popup lịch đặt xe thông minh)*
11. `src/components/BoChonThoiGian.css` *(Tạo mới - Giao diện của lịch)*
12. `src/components/Footer.jsx` *(Viết lại toàn bộ cấu trúc Footer)*
13. `src/components/Footer.css` *(Tạo mới - CSS chuẩn chia cột cho Footer)*

**D. Các file Tool/Script làm thêm ngoài dự án:**
14. `scratch_mioto/fetch.js` *(Tạo mới - Script cào dữ liệu)*
15. `ChinhSachMioto.txt` *(Tạo mới - File thành phẩm chứa 6 trang chính sách)*
