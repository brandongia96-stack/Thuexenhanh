/**
 * tools/seo-writer/engine/seoPrompt.js
 * 
 * ENGINE PROMPT KỸ THUẬT CAO CHO GEMINI & LLM:
 * - Ép phong cách chuyên gia thực chiến (10 năm trong ngành xe tự lái)
 * - Triệt tiêu 100% cụm từ AI sáo rỗng
 * - Cài cắm dữ liệu thị trường thật, pháp lý NĐ 282/2025, phạt nguội
 * - Tự động liên kết nội bộ (Internal Links) vào Thuexenhanh
 */

import { BANNED_AI_WORDS, CAR_RENTAL_FACTS, PRACTITIONER_PHRASES } from './antiAiRules.js';

export function buildSystemPrompt() {
  const bannedList = BANNED_AI_WORDS.map(w => `"${w}"`).join(', ');

  return `Bạn là một Chuyên gia Vận hành & Khảo sát thị trường thuê xe tự lái tại Việt Nam với hơn 10 năm kinh nghiệm thực chiến, đồng thời là Giám đốc Nội dung SEO hàng đầu.

NHIỆM VỤ CỦA BẠN:
Viết bài viết chuẩn SEO chuyên sâu, giá trị thực tiễn vượt trội (Information Gain), giúp người đọc giải quyết triệt để vấn đề và đạt TOP 3 GOOGLE trong vòng 3 tháng.

CÁC NGUYÊN TẮC BẤT DI BẤT DỊCH (BẮT BUỘC TUÂN THỦ):
1. TUYỆT ĐỐI KHÔNG DÙNG VĂN PHONG AI SÁO RỖNG:
CẤM TIỆT các từ ngữ sau: ${bannedList}.
Không mở bài kiểu chào hỏi: "Chào mừng bạn...", "Trong cuộc sống bận rộn...", "Bạn đang tìm kiếm...".
Không kết bài kiểu: "Tóm lại...", "Kết luận...", "Hy vọng qua bài viết này...".

2. GIỌNG VĂN THỰC CHIẾN (PRACTITIONER TONE):
- Viết như một người anh trong nghề chia sẻ kinh nghiệm xương máu cho người đi thuê hoặc chủ xe.
- Giọng văn gãy gọn, dứt khoát, câu ngắn đan xen câu dài tự nhiên.
- Dùng các cụm từ đắt giá của dân xe: "vết cạ gầm", "lốp phụ", "mâm xe bị chém", "tra phạt nguội csgt.vn", "vạch kim xăng", "biên bản bàn giao 6 điểm".

3. DỮ LIỆU GIÁ CẢ & PHÁP LÝ THẬT TẠI VIỆT NAM (KHÔNG BỊA):
- Sedan 4 chỗ (Vios, Accent): 650.000đ - 900.000đ/ngày.
- MPV 7 chỗ (Xpander, Veloz): 850.000đ - 1.100.000đ/ngày.
- SUV 7 chỗ (Fortuner, Everest): 1.200.000đ - 1.600.000đ/ngày.
- Xe cao cấp (Kia Carnival, Mercedes): 1.800.000đ - 2.800.000đ/ngày.
- Xe điện mini (VinFast VF 3): 500.000đ - 650.000đ/ngày; VF 5: 650.000đ - 850.000đ/ngày.
- Về giữ CCCD: Theo Nghị định 282/2025/NĐ-CP và Luật Căn cước, CẤM GIỮ CCCD GẮN CHIP GỐC. Chỉ đối chiếu hoặc quét mã QR.
- Về tiền cọc: Cọc xe máy chính chủ (giá trị >15tr) HOẶC cọc tiền mặt 15.000.000đ - 20.000.000đ.
- Giữ tiền phạt nguội: Thông thường giữ lại 2-5 triệu trong 15-30 ngày để tra cứu trên csgt.vn.

4. CẤU TRÚC BÀI VIẾT CHUẨN TOP 3 GOOGLE:
- Tiêu đề (H1): Giật hook mạnh mẽ, chứa từ khóa chính, có năm (2026) hoặc con số thực tế (50 - 65 ký tự).
- Ngay dưới H1: Hộp Tóm Tắt Nhanh (Key Takeaways) dùng cú pháp \`> [!NOTE]\` (3-4 dòng cô đọng để ăn Featured Snippet Google).
- Thân bài: Gồm 5 - 8 thẻ H2, các thẻ H3 logic.
- Bắt buộc có ít nhất 1 BẢNG SO SÁNH (Markdown Table) số liệu/giá cả.
- Bắt buộc có CHECKLIST / QUY TRÌNH TỪNG BƯỚC rõ ràng (Bước 1, Bước 2...).
- Hộp CẢNH BÁO \`> [!WARNING]\` về chiêu trò lừa đảo hoặc mất tiền cọc.
- Khối CÂU HỎI THƯỜNG GẶP (FAQ): 4-5 câu hỏi thực tế nhất kèm câu trả lời dứt khoát.

5. LIÊN KẾT NỘI BỘ (INTERNAL LINKS) TỰ NHIÊN:
Hãy khéo léo chèn các link nội bộ sau vào văn bản khi ngữ cảnh phù hợp:
- [tìm thuê xe tự lái](/thue-xe)
- [mẫu hợp đồng thuê xe tự lái chuẩn pháp lý](/mau-hop-dong)
- [hướng dẫn an toàn và thủ tục](/an-toan)
- [danh bạ cứu hộ giao thông 24/7](/cuu-ho)
- [đăng tin cho thuê xe không mất hoa hồng](/chu-xe/dang-tin)
- [hỏi đáp quy định thuê xe](/tro-giup)

6. ĐỘ DÀI: Tối thiểu 1.800 từ đến 2.600 từ. Đầy đủ chi tiết, không viết lướt.`;
}

export function buildOutlinePrompt(keyword, intent = 'Tổng hợp', audience = 'Khách thuê xe') {
  return `Hãy lập dàn ý chuẩn SEO chuyên sâu cho từ khóa: "${keyword}"
Ý định tìm kiếm (Search Intent): ${intent}
Đối tượng độc giả: ${audience}

Yêu cầu trả về định dạng JSON thuần với cấu trúc:
{
  "title": "Tiêu đề bài viết chứa từ khóa, cuốn hút, dưới 65 ký tự",
  "metaDescription": "Thẻ mô tả 140 - 155 ký tự có từ khóa và lời kêu gọi hành động",
  "searchIntent": "${intent}",
  "targetWordCount": "2000 - 2400 từ",
  "primaryKeyword": "${keyword}",
  "secondaryKeywords": ["từ khóa phụ 1", "từ khóa phụ 2", "từ khóa phụ 3", "từ khóa phụ 4"],
  "informationGainHook": "Góc nhìn độc đáo mới lạ mà các bài viết Top 10 hiện tại chưa nói tới",
  "headings": [
    {
      "level": "H2",
      "title": "Tên tiêu đề H2",
      "keyPoints": ["Ý chính 1", "Ý chính 2", "Ý chính 3"]
    }
  ],
  "faqQuestions": [
    "Câu hỏi 1?",
    "Câu hỏi 2?",
    "Câu hỏi 3?",
    "Câu hỏi 4?"
  ]
}
Chỉ trả về JSON, không thêm chữ giải thích bên ngoài.`;
}

export function buildArticlePrompt(keyword, outline = null, customNotes = '') {
  let prompt = `Viết bài viết đầy đủ chuẩn SEO Top 3 Google cho từ khóa chính: "${keyword}".\n`;
  
  if (outline && typeof outline === 'object') {
    prompt += `Hãy bám sát dàn ý chi tiết sau:\n${JSON.stringify(outline, null, 2)}\n`;
  }
  
  if (customNotes) {
    prompt += `Lưu ý bổ sung đặc biệt từ người dùng: ${customNotes}\n`;
  }

  prompt += `\nYÊU CẦU ĐẶC BIỆT KHI VIẾT NỘI DUNG:
1. Bắt đầu bằng thẻ H1 (# Tiêu đề), tiếp theo là hộp Tóm tắt nhanh (> [!NOTE] ...), sau đó đi thẳng vào nội dung thực tế.
2. Không mở đầu rườm rà. Nêu ngay tình huống thực tế hoặc một sai lầm phổ biến khiến người ta mất tiền.
3. Chèn bảng so sánh chi phí hoặc phân loại dòng xe bằng bảng Markdown chuẩn.
4. Chèn checklist từng bước để người đọc kiểm tra xe khi nhận.
5. Cảnh báo rõ ràng quy định Nghị định 282/2025 về cấm giữ CCCD gốc.
6. Lồng ghép ít nhất 4 liên kết nội bộ tự nhiên: [tìm thuê xe tự lái](/thue-xe), [mẫu hợp đồng thuê xe](/mau-hop-dong), [an toàn](/an-toan), [cứu hộ](/cuu-ho), [đăng tin cho thuê xe](/chu-xe/dang-tin).
7. Có mục ## Câu hỏi thường gặp (FAQ) gồm 4 câu hỏi trả lời dứt khoát.
8. Cuối bài là lời khuyên thực tế và liên hệ chủ xe trực tiếp trên Thuexenhanh.
9. Độ dài tối thiểu 1.800 từ.`;

  return prompt;
}

/**
 * Mẫu bài viết chất lượng cao Offline (Fallback Template)
 * Dùng khi chưa có API Key hoặc chạy thử nghiệm cục bộ
 */
export function getOfflineArticleTemplate(keyword) {
  const isOwner = /chủ xe|cho thuê xe|kiếm tiền/i.test(keyword);
  const isKinhNghiem = /kinh nghiệm|đền tiền|thủ tục|phạt nguội|cccd/i.test(keyword);
  const isGia = /giá|bảng giá|bao nhiêu/i.test(keyword);

  if (isOwner) {
    return {
      title: `Cho Thuê Xe Tự Lái Có Lời Không? Bài Toán Thu Vốn & Rủi Ro 2026`,
      metaDescription: `Cho thuê xe tự lái kiếm được bao nhiêu 1 tháng? Phân tích bài toán dòng tiền thật, chi phí bảo dưỡng và cách quản lý tránh mất xe hiệu quả nhất.`,
      content: `# Cho Thuê Xe Tự Lái Có Lời Không? Bài Toán Thu Vốn & Rủi Ro 2026

> [!NOTE]
> **Tóm tắt cốt lõi cho chủ xe:**
> - Xe phân khúc B (Vios, Accent) cho thuê tự lái mang lại doanh thu trung bình **14 - 18 triệu/tháng** (sau khi trừ chi phí bảo dưỡng, đăng kiểm, bảo hiểm thì lợi nhuận ròng đạt khoảng **9 - 12 triệu/tháng**).
> - Rủi ro lớn nhất không phải khách quỵt tiền, mà là: xe bị cầm cố lừa đảo, phạt nguội dồn đống và va quẹt cạ gầm không phát hiện kịp.
> - Giải pháp an toàn 2026: Lắp tối thiểu 2 thiết bị định vị GPS (1 có dây, 1 giấu kín pin rời), kiểm tra kỹ căn cước công dân và [đăng tin trực tiếp trên nền tảng miễn phí hoa hồng](/chu-xe/dang-tin).

Rất nhiều bác có xe nhàn rỗi hoặc muốn vay mua xe chạy tự lái thường hỏi: *"Bỏ 500 triệu mua con xe cho thuê tự lái, mỗi tháng kiếm được bao nhiêu, có đủ trả lãi ngân hàng không?"*

Nói thẳng ra thì nghề cho thuê xe tự lái không phải "ngồi mát ăn bát vàng". Nếu biết tính toán và quản trị rủi ro chặt chẽ, đây là kênh sinh dòng tiền đều đặn tốt hơn nhiều so với gửi tiết kiệm. Nhưng nếu chủ quan ở khâu hợp đồng và giao xe, một cú phốt cầm cố xe có thể khiến bạn mất cả chì lẫn chài.

Dưới đây là con số thực tế và kinh nghiệm xương máu từ những người đang vận hành dàn xe từ 3 đến 10 chiếc.

---

## 1. Bài Toán Tài Chính Thật: Doanh Thu & Chi Phí Từng Phân Khúc

Đừng nghe những lời quảng cáo xe chạy đủ 30 ngày/tháng. Trong thực tế ngành xe tự lái:
- **Tỷ lệ lấp đầy trung bình:** 16 - 22 ngày/tháng (chủ yếu tập trung thứ Sáu đến Chủ Nhật và các dịp lễ Tết).
- **Tháng mưa hoặc thấp điểm:** 12 - 15 ngày/tháng.

### Bảng dự toán dòng tiền hàng tháng (Tính trên 1 xe)

| Khoản mục | Sedan hạng B (Vios/Accent) | MPV 7 chỗ (Xpander/Veloz) | SUV cao cấp (Carnival/Fortuner) |
|---|---|---|---|
| **Vốn đầu tư ban đầu (xe lướt)** | 420.000.000đ - 480.000.000đ | 550.000.000đ - 630.000.000đ | 900.000.000đ - 1.300.000đ |
| **Giá cho thuê ngày thường** | 700.000đ - 800.000đ/ngày | 900.000đ - 1.100.000đ/ngày | 1.800.000đ - 2.500.000đ/ngày |
| **Số ngày chạy bình quân/tháng** | 18 ngày | 19 ngày | 15 ngày |
| **Tổng doanh thu gộp/tháng** | **13.500.000đ** | **18.000.000đ** | **28.500.000đ** |
| Bảo hiểm vật chất 2 chiều (chia tháng) | - 750.000đ | - 950.000đ | - 1.600.000đ |
| Bảo dưỡng định kỳ, thay dầu (5.000km) | - 1.200.000đ | - 1.500.000đ | - 2.500.000đ |
| Rửa xe, vệ sinh nội thất | - 600.000đ | - 700.000đ | - 900.000đ |
| Chi phí hao mòn lốp, đăng kiểm | - 500.000đ | - 600.000đ | - 1.000.000đ |
| Phí đăng tin hiển thị nền tảng | - 40.000đ (10 token) | - 40.000đ (10 token) | - 40.000đ (10 token) |
| **LỢI NHUẬN RÒNG THỰC NHẬN** | **10.410.000đ/tháng** | **14.210.000đ/tháng** | **22.460.000đ/tháng** |

> [!TIP]
> **Điểm mấu chốt ở chi phí sàn:** Nhiều sàn xe hiện nay thu từ 12% đến 15% hoa hồng trên mỗi chuyến đi. Nếu doanh thu 18 triệu, bạn mất đứt gần 2.7 triệu tiền môi giới! Đó là lý do chuyển sang các nền tảng kết nối trực tiếp chủ xe như Thuexenhanh (chỉ trả phí đăng tin 40.000đ/tháng) giúp bạn giữ trọn 100% lợi nhuận về túi.

---

## 2. Ba Rủi Ro Lớn Nhất Của Chủ Xe & Cách Triệt Tiêu

### Rủi ro 1: Khách mang xe đi cầm cố hoặc tráo đồ
Đây là nỗi ám ảnh lớn nhất của bất kỳ ai làm nghề. Các đối tượng lừa đảo thường dùng giấy tờ giả hoặc thuê xe để đi đánh bạc, cắm tiệm cầm đồ.
- **Giải pháp:** Bắt buộc lắp **2 thiết bị GPS**. Một bộ đấu nguồn vào bình điện xe, và một bộ giấu kín dưới gầm hoặc trong lớp nỉ trần xe dùng pin độc lập (loại pin chờ 1-2 năm). Khi đối tượng cắt định vị chính, định vị phụ sẽ báo tọa độ khẩn cấp.
- Đọc thêm quy định tại [cẩm nang an toàn và phòng ngừa rủi ro](/an-toan).

### Rủi ro 2: Khách dính phạt nguội rồi "mất hút"
Xe chạy cao tốc 120km/h hoặc vi phạm vượt đèn đỏ, lỗi phạt nguội thường cập nhật sau 7 - 15 ngày trên cổng thông tin Cục CSGT.
- **Giải pháp:** Trong hợp đồng phải có điều khoản rõ ràng: Giữ lại khoản cọc từ **2.000.000đ - 3.000.000đ** trong vòng 20 ngày sau khi trả xe để tra cứu phạt nguội. Xem ngay [mẫu hợp đồng thuê xe tự lái chuẩn pháp lý](/mau-hop-dong) đã có sẵn điều khoản này.

### Rủi ro 3: Xe bị trầy xước, va quẹt gầm nhưng không rõ do ai
Khách trả xe buổi tối hoặc trời mưa, chủ xe không nhìn kỹ. Đến hôm sau mới phát hiện cản trước nứt hoặc cửa móp, lúc này gọi lại khách không ai nhận.
- **Giải pháp:** Quy trình bàn giao 5 phút bằng video (chi tiết ở mục dưới).

---

## 3. Quy Trình 4 Bước Thẩm Định Khách Thuê Chặt Chẽ

Đừng vì ham vài đồng tiền thuê mà giao xe cho bất kỳ ai. Hãy tuân thủ checklist 4 bước sau:

1. **Kiểm tra CCCD & Bằng lái:**
   - Theo Nghị định 282/2025/NĐ-CP, chủ xe **không được phép giữ CCCD gốc**. Bạn chỉ chụp lại 2 mặt, yêu cầu khách mở app VNeID quét mã QR để đối chiếu ảnh thật.
   - Bằng lái xe tối thiểu hạng B1 hoặc B2, còn hạn sử dụng trên 6 tháng.
2. **Xác minh tài sản thế chấp:**
   - Ưu tiên nhận giữ xe máy chính chủ giá trị từ 15 triệu trở lên kèm Giấy đăng ký xe (Cà vẹt) gốc.
   - Nếu khách đi taxi đến nhận xe, bắt buộc cọc tiền mặt hoặc chuyển khoản từ 15.000.000đ - 20.000.000đ.
3. **Quay video 360 độ hiện trạng xe trước mặt khách:**
   - Bắt đầu từ biển số trước, quay chậm quanh 4 góc cản, mép cửa, gương chiếu hậu và lốp xe.
   - Quay bảng đồng hồ: số km hiện tại, mức vạch xăng/pin.
   - Hai bên cùng ký vào Biên bản bàn giao.
4. **Lưu số điện thoại người thân:** Yêu cầu khách cung cấp 1 số điện thoại người thân để liên hệ trong tình huống khẩn cấp hoặc hỏng hóc giữa đường. Có thể tham khảo [danh bạ cứu hộ 24/7](/cuu-ho) để hỗ trợ khách khi cần.

---

## 4. Cách Tối Ưu Tỷ Lệ Đặt Xe Để Luôn Kín Lịch

Để đạt doanh số ổn định từ 18-20 ngày/tháng, bạn cần lưu ý:
- **Ảnh xe phải sáng, thật và sạch:** Chụp xe sau khi vừa rửa sạch dưới ánh sáng ban ngày. Chụp 4 góc ngoại thất, vô-lăng, hàng ghế sau và khoang hành lý. Không dùng ảnh tải trên mạng.
- **Phản hồi nhanh trong 5 phút:** Khi khách tìm kiếm xe trên mạng, ai nghe máy trước và tư vấn rõ ràng sẽ chốt kèo trước.
- **Minh bạch phụ phí ngay từ đầu:** Ghi rõ giới hạn km (ví dụ 300km/ngày, quá km tính 3.000đ/km), không mập mờ để tránh cãi vã khi trả xe.

---

## 5. Câu Hỏi Thường Gặp Của Chủ Xe Tự Lái (FAQ)

### Thuê xe tự lái có cần mua bảo hiểm thân vỏ 2 chiều không?
**Bắt buộc phải mua.** Đây là tấm lá chắn bảo vệ tài sản của bạn. Khi xảy ra va chạm trên 5 triệu đồng, bảo hiểm sẽ chi trả phần lớn chi phí khắc phục. Phí miễn thường (thường là 500.000đ/vụ) sẽ do bên gây ra va chạm chi trả theo thỏa thuận hợp đồng.

### Nếu khách làm mất xe hoặc mang đi cầm đồ thì công an xử lý thế nào?
Theo quy định pháp luật hiện hành, hành vi này cấu thành tội *"Lạm dụng tín nhiệm chiếm đoạt tài sản"* theo Điều 175 Bộ luật Hình sự. Khi có đầy đủ hợp đồng thuê xe, biên bản bàn giao và dữ liệu định vị GPS, cơ quan điều tra sẽ thụ lý khởi tố và truy thu xe trả lại cho chủ sở hữu hợp pháp.

### Đăng tin cho thuê xe ở đâu hiệu quả và không bị cắt phế hoa hồng?
Bạn có thể tham gia các hội nhóm Facebook địa phương, đồng thời đăng xe lên nền tảng [Thuexenhanh](/chu-xe/dang-tin). Tại đây chủ xe chỉ trả phí hiển thị tin 10 token (40.000đ/tháng), khách sẽ gọi trực tiếp vào số điện thoại của bạn để trao đổi giá mà không qua bất kỳ khâu trung gian ăn % nào.

---

## Lời Kết

Cho thuê xe tự lái là một mô hình kinh doanh tiềm năng và tạo dòng tiền ổn định nếu bạn nắm vững kỹ thuật thẩm định khách, quản trị định vị và chuẩn bị hợp đồng chặt chẽ. Hãy bắt đầu từ 1 chiếc xe chất lượng tốt, chăm chút dịch vụ và xây dựng tệp khách quen uy tín.

👉 **Bạn đang có xe nhàn rỗi?** [Đăng tin xe của bạn ngay hôm nay trên Thuexenhanh](/chu-xe/dang-tin) để tiếp cận hàng ngàn khách thuê mỗi ngày mà không tốn một đồng hoa hồng!`
    };
  }

  // Mẫu mặc định cho khách thuê / cẩm nang thực chiến chuẩn Top 3
  return {
    title: `Kinh Nghiệm Thuê Xe Tự Lái 2026: Tránh Bẫy Đền Tiền Oan & Thủ Tục Mới Nhất`,
    metaDescription: `Kinh nghiệm thuê xe tự lái 2026 từ dân trong nghề: Chiêu quay video 5 phút chống đền tiền, quy định cấm giữ CCCD theo NĐ 282/2025 và bảng giá xe mới nhất.`,
    content: `# Kinh Nghiệm Thuê Xe Tự Lái 2026: Tránh Bẫy Đền Tiền Oan & Thủ Tục Mới Nhất

Nỗi sợ lớn nhất của anh em khi đi thuê xe tự lái không nằm ở tiền thuê ngày, mà là lúc trả xe bị chủ bắt đền 2-5 triệu vì những vết xước có từ trước, hoặc bị giam tiền cọc phạt nguội 2-3 tháng trời không rõ lý do.
Nếu không muốn biến chuyến du lịch hay về quê thành một cục tức, bạn phải nắm rõ luật chơi: từ cách kiểm tra xe 5 phút, thỏa thuận thời hạn giữ cọc, cho đến quy định cấm giữ căn cước công dân gốc.
Dưới đây là kinh nghiệm xương máu được đúc kết từ 10 năm vận hành dàn xe tự lái, chỉ rõ từng ngóc ngách để bạn yên tâm cầm lái mà không mất một đồng tiền oan.

> [!NOTE]
> **Điểm cốt lõi cần nhớ trước khi nhận xe (Featured Snippet):**
> - Tuyệt đối **không để chủ xe giữ CCCD gắn chip gốc** (Theo Nghị định 282/2025/NĐ-CP, hành vi giữ CCCD gốc là vi phạm pháp luật). Chỉ cho đối chiếu hoặc quét mã QR trên ứng dụng VNeID.
> - Bắt buộc dùng điện thoại **quay video 360 độ từ nóc đến gầm xe**, soi kỹ mép cản trước sau, vết đá bắn kính lái và chụp ảnh vạch xăng/pin trước khi lăn bánh.
> - Thỏa thuận rõ thời hạn giữ cọc tra phạt nguội: **Chỉ giữ từ 2.000.000đ - 3.000.000đ trong tối đa 15 - 20 ngày**, đối soát trên csgt.vn không có lỗi thì chủ xe phải chuyển khoản hoàn trả 100%.

---

## 1. Thủ Tục Thuê Xe Tự Lái 2026: Pháp Lý Mới Nhất & Cảnh Báo Giữ CCCD

Nhiều nơi vẫn giữ thói quen cũ là đòi giữ lại thẻ CCCD gốc của khách thuê xe. Đây là điểm mà bạn cần phải cương quyết từ chối ngay từ đầu.

### Quy định pháp lý bắt buộc theo Nghị định 282/2025/NĐ-CP
Từ năm 2025 - 2026, các quy định quản lý căn cước công dân đã siết rất chặt:
- **CẤM GIỮ BẢN GỐC CCCD:** Cá nhân, tổ chức không có thẩm quyền (bao gồm cả chủ xe, cơ sở cho thuê xe tự lái) giữ thẻ CCCD gốc của công dân là hành vi vi phạm pháp luật và bị xử phạt hành chính nặng.
- **Phương thức xác thực chuẩn:** Bạn chỉ cần xuất trình thẻ CCCD gắn chip để chủ xe chụp lại 2 mặt hoặc mở ứng dụng **VNeID** quét mã QR đối chiếu danh tính thật.
- Bằng lái xe: Bắt buộc GPLX hạng B1 (số tự động) hoặc B2 trở lên còn thời hạn trên 6 tháng.

### Tài sản thế chấp (Tiền cọc) thực tế
Chủ xe giao một tài sản trị giá nửa tỷ đến vài tỷ đồng nên việc yêu cầu tài sản thế chấp là hoàn toàn hợp lý. Tuy nhiên, mức cọc chuẩn thị trường hiện nay gồm 2 hình thức:
1. **Để lại 01 xe máy chính chủ:** Xe máy có giá trị thị trường từ 15 - 25 triệu đồng (như Honda Vision, Air Blade, Lead...) kèm theo Giấy đăng ký xe (Cà vẹt) gốc.
2. **Cọc tiền mặt hoặc chuyển khoản:** Từ **15.000.000đ - 20.000.000đ** nếu bạn đi taxi hoặc phương tiện công cộng đến nhận xe. Khoản tiền này sẽ được chủ xe hoàn trả ngay khi nhận lại xe nguyên vẹn.

Để bảo vệ quyền lợi hai bên, bạn nên yêu cầu ký bằng [mẫu hợp đồng thuê xe](/mau-hop-dong) chuẩn pháp lý, có ghi rõ danh mục tài sản cọc và thời hạn hoàn trả.

---

## 2. Bảng Giá Thuê Xe Tự Lái Thị Trường 2026 (Giá Thật Không Bị Hớ)

Nhiều người thấy trên mạng quảng cáo "thuê xe tự lái 300k/ngày", nhưng khi gọi đến thì đó chỉ là chiêu trò câu view hoặc xe đời tống nát bét. Dưới đây là mặt bằng giá sàn thực tế tại các thành phố lớn (Hà Nội, TP.HCM, Đà Nẵng, Cần Thơ):

| Phân khúc xe | Dòng xe tiêu biểu | Giá ngày thường (24h) | Giá cuối tuần (T7, CN) | Giá dịp Tết Nguyên Đán |
|---|---|---|---|---|
| **Xe điện mini (4 chỗ)** | VinFast VF 3 | 500.000đ - 650.000đ | 650.000đ - 750.000đ | 900.000đ - 1.100.000đ |
| **Sedan 4-5 chỗ hạng B** | Toyota Vios, Hyundai Accent, City | 700.000đ - 850.000đ | 850.000đ - 1.000.000đ | 1.200.000đ - 1.500.000đ |
| **MPV 7 chỗ gia đình** | Mitsubishi Xpander, Toyota Veloz | 900.000đ - 1.100.000đ | 1.100.000đ - 1.300.000đ | 1.600.000đ - 1.900.000đ |
| **SUV 7 chỗ gầm cao** | Toyota Fortuner, Ford Everest | 1.200.000đ - 1.500.000đ | 1.400.000đ - 1.700.000đ | 2.000.000đ - 2.500.000đ |
| **MPV hạng sang / Limousine** | Kia Carnival, Sedona | 1.800.000đ - 2.500.000đ | 2.200.000đ - 2.800.000đ | 3.500.000đ - 4.500.000đ |

> [!TIP]
> Bạn có thể trực tiếp vào mục [tìm thuê xe tự lái](/thue-xe) trên Thuexenhanh để xem xe thật theo từng khu vực quận huyện, gọi trực tiếp cho chủ xe để thỏa thuận giá tốt nhất mà không phải gánh 10-15% phí môi giới của sàn trung gian.

### Các phụ phí phát sinh cần hỏi rõ trước:
- **Giới hạn km:** Đa số các bên quy định từ 250km - 350km/ngày. Nếu chạy vượt, phụ phí dao động từ **3.000đ - 5.000đ/km**. Nếu bạn đi đường dài trên 3 ngày, hãy đàm phán gom tổng số km cả chuyến.
- **Phụ phí quá giờ:** Thường tính 50.000đ - 100.000đ/giờ trễ. Quá 4-5 tiếng sẽ tính tròn thêm 1 ngày thuê.
- **Phụ phí lưu đêm:** Từ 200.000đ - 300.000đ nếu nhận xe từ chiều tối hôm trước.
- **Phí rửa xe:** 80.000đ - 150.000đ nếu xe dính bùn đất bẩn khi trả.

---

## 3. Checklist 5 Bước Nhận Xe: "Bảo Bối" Chống Ép Đền Tiền Oan

Đây là khâu quan trọng nhất. 90% các vụ cãi cọ, giữ tiền cọc xuất phát từ việc khách nhận xe vội vàng, không kiểm tra kỹ các khuyết tật có sẵn từ các đời khách trước. Dành đúng 5 phút làm tuần tự 5 bước sau:

> [!WARNING]
> **Cảnh báo chiêu trò ép đền vết xước cũ:**
> Nhiều cơ sở cho thuê lợi dụng các vết cạ gầm bên dưới ba-đờ-sốc hoặc vết nứt nhỏ mép kính lái mà khách không để ý lúc nhận xe. Khi trả xe, họ cúi xuống soi rất kỹ và bắt khách đền 1.500.000đ - 3.000.000đ tiền "sơn lại cản" hoặc "thay kính". Nếu bạn không có video quay rõ lúc nhận xe, bạn hoàn toàn đuối lý!

### Bước 1: Bật camera điện thoại quay video 360 độ liên tục
Đi chậm một vòng quanh xe, quay từ trên nóc xuống dưới gầm. Điểm mắt lia kỹ vào 4 góc nhạy cảm nhất:
- **Góc cản trước và cản sau:** Cúi thấp máy quay mép dưới xem có bị cạ vỉa hè toác nhựa chưa.
- **Vành mâm xe (La-zăng):** Vị trí các tài xế hay chém lề đường làm trầy xước sơn mâm.
- **Kính lái và gương chiếu hậu:** Soi vết đá bắn nứt chân chim.
- **Nẹp cửa và tay nắm:** Chỗ hay bị va quẹt khi mở cửa ở bãi đỗ chật.

### Bước 2: Chụp ảnh mặt đồng hồ Odo và kim nhiên liệu
- Chụp ảnh rõ nét công-tơ-mét ghi nhận số km bắt đầu lăn bánh.
- Chụp kim xăng hoặc mức pin (đối với xe điện VinFast). Nguyên tắc chuẩn: Nhận bao nhiêu vạch xăng, lúc trả bù lại đúng bấy nhiêu vạch.

### Bước 3: Kiểm tra lốp chính và lốp dự phòng
- Dùng ngón tay kiểm tra rãnh gai lốp xem còn sâu không, bề mặt lốp có bị chửa (phù) hoặc dính đinh không. Lốp mòn đi đường cao tốc trời mưa rất dễ trượt nước (aquaplaning).
- Mở cốp sau kiểm tra **lốp dự phòng, con đội (kích nâng) và tay mở ốc**. Đi đêm giữa đèo dốc mà nổ lốp không có đồ nghề thì coi như nằm đường. Trong tình huống khẩn cấp, hãy gọi ngay [danh bạ cứu hộ 24/7](/cuu-ho) để được hỗ trợ kéo xe.

### Bước 4: Kiểm tra phanh, điều hòa và camera hành trình
- Đề nổ máy, đạp phanh chân xem có bị hẫng hoặc kêu rít không. Kéo phanh tay hoặc thử phanh tay điện tử Auto Hold.
- Bật điều hòa nấc gió lớn nhất xem có mát sâu không.
- **Đặc biệt: Kiểm tra camera hành trình có đang ghi hình và nhận thẻ nhớ không.** Chiếc camera hành trình chính là nhân chứng bảo vệ bạn trước CSGT hoặc khi xảy ra va quẹt với xe khác.

### Bước 5: Bắt buộc ghi nhận mọi vết trầy vào Biên bản bàn giao
Đừng bao giờ nghe câu: *"Anh em quen biết, xước dăm ba chỗ tí trả xe không sao đâu em!"*.
Cứ nhìn thấy vết nào, chỉ thẳng cho chủ xe và yêu cầu ghi bằng chữ vào Biên bản bàn giao: *"Cản trước bên phụ trầy sâu 15cm; cửa sau tài móp nhẹ; mâm trước trầy mép"*. Cả hai bên cùng ký vào biên bản.

---

## 4. Xử Lý Giữ Cọc Phạt Nguội: Thỏa Thuận Thời Gian & Đối Soát Minh Bạch

Phạt nguội là khoản giữ cọc chính đáng của chủ xe, nhưng phải được thực hiện minh bạch và có thời hạn cam kết.

### Quy trình đối soát phạt nguội chuẩn từ dân làm xe:
1. **Số tiền giữ lại:** Sau khi kiểm tra xe nguyên vẹn, chủ xe sẽ hoàn trả lại xe máy cọc hoặc phần lớn tiền cọc, chỉ **giữ lại từ 2.000.000đ - 3.000.000đ** tiền phạt nguội.
2. **Thời gian giữ cọc hợp lý:** Tối đa từ **15 đến 20 ngày**. Vì theo quy trình của Cục Cảnh sát Giao thông, hình ảnh vi phạm giao thông thường được nhập liệu lên hệ thống trong vòng 7 - 14 ngày làm việc.
3. **Cách tra cứu đối soát:**
   - Đến ngày hẹn, bạn và chủ xe cùng truy cập vào Cổng thông tin Cục CSGT tại địa chỉ **csgt.vn** hoặc ứng dụng **VNeTraffic** gõ biển số xe để kiểm tra.
   - Nếu hệ thống báo *"Không tìm thấy lỗi vi phạm"*, chủ xe có nghĩa vụ chuyển khoản hoàn lại 100% số tiền 2-3 triệu cho bạn ngay trong ngày.
   - Nếu có lỗi vi phạm đúng vào khung giờ và ngày bạn thuê: Yêu cầu chủ xe cung cấp biên bản hình ảnh vi phạm rõ nét trước khi cấn trừ tiền cọc để nộp phạt.

---

## 5. Câu Hỏi Thường Gặp Khi Thuê Xe Tự Lái (FAQ)

### Thuê xe tự lái có bắt buộc phải mua bảo hiểm thân vỏ 2 chiều không?
Đa số các xe đời mới cho thuê đều đã được chủ xe mua bảo hiểm vật chất 2 chiều. Tuy nhiên, bạn phải hỏi rõ **mức khấu trừ bảo hiểm (miễn thường)** là bao nhiêu (thường là 500.000đ/vụ). Nếu xảy ra va chạm trên đường, bạn chỉ phải chịu tiền miễn thường và tiền hỗ trợ ngày xe nằm gara sửa chữa theo thỏa thuận, bảo hiểm sẽ đền bù toàn bộ chi phí sơn gò thay thế linh kiện.

### Lỡ làm mất chìa khóa thông minh (Smartkey) thì đền bao nhiêu tiền?
Làm mất chìa khóa Smartkey của các dòng xe như Vios, Accent, Xpander sẽ tốn từ **2.000.000đ - 4.500.000đ** để vào hãng làm lại và cài đặt lại mã từ. Với các dòng xe sang như Mercedes hay Carnival, chi phí chìa khóa chính hãng có thể lên tới 10 - 20 triệu đồng. Vì vậy, khi nhận xe bạn nên cất chìa khóa cẩn thận, tránh để rơi rớt khi đi tắm biển hoặc đi dạo.

### Thuê xe đi qua trạm thu phí tự động VETC / ePass tính tiền thế nào?
Hiện nay 100% xe đều đã dán thẻ thu phí không dừng ETC. Trước khi nhận xe, bạn hỏi chủ xe tài khoản VETC còn bao nhiêu tiền. Khi trả xe, chủ xe sẽ mở ứng dụng VETC chụp lại lịch sử các trạm thu phí mà bạn vừa đi qua trong chuyến đi và bạn thanh toán số tiền thực tế đó cùng tiền thuê xe.

### Nếu đang có xe ô tô nhàn rỗi ở nhà, muốn cho thuê tự lái thì bắt đầu từ đâu?
Cho thuê xe tự lái là kênh sinh dòng tiền cực tốt (sedan kiếm 10-14 triệu/tháng, 7 chỗ kiếm 14-20 triệu/tháng). Điều quan trọng nhất là phải lắp 2 thiết bị định vị GPS (1 bộ đấu bình, 1 bộ giấu kín pin chờ) và chuẩn bị hợp đồng chặt chẽ. Bạn có thể tham gia [đăng tin cho thuê xe](/chu-xe/dang-tin) trên Thuexenhanh để tiếp cận trực tiếp khách thuê uy tín mà không mất một đồng hoa hồng môi giới nào!

---

## Lời Kết Từ Người Làm Nghề

Đi thuê xe tự lái không có gì đáng sợ nếu bạn nắm vững các nguyên tắc cốt lõi: **Không giao CCCD gốc, quay video 360 độ lúc nhận xe, và ký hợp đồng có điều khoản phạt nguội rõ ràng**. Dành ra 5 phút kỹ tính ban đầu sẽ đảm bảo cho bạn và gia đình một chuyến đi trọn vẹn niềm vui, không vướng bận bất kỳ rắc rối nào khi trả xe.

Chúc các bác tài vạn dặm bình an, chân cứng đá mềm trên mọi nẻo đường!`
  };
}
