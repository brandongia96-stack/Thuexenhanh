/**
 * tools/seo-writer/server.mjs
 * 
 * MÁY CHỦ CÔNG CỤ VIẾT BÀI SEO CHUẨN TOP 3 GOOGLE
 * Chạy cục bộ tại http://127.0.0.1:4646
 * Không phụ thuộc thư viện ngoài — chạy thẳng bằng Node.js có sẵn.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { KEYWORD_CLUSTERS } from './engine/keywordsBank.js';
import { buildSystemPrompt, buildOutlinePrompt, buildArticlePrompt, getOfflineArticleTemplate } from './engine/seoPrompt.js';
import { auditSeoArticle } from './engine/seoAudit.js';
import { generateArticleSchema, generateFaqSchema, generateBreadcrumbSchema, extractFaqsFromMarkdown } from './engine/schemaGen.js';
import { RANKING_90_DAYS_PLAN } from './engine/rankingPlan.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.SEO_WRITER_PORT || 4646);
const STATE_FILE = path.resolve(__dirname, '.state.json');
const OUTPUT_DIR = path.resolve(__dirname, 'output');

// Đảm bảo thư mục lưu bài viết tồn tại
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Đọc trạng thái đã lưu (API Key, cấu hình)
function readState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[SEO Writer] Lỗi đọc .state.json:', e.message);
  }
  return {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    selectedModel: 'gemini-1.5-flash',
    savedCount: 0
  };
}

function saveState(patch) {
  try {
    const current = readState();
    const next = { ...current, ...patch };
    fs.writeFileSync(STATE_FILE, JSON.stringify(next, null, 2), 'utf8');
    return next;
  } catch (e) {
    console.error('[SEO Writer] Lỗi ghi .state.json:', e.message);
    return null;
  }
}

/**
 * Gọi API Google Gemini trực tiếp bằng fetch
 */
async function callGeminiApi({ apiKey, model = 'gemini-1.5-flash', systemPrompt, userPrompt, temperature = 0.6 }) {
  if (!apiKey) {
    throw new Error('Chưa cấu hình GEMINI_API_KEY.');
  }

  // Model name mapping
  const modelEndpoint = model.includes('/') ? model : `models/${model}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/${modelEndpoint}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\n---\n\n${userPrompt}` }]
      }
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: 8192,
      topP: 0.95
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API [${res.status}]: ${errText.slice(0, 300)}`);
  }

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini không trả về nội dung nào.');
  }
  return text.trim();
}

/**
 * Chuyển đổi Markdown cơ bản sang HTML để người dùng xem trước và nhúng
 */
function markdownToHtml(md) {
  if (!md) return '';
  let html = md
    // Xử lý Hộp ghi chú / Cảnh báo
    .replace(/^>\s*\[!NOTE\]\s*\n((?:>.*(?:\n|$))*)/gm, (match, p1) => {
      const clean = p1.replace(/^>\s?/gm, '').trim();
      return `<div class="seo-callout note"><div class="callout-title">💡 Tóm Tắt Nhanh (Key Takeaways)</div>${clean.replace(/\n/g, '<br/>')}</div>\n`;
    })
    .replace(/^>\s*\[!WARNING\]\s*\n((?:>.*(?:\n|$))*)/gm, (match, p1) => {
      const clean = p1.replace(/^>\s?/gm, '').trim();
      return `<div class="seo-callout warning"><div class="callout-title">⚠️ Cảnh Báo Quan Trọng</div>${clean.replace(/\n/g, '<br/>')}</div>\n`;
    })
    .replace(/^>\s*\[!TIP\]\s*\n((?:>.*(?:\n|$))*)/gm, (match, p1) => {
      const clean = p1.replace(/^>\s?/gm, '').trim();
      return `<div class="seo-callout tip"><div class="callout-title">💎 Lời Khuyên Thực Chiến</div>${clean.replace(/\n/g, '<br/>')}</div>\n`;
    })
    // Headings
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    // Bôi đậm, in nghiêng
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Horizonal rule
    .replace(/^---$/gim, '<hr/>');

  // Xử lý bảng Markdown
  html = html.replace(/((?:\|[^\n]+\|\r?\n)+)/g, (match) => {
    const lines = match.trim().split('\n');
    if (lines.length < 2) return match;
    const headerCols = lines[0].split('|').slice(1, -1).map(c => c.trim());
    const bodyLines = lines.slice(2); // bỏ qua dòng phân cách |---|---|

    let tableHtml = '<div class="table-container"><table><thead><tr>';
    headerCols.forEach(col => {
      tableHtml += `<th>${col}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';

    bodyLines.forEach(line => {
      const cols = line.split('|').slice(1, -1).map(c => c.trim());
      if (cols.length === headerCols.length) {
        tableHtml += '<tr>';
        cols.forEach(col => {
          tableHtml += `<td>${col}</td>`;
        });
        tableHtml += '</tr>';
      }
    });

    tableHtml += '</tbody></table></div>';
    return tableHtml;
  });

  // Paragraphs
  const paragraphs = html.split(/\n\s*\n/);
  html = paragraphs.map(p => {
    p = p.trim();
    if (p.startsWith('<h') || p.startsWith('<div') || p.startsWith('<hr') || p.startsWith('<table') || p.startsWith('<ul>') || p.startsWith('<ol>')) {
      return p;
    }
    if (p.startsWith('- ') || p.startsWith('* ')) {
      const items = p.split(/\n[\-\*]\s+/).map(it => it.replace(/^[\-\*]\s+/, '').trim()).filter(Boolean);
      return `<ul>${items.map(it => `<li>${it}</li>`).join('')}</ul>`;
    }
    if (p.match(/^[0-9]+\.\s+/)) {
      const items = p.split(/\n[0-9]+\.\s+/).map(it => it.replace(/^[0-9]+\.\s+/, '').trim()).filter(Boolean);
      return `<ol>${items.map(it => `<li>${it}</li>`).join('')}</ol>`;
    }
    return p ? `<p>${p.replace(/\n/g, '<br/>')}</p>` : '';
  }).join('\n\n');

  return html;
}

// Trợ giúp parse JSON từ HTTP request
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Dữ liệu JSON không hợp lệ: ' + err.message));
      }
    });
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

// Khởi tạo HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const pathname = parsedUrl.pathname;

  // 1. Phục vụ giao diện người dùng
  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    const htmlPath = path.resolve(__dirname, 'index.html');
    if (fs.existsSync(htmlPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return fs.createReadStream(htmlPath).pipe(res);
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Không tìm thấy index.html');
  }

  // 1b. Phục vụ file bài viết xuất bản trong output/
  if (req.method === 'GET' && pathname.startsWith('/output/')) {
    const fileName = path.basename(pathname);
    const filePath = path.resolve(OUTPUT_DIR, fileName);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(fileName).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.md': 'text/markdown; charset=utf-8',
        '.json': 'application/json; charset=utf-8'
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain; charset=utf-8' });
      return fs.createReadStream(filePath).pipe(res);
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Không tìm thấy file bài viết');
  }

  // 2. API Trạng thái hệ thống
  if (req.method === 'GET' && pathname === '/api/status') {
    const state = readState();
    return sendJson(res, 200, {
      status: 'ok',
      hasApiKey: Boolean(state.geminiApiKey),
      selectedModel: state.selectedModel || 'gemini-1.5-flash',
      savedCount: fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.json')).length,
      port: PORT
    });
  }

  // 3. API Lưu API Key
  if (req.method === 'POST' && pathname === '/api/save-key') {
    try {
      const { apiKey, model } = await parseBody(req);
      const state = saveState({
        geminiApiKey: (apiKey || '').trim(),
        selectedModel: model || 'gemini-1.5-flash'
      });
      return sendJson(res, 200, {
        success: true,
        hasApiKey: Boolean(state.geminiApiKey),
        model: state.selectedModel
      });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // 4. API Lấy Kho Từ Khóa Chuẩn Top 3
  if (req.method === 'GET' && pathname === '/api/keywords') {
    return sendJson(res, 200, { clusters: KEYWORD_CLUSTERS });
  }

  // 5. API Lấy Lộ Trình 90 Ngày Lên Top 3
  if (req.method === 'GET' && pathname === '/api/ranking-plan') {
    return sendJson(res, 200, RANKING_90_DAYS_PLAN);
  }

  // 6. API Sinh Dàn Ý (Outline)
  if (req.method === 'POST' && pathname === '/api/generate-outline') {
    try {
      const { keyword, intent, audience } = await parseBody(req);
      if (!keyword) return sendJson(res, 400, { error: 'Thiếu từ khóa chính.' });

      const state = readState();
      let outline;

      if (state.geminiApiKey) {
        const sysPrompt = buildSystemPrompt();
        const userPrompt = buildOutlinePrompt(keyword, intent, audience);
        const rawRes = await callGeminiApi({
          apiKey: state.geminiApiKey,
          model: state.selectedModel || 'gemini-1.5-flash',
          systemPrompt: sysPrompt,
          userPrompt,
          temperature: 0.4
        });

        // Bóc tách JSON an toàn
        const jsonMatch = rawRes.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          outline = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Gemini không trả về đúng định dạng JSON.');
        }
      } else {
        // Fallback tự động khi chưa có API Key
        const fallback = getOfflineArticleTemplate(keyword);
        outline = {
          title: fallback.title,
          metaDescription: fallback.metaDescription,
          searchIntent: intent || 'Thực chiến / Giải pháp',
          targetWordCount: '2.000 - 2.400 từ',
          primaryKeyword: keyword,
          secondaryKeywords: ['thuê xe tự lái an toàn', 'bảng giá thuê xe 2026', 'thủ tục thuê xe', 'hợp đồng thuê xe'],
          informationGainHook: 'Kinh nghiệm kiểm tra 6 điểm mù của xe và quy định cấm giữ CCCD theo NĐ 282/2025',
          headings: [
            { level: 'H2', title: '1. Thủ Tục Thuê Xe Tự Lái Chuẩn Quy Định Mới', keyPoints: ['Giấy tờ cần thiết', 'Cấm giữ CCCD gốc', 'Tài sản thế chấp'] },
            { level: 'H2', title: '2. Bảng Giá Thuê Xe Tự Lái Thị Trường 2026', keyPoints: ['Giá phân khúc 4 chỗ', 'Giá phân khúc 7 chỗ', 'Phụ phí km và lưu đêm'] },
            { level: 'H2', title: '3. Checklist 5 Bước Nhận Xe Chống Đền Tiền Oan', keyPoints: ['Quay video 360 độ', 'Kiểm tra lốp và kính', 'Biên bản bàn giao'] },
            { level: 'H2', title: '4. Xử Lý Phạt Nguội & Hoàn Tiền Cọc Minh Bạch', keyPoints: ['Thời gian giữ cọc', 'Tra cứu csgt.vn', 'Hoàn cọc 100%'] },
            { level: 'H2', title: '5. Câu Hỏi Thường Gặp (FAQ)', keyPoints: ['Giải đáp các khúc mắc phổ biến'] }
          ],
          faqQuestions: [
            'Thuê xe tự lái có được giữ CCCD gốc không?',
            'Có giới hạn số km chạy mỗi ngày không?',
            'Nếu không may xe bị va quẹt thì bảo hiểm đền bù ra sao?'
          ]
        };
      }

      return sendJson(res, 200, { success: true, outline });
    } catch (e) {
      console.error('[SEO Writer] Lỗi sinh dàn ý:', e.message);
      return sendJson(res, 500, { error: e.message });
    }
  }

  // 7. API Sinh Bài Viết Hoàn Chỉnh (Full Article)
  if (req.method === 'POST' && pathname === '/api/generate-article') {
    try {
      const { keyword, outline, customNotes } = await parseBody(req);
      if (!keyword) return sendJson(res, 400, { error: 'Thiếu từ khóa chính.' });

      const state = readState();
      let title = '';
      let metaDescription = '';
      let contentMarkdown = '';

      if (state.geminiApiKey) {
        const sysPrompt = buildSystemPrompt();
        const userPrompt = buildArticlePrompt(keyword, outline, customNotes);
        contentMarkdown = await callGeminiApi({
          apiKey: state.geminiApiKey,
          model: state.selectedModel || 'gemini-1.5-flash',
          systemPrompt: sysPrompt,
          userPrompt,
          temperature: 0.55
        });

        // Tách H1 ra làm title nếu có
        const h1Match = contentMarkdown.match(/^#\s+(.+)$/m);
        title = h1Match ? h1Match[1].trim() : (outline?.title || `Kinh Nghiệm Thuê Xe Tự Lái: ${keyword}`);
        metaDescription = outline?.metaDescription || `${title}. Hướng dẫn thực tế từ chuyên gia xe tự lái, thủ tục, bảng giá và mẹo tránh đền tiền oan mới nhất 2026.`;
      } else {
        // Chế độ Offline Template chất lượng cao
        const template = getOfflineArticleTemplate(keyword);
        title = template.title;
        metaDescription = template.metaDescription;
        contentMarkdown = template.content;
      }

      // 1. Chấm điểm SEO & Anti-AI (12 tiêu chí)
      const auditResult = auditSeoArticle({
        title,
        metaDescription,
        content: contentMarkdown,
        targetKeyword: keyword
      });

      // 2. Chuyển Markdown sang HTML
      const contentHtml = markdownToHtml(contentMarkdown);

      // 3. Trích xuất FAQ & Sinh Schema JSON-LD
      const faqs = extractFaqsFromMarkdown(contentMarkdown);
      const articleSchema = generateArticleSchema({
        title,
        description: metaDescription,
        url: `https://thuexenhanh.com/kinh-nghiem/${encodeURIComponent(keyword.replace(/\s+/g, '-'))}`
      });
      const faqSchema = generateFaqSchema(faqs);
      const breadcrumbSchema = generateBreadcrumbSchema({
        pageTitle: title,
        pageUrl: `https://thuexenhanh.com/kinh-nghiem/${encodeURIComponent(keyword.replace(/\s+/g, '-'))}`
      });

      return sendJson(res, 200, {
        success: true,
        title,
        metaDescription,
        contentMarkdown,
        contentHtml,
        auditResult,
        schemas: {
          articleSchema,
          faqSchema,
          breadcrumbSchema
        },
        faqsCount: faqs.length
      });
    } catch (e) {
      console.error('[SEO Writer] Lỗi sinh bài viết:', e.message);
      return sendJson(res, 500, { error: e.message });
    }
  }

  // 8. API Soi & Chấm Điểm SEO bài viết bất kỳ
  if (req.method === 'POST' && pathname === '/api/audit-seo') {
    try {
      const { title, metaDescription, content, targetKeyword } = await parseBody(req);
      const auditResult = auditSeoArticle({
        title,
        metaDescription,
        content,
        targetKeyword
      });
      return sendJson(res, 200, { success: true, auditResult });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // 9. API Lưu bài viết vào đĩa (Export)
  if (req.method === 'POST' && pathname === '/api/save-article') {
    try {
      const { title, metaDescription, targetKeyword, contentMarkdown, contentHtml, schemas, auditResult } = await parseBody(req);
      
      const slug = (targetKeyword || title)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `bai-viet-${Date.now()}`;

      const timestamp = new Date().toISOString();
      const meta = {
        title,
        slug,
        metaDescription,
        targetKeyword,
        createdAt: timestamp,
        auditScore: auditResult?.totalScore || 0,
        wordCount: auditResult?.wordCount || 0,
        schemas
      };

      // Ghi file JSON, Markdown và HTML
      fs.writeFileSync(path.resolve(OUTPUT_DIR, `${slug}.json`), JSON.stringify({ ...meta, contentMarkdown, contentHtml }, null, 2), 'utf8');
      fs.writeFileSync(path.resolve(OUTPUT_DIR, `${slug}.md`), contentMarkdown, 'utf8');
      fs.writeFileSync(path.resolve(OUTPUT_DIR, `${slug}.html`), contentHtml, 'utf8');

      return sendJson(res, 200, {
        success: true,
        slug,
        savedPath: `tools/seo-writer/output/${slug}.md`,
        createdAt: timestamp
      });
    } catch (e) {
      return sendJson(res, 500, { error: e.message });
    }
  }

  // 10. API Danh sách bài viết đã lưu
  if (req.method === 'GET' && pathname === '/api/saved-articles') {
    try {
      const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.json'));
      const list = files.map(file => {
        try {
          const raw = fs.readFileSync(path.resolve(OUTPUT_DIR, file), 'utf8');
          const data = JSON.parse(raw);
          return {
            slug: data.slug,
            title: data.title,
            targetKeyword: data.targetKeyword,
            auditScore: data.auditScore,
            wordCount: data.wordCount,
            createdAt: data.createdAt
          };
        } catch {
          return null;
        }
      }).filter(Boolean);

      return sendJson(res, 200, { articles: list });
    } catch (e) {
      return sendJson(res, 500, { error: e.message });
    }
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint không tồn tại' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 [SEO Writer] Tool Viết Bài SEO Chuẩn Top 3 Google`);
  console.log(`   Địa chỉ: http://127.0.0.1:${PORT}`);
  console.log(`   Thư mục xuất bài: ${OUTPUT_DIR}`);
  console.log(`======================================================\n`);
});
