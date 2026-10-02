# Nghiên cứu: nâng cấp hệ thống văn bản pháp lý

02/10/2026 · luồng nền tảng · dùng cho **luồng 12**.

Nguồn tham khảo: `_scratch/ChinhSachMioto.txt` — 6 văn bản của Mioto (cào ngày 02/10).
**Chỉ dùng để biết họ có những chủ đề gì. Không chép câu chữ** — vừa là bản quyền của họ,
vừa sai mô hình: Mioto giữ tiền, có đặt chỗ, có phí huỷ; mình không có cái nào.

> ⚠️ Đây là phân tích của AI, không phải tư vấn pháp lý. Trước khi thu tiền thật hoặc
> đăng ký với Bộ Công Thương, **phải có luật sư đọc lại** các văn bản cuối.

---

## 1. Mình đang có gì

| Văn bản | Mục | Độ dày |
|---|---|---|
| Điều khoản sử dụng | 8 mục | 58 dòng code |
| Chính sách bảo mật | 5 mục | 38 dòng |
| Chính sách hoàn token | 6 mục | 36 dòng |

Cơ chế tốt đã có: đánh số phiên bản + ngày hiệu lực (`phienBan.js`), ghi nhận đồng ý vào `user_consents`.
Tăng phiên bản là người dùng được hỏi đồng ý lại.

## 2. Mioto có 6 văn bản — cái nào áp dụng cho mình

| Văn bản Mioto | Mình | Lý do |
|---|---|---|
| Chính sách & quy định (trách nhiệm hai bên, sự cố, huỷ chuyến, giá, thanh toán, giao nhận, kết thúc sớm) | **Lấy một phần** | Trách nhiệm hai bên + sự cố nghiêm trọng: cần. Huỷ chuyến, thanh toán, giao nhận, kết thúc sớm: **KHÔNG** — app không đứng giữa giao dịch |
| Chính sách bảo vệ dữ liệu cá nhân (14 mục) | **Cần, nâng cấp lớn** | Bản của mình 5 mục, thiếu hẳn phần quyền của người dùng theo luật dữ liệu cá nhân |
| Giải quyết khiếu nại | **Cần, viết mới** | Mình chưa có trang này |
| Chính sách thuế cho chủ xe | **Cần, nhưng nội dung khác hẳn** | Họ khấu trừ thuế thay vì có chức năng thanh toán; mình không thu tiền thuê nên **nhiều khả năng không khấu trừ** — phải ghi rõ chủ xe tự kê khai |
| Bảo mật dữ liệu ứng viên | **Không** | Mình chưa tuyển dụng |
| Chính sách bảo mật (nhãn) | — | Nội dung cào bị trùng với văn bản thứ nhất |

## 3. Việc cần làm — xếp theo mức bắt buộc

### 🔴 Bắt buộc trước khi mở cho người thật

**A. Quy chế hoạt động (văn bản MỚI).** Trang rao vặt cho thuê xe nhiều khả năng là *sàn giao dịch
thương mại điện tử* theo quy định về TMĐT → phải **đăng ký với Bộ Công Thương** và công bố quy chế.
Quy chế gồm: quyền và nghĩa vụ của nền tảng / chủ xe / khách thuê; quy trình đăng tin, kiểm duyệt,
gỡ tin; cơ chế xử lý vi phạm; giải quyết khiếu nại; bảo vệ thông tin. **Chỉ sau khi đăng ký xong
mới được gắn logo Bộ Công Thương** — footer trước đó gắn logo khi chưa đăng ký là sai.

**B. Chính sách bảo vệ dữ liệu cá nhân — viết lại theo luật dữ liệu cá nhân.** Thiếu so với bản hiện tại:
- Ai là **bên kiểm soát / bên xử lý** dữ liệu (pháp nhân thật — chưa có, xem mục D)
- Phân loại **dữ liệu cơ bản** và **dữ liệu nhạy cảm** (ảnh giấy tờ xe có thể chứa dữ liệu nhạy cảm)
- **Sự đồng ý và cách rút lại** sự đồng ý — và hậu quả khi rút
- **Bên thứ ba nhận dữ liệu**: Supabase (máy chủ Singapore), Cloudflare, Google (đăng nhập) — đây là
  **chuyển dữ liệu ra nước ngoài**, phải nêu rõ
- **Thời hạn lưu trữ** từng loại (tài khoản, tin đăng, nhật ký lượt xem 90 ngày, sổ ví — không xoá được vì kế toán)
- **Quyền của người dùng**: xem, sửa, xoá, rút đồng ý, khiếu nại — và **làm bằng cách nào, trong bao lâu**
- Hậu quả / rủi ro không mong muốn có thể xảy ra
- Bộ nhớ trình duyệt (localStorage: phiên ẩn danh để khử trùng lượt xem, bộ lọc đã lưu)
- Người dưới 18 tuổi
- **Số điện thoại chủ xe công khai** khi khách bấm xem — giữ, đây là điểm đặc thù và đã có

**C. Giải quyết khiếu nại (văn bản MỚI).** Phân rõ hai loại:
1. Khiếu nại **về nền tảng** (tin bị gỡ oan, trừ token sai, dữ liệu bị dùng sai) → mình xử lý, có thời hạn cam kết
2. **Tranh chấp giữa chủ xe và khách** (cọc, hư hỏng, trả xe trễ) → mình **không phải trọng tài**: hỗ trợ
   cung cấp thông tin tin đăng, khoá tài khoản vi phạm, hướng dẫn tới cơ quan có thẩm quyền
Kênh tiếp nhận: nút "Báo cáo tin" (luồng 08) + email hỗ trợ. **Thời hạn phản hồi do anh quyết** — đừng
hứa con số đội vận hành không làm nổi.

**D. Thông tin pháp nhân.** Luật TMĐT yêu cầu website hiển thị tên doanh nghiệp, mã số, địa chỉ,
người đại diện, cách liên hệ. Hiện **chưa có** — anh phải cung cấp **thông tin thật**. Chưa có thì
không mở cho người thật. (Không bao giờ dùng thông tin công ty khác như footer cũ.)

### 🟠 Nên có sớm

**E. Trách nhiệm hai bên — mở rộng Điều khoản.** Chủ xe: quyền sở hữu hợp pháp, giấy tờ xe hợp lệ
(đăng ký, đăng kiểm, bảo hiểm còn hạn), thông tin tin đăng đúng sự thật, chính sách sạc/pin khai đúng.
Khách thuê: GPLX hợp lệ, kiểm tra xe khi nhận/trả, tuân thủ luật giao thông.
Nền tảng: **khuyến nghị** hai bên lập hợp đồng + biên bản bàn giao — và **cung cấp mẫu miễn phí**
(đây là tính năng hỗ trợ người thuê tốt, hợp mô hình liên hệ trực tiếp).

**F. Sự cố nghiêm trọng.** Xe bị cầm cố trái phép, dùng vào việc phạm pháp, tai nạn: nền tảng hợp tác
với cơ quan chức năng, cung cấp thông tin tài khoản khi có **yêu cầu hợp pháp**, khoá tài khoản liên quan.
Không hứa bồi thường.

**G. Thông tin thuế cho chủ xe (trang MỚI).** Theo quy định mới về quản lý thuế với kinh doanh qua nền
tảng số, việc **khấu trừ thuế thay** áp cho nền tảng **có chức năng thanh toán**. Mình không thu tiền thuê
xe → nhiều khả năng **không khấu trừ**, chủ xe **tự kê khai**; nhưng nền tảng **có thể vẫn phải cung cấp
thông tin chủ xe cho cơ quan thuế**. ⚠️ Điểm này phải hỏi kế toán/luật sư trước khi viết chắc.

### ⚪ Gợi ý thay cho các chính sách mình KHÔNG có

Thay vì "chính sách huỷ chuyến / phí huỷ / giao nhận", làm một mục **"Gợi ý để hai bên tự thoả thuận"**
trong FAQ: nên thống nhất trước về cọc, huỷ, trả trễ, xăng/pin khi trả, vượt km, hư hỏng nhỏ.
Đúng mô hình, mà vẫn giúp người thuê tối đa.

## 4. Cấm

- **Cấm chép câu chữ** từ `_scratch/ChinhSachMioto.txt`. Đọc để biết chủ đề, rồi tự viết.
- Cấm mọi câu hứa app không làm được: phí huỷ, hoàn tiền chuyến, bảo hiểm, xác thực GPLX, tổng đài 24/7.
- Cấm điền thông tin pháp nhân / hotline / email khi anh chưa đưa — để trống và **ẩn khối**.
- Cấm gắn logo Bộ Công Thương trước khi đăng ký xong.
- Đổi nội dung văn bản nào → **tăng phiên bản** trong `phienBan.js`.
