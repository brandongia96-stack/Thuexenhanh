/**
 * tools/seo-writer/engine/schemaGen.js
 * 
 * BỘ TẠO DỮ LIỆU CẤU TRÚC (STRUCTURED DATA JSON-LD) CHUẨN GOOGLE
 * Tối ưu hóa để bài viết đạt Rich Snippets (Đoạn trích giàu thông tin),
 * câu hỏi thường gặp FAQ trên Google Search và kết quả AI Overviews.
 */

export function generateArticleSchema({
  title,
  description,
  url,
  datePublished,
  dateModified,
  authorName = 'Ban Biên Tập Thuexenhanh',
  imageUrl = 'https://thuexenhanh.com/og-image.jpg',
  siteUrl = 'https://thuexenhanh.com'
}) {
  const pubDate = datePublished || new Date().toISOString();
  const modDate = dateModified || pubDate;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': title,
    'description': description,
    'image': [imageUrl],
    'datePublished': pubDate,
    'dateModified': modDate,
    'author': [{
      '@type': 'Person',
      'name': authorName,
      'jobTitle': 'Chuyên gia khảo sát & vận hành thuê xe tự lái',
      'url': `${siteUrl}/gioi-thieu`
    }],
    'publisher': {
      '@type': 'Organization',
      'name': 'Thuê Xe Nhanh',
      'logo': {
        '@type': 'ImageObject',
        'url': `${siteUrl}/logo.png`
      }
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': url || `${siteUrl}/`
    }
  };
}

export function generateFaqSchema(faqs = []) {
  if (!faqs || faqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer
      }
    }))
  };
}

export function generateBreadcrumbSchema({
  siteUrl = 'https://thuexenhanh.com',
  categoryName = 'Kinh nghiệm thuê xe',
  categoryUrl = 'https://thuexenhanh.com/thue-xe',
  pageTitle,
  pageUrl
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Trang chủ',
        'item': siteUrl
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': categoryName,
        'item': categoryUrl
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': pageTitle,
        'item': pageUrl
      }
    ]
  };
}

/**
 * Trích xuất các câu hỏi và câu trả lời FAQ từ văn bản Markdown
 */
export function extractFaqsFromMarkdown(content) {
  if (!content) return [];
  const faqs = [];

  // Tìm kiếm khối FAQ hoặc các câu hỏi dạng H3 / Bôi đậm
  // Thường có dạng: ### Câu hỏi ... hoặc **1. Câu hỏi?**
  const lines = content.split('\n');
  let currentQ = null;
  let currentA = [];

  let inFaqSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Phát hiện bắt đầu phần FAQ
    if (line.match(/^##\s+(.*(?:hỏi|faq|thắc mắc|câu hỏi).*)/i)) {
      inFaqSection = true;
      continue;
    }

    // Nếu gặp H2 khác hoặc dấu gạch ngang phân cách thì kết thúc phần FAQ
    if (inFaqSection && (line.match(/^##\s+[^\#]/) || line === '---')) {
      if (currentQ && currentA.length > 0) {
        faqs.push({ question: currentQ, answer: currentA.join(' ').replace(/\s*---\s*$/, '').trim() });
        currentQ = null;
        currentA = [];
      }
      break;
    }

    if (inFaqSection) {
      // Câu hỏi dạng ### Câu hỏi? hoặc **Câu hỏi?**
      const h3Match = line.match(/^###\s+(.*)/);
      const boldMatch = line.match(/^\*\*(?:[0-9]+\.\s*)?([^\*]+\?)\*\*/);

      if (h3Match || boldMatch) {
        if (currentQ && currentA.length > 0) {
          faqs.push({ question: currentQ, answer: currentA.join(' ').replace(/\s*---\s*$/, '').trim() });
          currentA = [];
        }
        currentQ = (h3Match ? h3Match[1] : boldMatch[1]).replace(/\*\*/g, '').trim();
      } else if (currentQ && line.length > 0 && !line.startsWith('#') && line !== '---') {
        currentA.push(line.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')); // Bỏ link markdown để text sạch
      }
    }
  }

  if (currentQ && currentA.length > 0) {
    faqs.push({ question: currentQ, answer: currentA.join(' ').replace(/\s*---\s*$/, '').trim() });
  }

  return faqs;
}
