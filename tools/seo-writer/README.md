# Công Cụ Viết Bài SEO Top 3 Google — Thuexenhanh

Công cụ chuyên dụng tạo nội dung chuẩn SEO leo **TOP 1 - 3 Google trong vòng 3 tháng**, được thiết kế riêng cho nền tảng thuê xe tự lái **Thuexenhanh**.

---

## 🌟 Điểm Khác Biệt: "Không Như Ai Viết" (Anti-AI Slop & E-E-A-T)

Hầu hết các bài viết do AI thông thường viết ra đều bị Google phát hiện hoặc đánh tụt thứ hạng vì:
1. Mở bài sáo rỗng: *"Trong thời đại công nghệ số...", "Không thể phủ nhận rằng...", "Hãy cùng chúng tôi khám phá..."*
2. Thiếu chiều sâu và số liệu thật: Không nắm rõ giá xe, quy định cọc, rủi ro phạt nguội.
3. Không có tính hành động: Thiếu checklist, thiếu bảng biểu so sánh.

### Cách Công Cụ Này Giải Quyết:
- **Bộ lọc chặn 60+ cụm từ AI sáo rỗng:** Triệt tiêu hoàn toàn văn phong máy móc.
- **Giọng chuyên gia thực chiến (10 năm kinh nghiệm):** Viết gãy gọn, xưng hô chân thật, chia sẻ kinh nghiệm "xương máu" khi nhận/trả xe.
- **Dữ liệu chuẩn thị trường Việt Nam:** Giá thuê Vios 700k-900k, Xpander 900k-1.1tr, Carnival 1.8tr-2.5tr, VF 3 mini 500k-650k/ngày.
- **Tuân thủ pháp lý mới nhất:** Cảnh báo Nghị định 282/2025/NĐ-CP (Cấm tuyệt đối giữ CCCD gắn chip gốc, chỉ cho đối chiếu).
- **Tự động gắn Internal Links:** Điều hướng người đọc vào các trang xe thật `/thue-xe`, [mẫu hợp đồng thuê xe](/mau-hop-dong), [cứu hộ](/cuu-ho), [đăng tin chủ xe](/chu-xe/dang-tin).
- **Tự động sinh Schema JSON-LD:** `Article` + `FAQPage` + `BreadcrumbList` để ăn Rich Snippets và Featured Snippets trên Google.

---

## 🚀 Cách Sử Dụng Nhanh (1 Click)

### Cách 1: Chạy bằng giao diện Web UI (Khuyến nghị)
Nháy đúp vào file:
```
tools/seo-writer/start.cmd
```
Hoặc mở terminal chạy:
```bash
node tools/seo-writer/server.mjs
```
Trình duyệt sẽ tự động mở trang: `http://127.0.0.1:4646`

### Cách 2: Chạy bằng dòng lệnh (CLI)
```bash
# Xem kho 40+ từ khóa vàng
node tools/seo-writer/cli.mjs --list-keywords

# Viết một bài viết ngay lập tức
node tools/seo-writer/cli.mjs --keyword "kinh nghiệm thuê xe tự lái tránh đền tiền oan"

# Chấm điểm SEO cho một file bất kỳ
node tools/seo-writer/cli.mjs --audit ./tools/seo-writer/output/bai-viet.md
```

---

## 🔑 Cấu Hình Google Gemini API Key (Miễn phí 100%)

Công cụ hoạt động được ở cả 2 chế độ:
1. **Chế độ Offline Template (Mặc định):** Đã tích hợp sẵn bài viết mẫu thực chiến chất lượng cao, không cần internet hay API key.
2. **Chế độ Gemini AI:** 
   - Lấy API Key miễn phí tại: [Google AI Studio](https://aistudio.google.com/)
   - Bấm nút **"⚙️ Cấu hình API Key"** trên giao diện web để lưu khóa.
   - Hỗ trợ các model: `gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-1.5-pro`.

---

## 📊 12 Tiêu Chuẩn Vàng Chấm Điểm SEO Top 3

Mỗi bài viết được kiểm tra qua thuật toán chấm điểm 100 điểm:
1. **Title Tag:** 48 - 65 ký tự, chứa từ khóa chính, giật click CTR cao.
2. **Meta Description:** 135 - 160 ký tự, có từ khóa và lời kêu gọi hành động.
3. **Heading Hierarchy:** Đúng 1 thẻ H1, từ 4-8 thẻ H2, có từ khóa trong H2.
4. **Dung lượng:** 1.800 - 2.600 từ (đủ chiều sâu để đánh bại các sàn lớn).
5. **Mật độ từ khóa:** 1.0% - 2.0% (tự nhiên, không nhồi nhét).
6. **Featured Snippet:** Có hộp Tóm Tắt Nhanh (`> [!NOTE]`) ngay dưới H1.
7. **Bảng so sánh:** Bảng Markdown số liệu chi tiết.
8. **Checklist:** Quy trình 5 bước kiểm tra xe khi nhận.
9. **FAQ Section:** 4-5 câu hỏi thường gặp thực tế nhất.
10. **Internal Links:** Ít nhất 3-5 liên kết trỏ về các trang con của Thuexenhanh.
11. **Anti-AI Score:** Không chứa bất kỳ từ ngữ sáo rỗng AI nào.
12. **Call to Action:** Lời kêu gọi gọi trực tiếp chủ xe hoặc tìm xe.

---

## 🗺️ Lộ Trình 90 Ngày Leo Lên Top 3 Google

- **Tháng 1 (Tuần 1 - 4):** Lập 3 bài Pillar + 4 bài vệ tinh. Yêu cầu lập chỉ mục qua Google Search Console trong 24h. Kéo 50-100 độc giả đầu tiên từ mạng xã hội.
- **Tháng 2 (Tuần 5 - 8):** Phân tích dữ liệu Search Console, bổ sung LSI queries vào mục H3/FAQ. Tăng thời gian lưu trang (Dwell Time) > 3 phút nhờ bảng biểu và checklist.
- **Tháng 3 (Tuần 9 - 12):** Tối ưu CTR bằng cách thêm [2026], [Bảng Giá Mới] vào tiêu đề. Chiếm lĩnh Featured Snippet và FAQ Rich Results, duy trì vững chắc Top 1 - 3!
