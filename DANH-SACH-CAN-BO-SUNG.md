# Danh Sách Hạng Mục Cần Bổ Sung Cho "Thuê Xe Nhanh"

Dựa trên phân tích mô hình kinh doanh "Rao vặt - Bán token" và các rủi ro pháp lý/lừa đảo, đây là checklist những thứ app **bắt buộc phải bổ sung** hoặc **điều chỉnh** để hệ thống có thể chạy an toàn và sinh lời.

---

## 🔴 MỨC 1: Bắt buộc hoàn thiện trước khi mở cho User thật (Go-live)

### Về Pháp lý & Giao diện (Luồng 12 & 14)
- [ ] **Viết mới "Quy chế hoạt động sàn TMĐT":** Bắt buộc phải có để đăng ký với Bộ Công Thương.
- [ ] **Viết mới "Quy trình giải quyết khiếu nại":** Phải quy định rõ app chỉ hỗ trợ trích xuất thông tin, KHÔNG bồi thường tài chính vì không can thiệp giao dịch.
- [ ] **Nâng cấp "Chính sách bảo mật":** Thêm các điều khoản theo Nghị định 13/2023/NĐ-CP (Vì có thu thập ảnh CCCD, Đăng ký xe).
- [ ] **Chính sách Thuế:** Nêu rõ Chủ xe tự kê khai thuế thu nhập, app không khấu trừ tại nguồn.
- [ ] **Footer chân trang:** Gỡ bỏ thông tin ảo (nếu có). Điền thông tin pháp nhân (công ty/hộ kinh doanh) thật. **Tuyệt đối chưa gắn logo Bộ Công Thương** (chỉ gắn khi đã đăng ký xong).

### Về Kỹ thuật & Bảo mật (Luồng 01)
- [ ] **Cài đặt Supabase RLS (Row Level Security):** Viết rules chặn đứng việc client tự ý sửa đổi field `is_verified` (tích xanh) và bảng `wallets` (số dư token). Việc này **chỉ Admin** mới được phép ghi.
- [ ] **Hệ thống Tracking:** Bắt buộc bổ sung tính năng đếm **Số lượt xem xe** và **Số lượt lấy số điện thoại**. *(Lý do: Đây là bằng chứng duy nhất để thuyết phục Chủ xe tiếp tục nạp tiền mua token).*

---

## 🟠 MỨC 2: Tính năng Bảo vệ người dùng & Chống lừa đảo (Trust & Safety)

### Trải nghiệm Khách Thuê (Luồng 05)
- [ ] **Modal Cảnh báo Lừa đảo (Cực kỳ quan trọng):** Khi khách bấm "Xem Số Điện Thoại", trước khi hiện số, app phải pop-up cảnh báo chữ Đỏ: *"TUYỆT ĐỐI KHÔNG CHUYỂN CỌC TRƯỚC KHI XEM XE TRỰC TIẾP. Thuê Xe Nhanh không chịu trách nhiệm bảo lãnh giao dịch này."* Khách bấm "Tôi đã hiểu" mới hiện số.
- [ ] **Nút "Báo cáo tin đăng":** Bổ sung công cụ để khách thuê report xe ảo, giá ảo, hoặc chủ xe có dấu hiệu lừa đảo (Luồng 08).
- [ ] **Trung thực dữ liệu:** Dọn dẹp sạch sẽ các đánh giá ảo, số sao hardcode trong code cũ. Đổi thành trạng thái "Chưa có đánh giá". (Đừng để khách hàng mất niềm tin ngay từ lần đầu vào app).

### Hỗ trợ Chủ Xe (Luồng 03)
- [ ] **Quà tặng tải về:** Chuẩn bị sẵn 1 file Word chứa "Mẫu hợp đồng thuê xe ô tô tự lái" và "Biên bản bàn giao xe" chuẩn pháp lý. Gắn nút "Tải mẫu hợp đồng miễn phí" vào Dashboard của Chủ xe.

---

## 🟡 MỨC 3: Đón đầu Tương lai & Tối ưu hoá

### Cho Xe Điện (EV)
- [ ] **Bổ sung trường "Quy định Pin" cho Chủ xe:** Thêm ô input để chủ xe nhập rõ: "Giao xe pin bao nhiêu %, trả xe dưới % đó thì bù bao nhiêu tiền". (Tránh cãi vã khi trả xe).

### Vận hành & Hệ thống
- [ ] **Rate Limiting (Chống click tặc):** Chuẩn bị cơ chế chặn 1 IP click lấy số điện thoại liên tục vào 1 xe (Để phòng hờ sau này nếu anh chuyển sang mô hình thu token theo mỗi lượt lấy số, bảo vệ ví của Chủ xe).
- [ ] **Nâng cấp công cụ kiểm duyệt Admin (Luồng 10):** Chức năng duyệt ảnh CCCD/Đăng kiểm cho Chủ xe (cấp Tích Xanh) cần phải chia 2 màn hình song song để đối chiếu thông tin chữ và ảnh.

---

*Lưu ý: Bảng danh sách này được tối ưu riêng cho mô hình "Rao vặt - Không thu hoa hồng" của Thuê Xe Nhanh. Anh có thể dùng file này làm Roadmap (Bản đồ lộ trình) để tick chọn từng task.*
