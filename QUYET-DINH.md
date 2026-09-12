# QUYẾT ĐỊNH — Thuexenhanh

File này **chỉ append**, không ghi đè. Mỗi phiên `/grillme` thêm một mục mới kèm ngày.

---

## Phiên 2026-09-12 — Nền tảng

Phạm vi: kiến trúc, CSDL, mô hình thu tiền, cách chia luồng làm việc.
Ngoài phạm vi (để luồng riêng): marketing, kênh khách hàng, UI từng màn.

### ✅ Đã chốt

1. **App hiện tại là demo.** 0 chủ xe thật, 0 khách thật.
2. **Bỏ Firestore, chuyển sang Postgres (Supabase).** Lý do: rao vặt là read-heavy nên Firestore tính tiền theo lượt đọc sẽ đắt theo quy mô; ví tiền cần transaction SQL thật; full-text tiếng Việt có sẵn; báo cáo doanh thu bằng SQL.
3. **Dựng khung mới (phương án B)**, không vá `App.jsx` 2.900 dòng. Code v0.1 đóng băng, chỉ đọc tham chiếu. Chấp nhận 2–3 tuần đầu chưa có gì chạy được để xem.
4. **Ví token là hạ tầng thu tiền duy nhất.** Cả ba hình thức (thuê bao / theo lead / đẩy tin) đều trừ qua cùng một ví.
5. **1 token = 4.000đ.**
6. **10 token / 1 xe / 1 tháng** = 40.000đ. Ba tháng = 30 token, tuyến tính, chưa giảm giá.
7. **Bỏ gói "vĩnh viễn 199K".** Tin luôn có hạn. Không có tin sống mãi.
8. **Trừ theo lead: chưa bật.** Hạ tầng ví để sẵn, bật sau nếu cần.
9. **Đẩy tin / vị trí top: chưa bật.** Chỉ mở khi một tỉnh có >50 tin đang hiển thị.
10. **Analytics theo từng xe và từng chủ xe nằm ở lõi** — đây là hàng hoá đem bán, là lý do chủ xe nạp token lần thứ hai.
11. **Tích xanh không bán bằng tiền.** Xét theo giấy tờ xe, miễn phí. Code cũ bán huy hiệu tin cậy — bỏ cách đó.
12. **Chia 12 luồng chat**, mỗi luồng một brief trong `LUONG-CHAT/`. Chỉ luồng nền tảng được sửa `CLAUDE.md` và `contracts/`.
13. **Marketing và kênh khách hàng đi luồng chat riêng.**
14. **Lớp chống mất code:** Git (đã cài, repo đã khởi tạo) + `scripts/backup.ps1` + `Web thue xe.rar` bản gốc. Luật viết trong `CLAUDE.md` mục 2.

### ❓ Chưa trả lời được

| Câu hỏi | Vì sao quan trọng |
|---|---|
| **Chủ xe đầu tiên là ai?** Chưa có người thật nào. | 40.000đ/tháng chỉ có nghĩa khi có người trả |
| **100 khách thuê đầu tiên đến từ kênh nào?** Anh để sang luồng marketing. | Không có khách thì chủ xe trả tiền để tin nằm trong tủ kính không ai đi ngang |
| **Cắt module nào khỏi bản đầu?** Em đề cử `compare`, `boost`, `receipt`, `inapp`, `reviews`. Anh chưa chọn. | 34 module, một người làm |
| **Ngân sách hạ tầng/tháng?** Em ước ~25–50 USD, anh chưa xác nhận. | Quyết định chọn dịch vụ |
| **Khách bị lừa cọc thì app chịu trách nhiệm tới đâu?** | Phải viết vào điều khoản (luồng 12) |
| **Web trước hay mobile app trước?** | Ảnh hưởng toàn bộ cách làm UI |

### ▶️ 3 việc tiếp theo

1. **Mở luồng 01 — Nền tảng & CSDL.** Ra `contracts/schema.sql`, `contracts/api.md`, `contracts/tokens.css` và khung React mới. Chặn toàn bộ 11 luồng còn lại.
2. **Tạo dự án Supabase** (region Singapore) + đăng ký một cổng VietQR (SePay hoặc PayOS) để luồng 06 có cái mà nối.
3. **Tạo repo GitHub private và đẩy code lên.** Git local mất theo ổ cứng.
