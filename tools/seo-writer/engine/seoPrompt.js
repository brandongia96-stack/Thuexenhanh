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

  // Mẫu mặc định cho khách thuê / cẩm nang
  return {
    title: `Kinh Nghiệm Thuê Xe Tự Lái 2026: Tránh Bẫy Đền Tiền & Thủ Tục Mới Nhất`,
    metaDescription: `Cẩm nang kinh nghiệm thuê xe tự lái từ dân trong nghề: Hướng dẫn quay video nhận xe 6 điểm, quy định cọc CCCD theo NĐ 282/2025 và cách xử lý phạt nguội.`,
    content: `# Kinh Nghiệm Thuê Xe Tự Lái 2026: Tránh Bẫy Đền Tiền & Thủ Tục Mới Nhất

> [!NOTE]
> **Điểm cốt lõi cần nhớ trước khi nhận xe:**
> - Tuyệt đối **không để chủ xe giữ CCCD gắn chip gốc** (Theo Nghị định 282/2025/NĐ-CP, hành vi giữ CCCD gốc là vi phạm pháp luật). Chỉ đối chiếu thông tin hoặc xuất trình trên app VNeID.
> - Bắt buộc dùng điện thoại **quay video 360 độ từ nóc đến gầm xe**, soi kỹ mép cản trước sau, vết đá bắn kính lái và chụp ảnh vạch xăng/pin trước khi lăn bánh.
> - Thỏa thuận rõ thời hạn giữ cọc tra phạt nguội (tối đa 15 - 20 ngày), hết hạn không có thông báo vi phạm trên csgt.vn thì chủ xe phải hoàn trả 100%.

Thuê xe tự lái giúp cả gia đình chủ động hành trình, tự do dừng nghỉ và thoải mái trải nghiệm các dòng xe mới mà không phải bỏ ra tiền tỷ để mua. Tuy nhiên, không ít bác tài đã gặp phải những tình huống dở khóc dở cười: trả xe bị trừ oan vài triệu tiền cọc vì "vết xước từ đời nào", hoặc bị giữ cọc phạt nguội cả mấy tháng trời không trả lại.

Nói thẳng ra, lỗi không chỉ ở một phía. Phần lớn rắc rối bắt nguồn từ việc người thuê chủ quan, không kiểm tra kỹ xe và không đọc kỹ các điều khoản ràng buộc trong hợp đồng.

Dưới đây là cẩm nang kinh nghiệm thực chiến từ dân chuyên vận hành xe tự lái, giúp bạn có chuyến đi suôn sẻ và an tâm 100%.

---

## 1. Thủ Tục Thuê Xe Tự Lái 2026 Cần Những Giấy Tờ Gì?

Nhiều nơi quảng cáo "thuê xe chỉ cần CCCD", nhưng thực tế khi đến nơi bạn vẫn phải đáp ứng đủ 3 điều kiện:

1. **Giấy phép lái xe (GPLX):** Bắt buộc hạng B1 (số tự động) hoặc B2 trở lên, còn hạn sử dụng.
2. **Căn cước công dân (CCCD):**
   > [!IMPORTANT]
   > **Cảnh báo pháp lý quan trọng:** Từ năm 2025 - 2026, theo Nghị định 282/2025/NĐ-CP, việc giữ thẻ CCCD gốc của công dân là hành vi vi phạm hành chính. Khi đi thuê xe, bạn **chỉ cho chủ xe chụp ảnh 2 mặt CCCD và quét mã QR trên VNeID** để xác thực danh tính. Đừng bao giờ để bất kỳ ai giữ lại thẻ CCCD gốc của mình!
3. **Tài sản thế chấp (Cọc hợp đồng):**
   - **Cách 1:** Để lại 01 xe máy chính chủ (trị giá từ 15 - 25 triệu đồng) kèm Cà vẹt gốc.
   - **Cách 2:** Đặt cọc tiền mặt hoặc chuyển khoản từ 15.000.000đ - 20.000.000đ (số tiền này sẽ được hoàn trả ngay khi thanh lý hợp đồng và trả xe nguyên vẹn).

Nếu bạn muốn tham khảo trước văn bản thỏa thuận, hãy tải ngay [mẫu hợp đồng thuê xe tự lái chuẩn pháp lý](/mau-hop-dong).

---

## 2. Bảng Giá Thuê Xe Tự Lái Tham Khảo Thị Trường 2026

Giá thuê xe phụ thuộc vào dòng xe, số ghế và ngày thuê (ngày thường hay cuối tuần, lễ Tết). Bạn nên nắm rõ mức giá sàn để không bị hớ:

| Phân khúc | Dòng xe tiêu biểu | Giá ngày thường (24h) | Giá ngày cuối tuần | Giá dịp Tết Nguyên Đán |
|---|---|---|---|---|
| **Hạng A (4 chỗ mini)** | Kia Morning, Hyundai i10, VinFast VF 3 | 500.000đ - 650.000đ | 650.000đ - 800.000đ | 1.000.000đ - 1.200.000đ |
| **Hạng B (Sedan 4-5 chỗ)** | Toyota Vios, Accent, City | 700.000đ - 850.000đ | 850.000đ - 1.000.000đ | 1.300.000đ - 1.500.000đ |
| **MPV 7 chỗ gia đình** | Mitsubishi Xpander, Veloz Cross | 850.000đ - 1.100.000đ | 1.100.000đ - 1.300.000đ | 1.600.000đ - 1.900.000đ |
| **SUV 7 chỗ gầm cao** | Toyota Fortuner, Ford Everest | 1.200.000đ - 1.500.000đ | 1.400.000đ - 1.700.000đ | 2.000.000đ - 2.500.000đ |
| **Cao cấp / Sang trọng** | Kia Carnival, Mercedes GLC | 1.800.000đ - 2.800.000đ | 2.200.000đ - 3.200.000đ | 3.500.000đ - 4.500.000đ |

> [!TIP]
> Bạn có thể truy cập trực tiếp vào mục [tìm kiếm xe tự lái toàn quốc](/thue-xe) để xem xe thật, vị trí gần nhà và so sánh giá giữa các chủ xe mà không mất phí trung gian.

---

## 3. Checklist 5 Bước Nhận Xe: "Bảo Bối" Chống Đền Tiền Oan

Rất nhiều khách thuê bị mất tiền vì những vết xước có sẵn trước đó. Hãy dành đúng 5 phút làm theo quy trình sau:

### Bước 1: Quay video 360 độ ngoại thất xe dưới ánh sáng rõ
Bật camera điện thoại ở chế độ HD/4K, đi một vòng quanh xe từ từ. Tập trung zoom kỹ vào:
- **Cản trước và cản sau:** Đây là 2 vị trí dễ bị cạ vỉa hè nhất.
- **La-zăng (vành mâm):** Chỗ hay bị chém lề đường khi tấp vào vỉa hè.
- **Mép kính lái:** Kiểm tra xem có vết đá văng rạn nứt nhỏ nào không.
- **Nóc xe và gầm xe:** Cúi xuống quay sơ bộ gầm cản trước xem có bị xệ hoặc rách tấm chắn bùn không.

### Bước 2: Chụp ảnh đồng hồ đo (Odo) và vạch nhiên liệu
- Chụp rõ số km hiển thị trên đồng hồ để tính giới hạn km (thường quy định 250 - 300km/ngày, phụ phí quá km từ 3.000đ - 5.000đ/km).
- Chụp mức xăng/pin hiện tại. Nguyên tắc chung: Nhận bao nhiêu vạch, trả lại bấy nhiêu vạch.

### Bước 3: Kiểm tra lốp xe và lốp dự phòng
- Xem gai lốp còn sâu không, lốp có bị chửa (phù) không.
- Mở cốp sau kiểm tra xem có lốp dự phòng và bộ kích nâng xe, tay mở ốc không. Nhiều bác tài đi đường đèo đêm bị nổ lốp mới tá hỏa xe không có đồ nghề thay lốp. Khi gặp sự cố hãy gọi ngay [danh bạ cứu hộ giao thông 24/7](/cuu-ho).

### Bước 4: Thử các tính năng an toàn trước khi lăn bánh
Nổ máy, kiểm tra:
- Hệ thống phanh chân và phanh tay điện tử.
- Điều hòa mát sâu không, đèn pha/cos, xi-nhan, gạt mưa hoạt động ổn định.
- Camera hành trình có cắm thẻ nhớ và đang ghi hình hay không. Camera hành trình là bằng chứng cứu cánh nếu xảy ra va chạm với xe khác.

### Bước 5: Yêu cầu ghi chú đầy đủ vào Biên bản bàn giao
Bất kỳ vết móp, vết trầy xước nào bạn nhìn thấy, hãy chỉ cho chủ xe và yêu cầu ghi rõ vào biên bản: *"Xe có vết trầy 10cm ở cửa sau bên phụ, mâm trước bên lái xước nhẹ..."*. Sau đó cả 2 bên cùng ký.

---

## 4. Xử Lý Phạt Nguội & Hoàn Tiền Cọc Thế Nào Cho Đúng?

Đây là vấn đề gây tranh cãi nhiều nhất giữa khách thuê và chủ xe.

### Quy định tra cứu phạt nguội chuẩn:
- Khi trả xe, chủ xe thường giữ lại từ **2.000.000đ - 3.000.000đ** tiền mặt để đối soát lỗi phạt nguội (như chạy quá tốc độ, đi sai làn đường trên cao tốc).
- Thời gian giữ cọc phạt nguội hợp lý là **15 đến 20 ngày**.
- Cả hai bên sẽ cùng tra cứu biển số xe trên Cổng thông tin điện tử Cục Cảnh sát Giao thông (**csgt.vn**) hoặc ứng dụng VNeTraffic.
- Nếu sau 20 ngày không có thông báo vi phạm trong khoảng thời gian bạn thuê, chủ xe phải chuyển khoản trả lại đủ 100% tiền cọc. Nếu có phạt nguội, bạn có quyền yêu cầu xem biên bản hình ảnh vi phạm rõ ngày giờ trước khi thanh toán.

Đọc thêm các kinh nghiệm an toàn tại [chuyên mục an toàn thuê xe](/an-toan).

---

## 5. Câu Hỏi Thường Gặp Khi Thuê Xe Tự Lái (FAQ)

### Thuê xe tự lái có giới hạn số km chạy mỗi ngày không?
Hầu hết các chủ xe đều quy định giới hạn từ **250km đến 350km/ngày**. Nếu chạy vượt quá mức này, phụ phí thường là 3.000đ - 5.000đ cho mỗi km phụ trội. Tuy nhiên, nếu bạn thuê dài ngày (từ 3 ngày trở lên), bạn có thể thương lượng với chủ xe tính tổng km cả chuyến đi để linh hoạt hơn.

### Nếu không may xe bị va quẹt trên đường thì xử lý ra sao?
Trước hết, giữ bình tĩnh và chụp ảnh hiện trường. Gọi điện ngay cho chủ xe để thông báo tình hình. Nếu xe có mua bảo hiểm thân vỏ 2 chiều, bạn phối hợp gọi số hotline của công ty bảo hiểm in trên góc kính lái để giám định viên đến ghi nhận. Chi phí bạn phải chịu thường chỉ gồm phí miễn thường bảo hiểm (khoảng 500.000đ/vụ) và tiền đền bù số ngày xe phải nằm gara sửa chữa (do 2 bên tự thỏa thuận).

### Có nên thuê xe tự lái qua sàn môi giới hay gọi trực tiếp chủ xe?
Thuê qua các ứng dụng trung gian thường phải chịu phí dịch vụ và hoa hồng cao (khiến giá thuê bị đội lên 15-20%). Hiện nay xu hướng nhiều người chọn là tìm kiếm xe trên các cổng kết nối trực tiếp như [Thuexenhanh](/thue-xe) — nơi khách được xem số điện thoại và gọi thẳng cho chủ xe, tự do thương lượng giá và thỏa thuận phương thức nhận xe thuận tiện nhất.

---

## Tổng Kết

Một chuyến đi trọn vẹn bắt đầu từ việc chọn đúng chiếc xe an toàn và một chủ xe tử tế, minh bạch. Hãy nhớ: dành ra 5 phút kiểm tra xe ban đầu sẽ giúp bạn tiết kiệm được cả triệu đồng và tránh được những tranh cãi không đáng có.

Chúc các bác tài có những chuyến đi vạn dặm bình an bên gia đình và người thân!`
  };
}
