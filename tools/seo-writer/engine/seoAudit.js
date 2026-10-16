/**
 * tools/seo-writer/engine/seoAudit.js
 * 
 * BỘ CHẤM ĐIỂM SEO TOP 3 & KIỂM TRA ĐỘ "CON NGƯỜI" (12 TIÊU CHÍ VÀNG)
 * Đánh giá chi tiết từng khía cạnh kỹ thuật và nội dung để đảm bảo
 * bài viết có xác suất cao nhất vào Top 3 Google trong vòng 3 tháng.
 */

import { checkAiSlop } from './antiAiRules.js';

export function auditSeoArticle({
  title = '',
  metaDescription = '',
  content = '',
  targetKeyword = '',
  slug = ''
}) {
  const criteria = [];
  let totalScore = 0;
  const keywordLower = (targetKeyword || '').trim().toLowerCase();

  // 1. Phân tích Tiêu đề (Title Tag) - Trọng số 10 điểm
  let titleScore = 0;
  const titleFeedback = [];
  const titleLen = title.length;
  if (titleLen >= 45 && titleLen <= 70) {
    titleScore += 5;
  } else if (titleLen > 0) {
    titleScore += 2;
    titleFeedback.push(`Độ dài tiêu đề (${titleLen} ký tự) chưa tối ưu. Nên từ 48 - 65 ký tự để không bị cắt trên Google.`);
  } else {
    titleFeedback.push('Chưa có tiêu đề bài viết.');
  }

  if (keywordLower && title.toLowerCase().includes(keywordLower)) {
    titleScore += 5;
  } else if (keywordLower) {
    titleFeedback.push(`Tiêu đề chưa chứa chính xác từ khóa mục tiêu: "${targetKeyword}".`);
  }
  criteria.push({
    name: '1. Tiêu đề chuẩn CTR (Title Tag)',
    score: titleScore,
    maxScore: 10,
    status: titleScore >= 8 ? 'pass' : (titleScore >= 5 ? 'warning' : 'fail'),
    feedback: titleFeedback.length ? titleFeedback.join(' ') : 'Tiêu đề chuẩn SEO, đúng độ dài và chứa từ khóa chính.'
  });
  totalScore += titleScore;

  // 2. Phân tích Meta Description - Trọng số 8 điểm
  let metaScore = 0;
  const metaFeedback = [];
  const metaLen = metaDescription.length;
  if (metaLen >= 120 && metaLen <= 165) {
    metaScore += 4;
  } else if (metaLen > 0) {
    metaScore += 2;
    metaFeedback.push(`Độ dài Meta Description (${metaLen} ký tự). Khuyến nghị từ 135 - 160 ký tự.`);
  } else {
    metaFeedback.push('Chưa có thẻ Meta Description.');
  }

  if (keywordLower && metaDescription.toLowerCase().includes(keywordLower)) {
    metaScore += 4;
  } else if (keywordLower) {
    metaFeedback.push('Meta Description chưa chứa từ khóa chính.');
  }
  criteria.push({
    name: '2. Thẻ mô tả (Meta Description)',
    score: metaScore,
    maxScore: 8,
    status: metaScore >= 7 ? 'pass' : (metaScore >= 4 ? 'warning' : 'fail'),
    feedback: metaFeedback.length ? metaFeedback.join(' ') : 'Meta description hấp dẫn, đủ độ dài và chứa từ khóa.'
  });
  totalScore += metaScore;

  // 3. Cấu trúc Headings (H1, H2, H3) - Trọng số 10 điểm
  let headingScore = 0;
  const headingFeedback = [];
  const h1Matches = content.match(/^#\s+[^\#\n]+/gm) || [];
  const h2Matches = content.match(/^##\s+[^\#\n]+/gm) || [];
  const h3Matches = content.match(/^###\s+[^\#\n]+/gm) || [];

  if (h1Matches.length === 1 || title) {
    headingScore += 3;
  } else if (h1Matches.length > 1) {
    headingFeedback.push(`Có ${h1Matches.length} thẻ H1. Google yêu cầu chỉ có duy nhất 1 thẻ H1.`);
  }

  if (h2Matches.length >= 4 && h2Matches.length <= 9) {
    headingScore += 4;
  } else if (h2Matches.length > 0) {
    headingScore += 2;
    headingFeedback.push(`Hiện có ${h2Matches.length} thẻ H2. Để bao phủ trọn vẹn chủ đề (Topical Depth), nên có từ 4 - 8 thẻ H2.`);
  } else {
    headingFeedback.push('Thiếu các thẻ H2 để phân mục nội dung.');
  }

  // Kiểm tra từ khóa trong ít nhất 1 thẻ H2
  const hasKeywordInH2 = h2Matches.some(h2 => keywordLower && h2.toLowerCase().includes(keywordLower));
  if (hasKeywordInH2) {
    headingScore += 3;
  } else {
    headingFeedback.push('Nên lồng ghép từ khóa chính hoặc từ khóa phụ liên quan vào ít nhất 1-2 tiêu đề H2.');
  }
  criteria.push({
    name: '3. Phân cấp đề mục (Heading Hierarchy)',
    score: headingScore,
    maxScore: 10,
    status: headingScore >= 8 ? 'pass' : (headingScore >= 5 ? 'warning' : 'fail'),
    feedback: headingFeedback.length ? headingFeedback.join(' ') : `Cấu trúc đề mục xuất sắc: 1 H1, ${h2Matches.length} H2, ${h3Matches.length} H3.`
  });
  totalScore += headingScore;

  // 4. Dung lượng bài viết (Word Count) - Trọng số 12 điểm
  let lengthScore = 0;
  const lengthFeedback = [];
  const words = content.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount >= 1800) {
    lengthScore = 12;
  } else if (wordCount >= 1200) {
    lengthScore = 8;
    lengthFeedback.push(`Bài viết hiện có ${wordCount} từ. Để cạnh tranh Top 3 với các sàn lớn, nên nâng lên 1.800 - 2.500 từ.`);
  } else if (wordCount >= 600) {
    lengthScore = 4;
    lengthFeedback.push(`Bài viết hơi ngắn (${wordCount} từ), dễ bị Google xếp vào diện nội dung mỏng (Thin Content).`);
  } else {
    lengthFeedback.push(`Nội dung quá ngắn (${wordCount} từ). Cần tối thiểu 1.500 từ.`);
  }
  criteria.push({
    name: '4. Độ dài bài viết & Chiều sâu nội dung',
    score: lengthScore,
    maxScore: 12,
    status: lengthScore >= 10 ? 'pass' : (lengthScore >= 6 ? 'warning' : 'fail'),
    feedback: lengthFeedback.length ? lengthFeedback.join(' ') : `Độ dài lý tưởng: ${wordCount} từ, đầy đủ chiều sâu để vượt đối thủ.`
  });
  totalScore += lengthScore;

  // 5. Mật độ từ khóa (Keyword Density) - Trọng số 8 điểm
  let densityScore = 0;
  const densityFeedback = [];
  let keywordCount = 0;
  let density = 0;

  if (keywordLower && wordCount > 0) {
    const escapedKw = keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedKw, 'gi');
    const matches = content.match(regex);
    keywordCount = matches ? matches.length : 0;
    density = Number(((keywordCount * keywordLower.split(' ').length / wordCount) * 100).toFixed(2));

    if (density >= 0.8 && density <= 2.2) {
      densityScore = 8;
    } else if (density > 2.2) {
      densityScore = 4;
      densityFeedback.push(`Mật độ từ khóa hơi cao (${density}% - ${keywordCount} lần). Cảnh báo nhồi nhét từ khóa (Keyword Stuffing), nên giảm bớt.`);
    } else if (density > 0) {
      densityScore = 5;
      densityFeedback.push(`Mật độ từ khóa hơi thấp (${density}% - ${keywordCount} lần). Nên lặp lại tự nhiên từ 5 - 10 lần.`);
    } else {
      densityFeedback.push(`Không tìm thấy từ khóa "${targetKeyword}" trong nội dung bài viết.`);
    }
  } else {
    densityScore = 4;
  }
  criteria.push({
    name: '5. Mật độ từ khóa (Keyword Density)',
    score: densityScore,
    maxScore: 8,
    status: densityScore >= 7 ? 'pass' : (densityScore >= 4 ? 'warning' : 'fail'),
    feedback: densityFeedback.length ? densityFeedback.join(' ') : `Mật độ hoàn hảo: ${density}% (${keywordCount} lần xuất hiện).`
  });
  totalScore += densityScore;

  // 6. Hộp Tóm Tắt Nhanh (Featured Snippet / Key Takeaways) - Trọng số 8 điểm
  const hasSummaryBox = /(?:tóm tắt nhanh|điểm mấu chốt|key takeaways|lưu ý quan trọng|thông tin cốt lõi)/i.test(content) ||
    content.includes('> [!NOTE]') || content.includes('> [!IMPORTANT]') || content.includes('> **Tóm tắt');
  const summaryScore = hasSummaryBox ? 8 : 2;
  criteria.push({
    name: '6. Đoạn tóm tắt nhanh (Featured Snippet Catch)',
    score: summaryScore,
    maxScore: 8,
    status: summaryScore >= 7 ? 'pass' : 'warning',
    feedback: hasSummaryBox ? 'Có hộp tóm tắt nhanh, rất dễ ăn Top 0 Featured Snippet & AI Overviews.' : 'Nên thêm 1 khung tóm tắt 3-4 dòng ngay dưới mở bài để Google dễ trích xuất Top 0.'
  });
  totalScore += summaryScore;

  // 7. Bảng so sánh hoặc Bảng giá (Comparison / Price Table) - Trọng số 8 điểm
  const hasTable = /\|[\s\-\:]+\|/g.test(content) || /<table/i.test(content);
  const tableScore = hasTable ? 8 : 2;
  criteria.push({
    name: '7. Bảng dữ liệu / So sánh (Data Table)',
    score: tableScore,
    maxScore: 8,
    status: tableScore >= 7 ? 'pass' : 'warning',
    feedback: hasTable ? 'Có bảng biểu chi tiết, người dùng giữ chân lâu và Google đánh giá cao độ hữu ích.' : 'Nên bổ sung bảng so sánh giá hoặc bảng tiêu chí để trực quan hoá số liệu.'
  });
  totalScore += tableScore;

  // 8. Danh sách Checklist / Quy trình hành động - Trọng số 6 điểm
  const hasChecklist = /(?:checklist|danh sách kiểm tra|các bước|quy trình|bước 1|bước 2)/i.test(content) &&
    (/^[0-9]+\.\s+/m.test(content) || /^[\*\-]\s+\[[\sx]\]/m.test(content));
  const checklistScore = hasChecklist ? 6 : 2;
  criteria.push({
    name: '8. Quy trình thực tế & Checklist kiểm tra',
    score: checklistScore,
    maxScore: 6,
    status: checklistScore >= 5 ? 'pass' : 'warning',
    feedback: hasChecklist ? 'Có quy trình từng bước rõ ràng, tính hành động (Actionable) cao.' : 'Nên thêm các bước cụ thể (Bước 1, Bước 2...) hoặc checklist để độc giả dễ làm theo.'
  });
  totalScore += checklistScore;

  // 9. Mục Câu Hỏi Thường Gặp (FAQ Section) - Trọng số 8 điểm
  const hasFaq = /(?:##\s+.*(?:hỏi|faq|thắc mắc|câu hỏi).*)/i.test(content);
  const faqScore = hasFaq ? 8 : 1;
  criteria.push({
    name: '9. Khối câu hỏi thường gặp (FAQ Section)',
    score: faqScore,
    maxScore: 8,
    status: faqScore >= 7 ? 'pass' : 'warning',
    feedback: hasFaq ? 'Có khối FAQ giải đáp thắc mắc người dùng, sẵn sàng gắn FAQ Schema.' : 'Thiếu khối FAQ (Câu hỏi thường gặp). Khối này giúp kích hoạt Rich Results chiếm 30% diện tích trang 1 Google.'
  });
  totalScore += faqScore;

  // 10. Liên kết nội bộ (Internal Links) - Trọng số 8 điểm
  const internalLinkMatches = content.match(/\[([^\]]+)\]\((?:\/|https?:\/\/thuexenhanh\.com)[^\)]*\)/g) || [];
  const linkCount = internalLinkMatches.length;
  let linkScore = 0;
  if (linkCount >= 3) linkScore = 8;
  else if (linkCount >= 1) linkScore = 4;
  else linkScore = 0;
  criteria.push({
    name: '10. Liên kết nội bộ (Internal Links)',
    score: linkScore,
    maxScore: 8,
    status: linkScore >= 7 ? 'pass' : (linkScore >= 4 ? 'warning' : 'fail'),
    feedback: linkCount >= 3 ? `Đã gắn ${linkCount} internal links trỏ về hệ sinh thái Thuexenhanh.` : `Mới có ${linkCount} internal link. Cần ít nhất 3 - 5 link trỏ về các trang xe /thue-xe, mẫu hợp đồng, cứu hộ.`
  });
  totalScore += linkScore;

  // 11. Kiểm tra Giọng Văn Con Người (Anti-AI Slop Score) - Trọng số 12 điểm
  const slopCheck = checkAiSlop(content);
  let humanScore = Math.round((slopCheck.score / 100) * 12);
  criteria.push({
    name: '11. Giọng văn thực chiến (Anti-AI Score)',
    score: humanScore,
    maxScore: 12,
    status: humanScore >= 10 ? 'pass' : (humanScore >= 6 ? 'warning' : 'fail'),
    feedback: slopCheck.isSlopFree
      ? 'Tuyệt vời! Không phát hiện các cụm từ AI sáo rỗng. Văn phong đậm chất thực chiến, tự nhiên.'
      : `Phát hiện ${slopCheck.matches.length} cụm từ sáo rỗng thường thấy của AI: [${slopCheck.matches.slice(0, 4).join(', ')}...]. Cần thay bằng cách diễn đạt tự nhiên.`
  });
  totalScore += humanScore;

  // 12. Kêu gọi hành động (Call To Action - CTA) - Trọng số 4 điểm
  const hasCta = /(?:xem số điện thoại|gọi trực tiếp|liên hệ chủ xe|thuê xe nhanh|đăng tin miễn phí|thuexenhanh)/i.test(content);
  const ctaScore = hasCta ? 4 : 1;
  criteria.push({
    name: '12. Chuyển đổi người dùng (Call to Action)',
    score: ctaScore,
    maxScore: 4,
    status: ctaScore >= 3 ? 'pass' : 'warning',
    feedback: hasCta ? 'Có nút bấm / lời kêu gọi hành động rõ ràng điều hướng khách vào app.' : 'Thiếu lời kêu gọi người đọc hành động (tìm xe, liên hệ chủ xe).'
  });
  totalScore += ctaScore;

  // Đánh giá cấp độ Top 3
  let rankReadiness = 'Chưa sẵn sàng';
  let rankBadge = 'red';
  if (totalScore >= 90) {
    rankReadiness = 'Xuất sắc — Đạt tiêu chuẩn Top 1 - 3 Google trong 90 ngày';
    rankBadge = 'green';
  } else if (totalScore >= 75) {
    rankReadiness = 'Tốt — Cơ hội cao vào Top 5, chỉnh sửa thêm vài điểm để vào Top 3';
    rankBadge = 'blue';
  } else if (totalScore >= 60) {
    rankReadiness = 'Trung bình — Có thể vào Trang 1 nhưng khó giữ vững Top 3';
    rankBadge = 'yellow';
  }

  return {
    totalScore,
    rankReadiness,
    rankBadge,
    criteria,
    wordCount,
    keywordCount,
    density,
    slopMatches: slopCheck.matches
  };
}
