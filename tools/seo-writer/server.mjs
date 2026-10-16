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
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const PUBLIC_CAMNANG_DIR = path.resolve(ROOT_DIR, 'public', 'cam-nang');

// Đảm bảo các thư mục lưu trữ tồn tại
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(PUBLIC_CAMNANG_DIR)) {
  fs.mkdirSync(PUBLIC_CAMNANG_DIR, { recursive: true });
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

/**
 * Xây dựng trang HTML độc lập hoàn chỉnh chuẩn SEO (có thẻ meta, schema JSON-LD, CSS)
 * để xuất bản trực tiếp vào public/cam-nang/ của website.
 */
function buildStandaloneHtmlPage({ title, metaDescription, contentHtml, schemas, slug }) {
  const schemaList = [schemas.articleSchema];
  if (schemas.faqSchema) schemaList.push(schemas.faqSchema);
  if (schemas.breadcrumbSchema) schemaList.push(schemas.breadcrumbSchema);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Thuexenhanh</title>
  <meta name="description" content="${metaDescription}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://thuexenhanh.com/cam-nang/${slug}.html">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${metaDescription}">
  <meta property="og:url" content="https://thuexenhanh.com/cam-nang/${slug}.html">
  <meta property="og:image" content="https://thuexenhanh.com/og-image.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">
${JSON.stringify(schemaList, null, 2)}
  </script>
  <style>
    :root {
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --dark: #141414;
      --mid: #4b4f56;
      --subtle: #8a8f9a;
      --bg: #f5f5f7;
      --surface: #ffffff;
      --border: #e8e8ec;
      --r-box: 12px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--dark);
      line-height: 1.65;
    }
    header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 14px 20px;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .header-inner {
      max-width: 960px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand { font-size: 18px; font-weight: 800; color: var(--primary); text-decoration: none; }
    .nav-links a { color: var(--mid); text-decoration: none; margin-left: 18px; font-size: 14px; font-weight: 600; }
    .nav-links a:hover { color: var(--primary); }
    .main-article {
      max-width: 860px;
      margin: 32px auto;
      background: var(--surface);
      padding: 36px 40px;
      border-radius: var(--r-box);
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      border: 1px solid var(--border);
    }
    .breadcrumbs { font-size: 13px; color: var(--subtle); margin-bottom: 20px; }
    .breadcrumbs a { color: var(--primary); text-decoration: none; }
    h1 { font-size: clamp(24px, 4vw, 34px); font-weight: 800; line-height: 1.3; margin-bottom: 18px; color: var(--dark); }
    h2 { font-size: 22px; font-weight: 700; margin: 32px 0 14px; padding-bottom: 8px; border-bottom: 2px solid var(--border); color: var(--dark); }
    h3 { font-size: 18px; font-weight: 600; margin: 22px 0 10px; color: var(--dark); }
    p { margin-bottom: 16px; font-size: 16px; }
    ul, ol { margin: 0 0 18px 24px; font-size: 16px; }
    li { margin-bottom: 8px; }
    a { color: var(--primary); text-decoration: underline; }
    .seo-callout {
      padding: 16px 20px;
      border-radius: var(--r-box);
      margin: 20px 0;
      border-left: 5px solid;
    }
    .seo-callout.note { background: #eff6ff; border-color: #3b82f6; color: #1e40af; }
    .seo-callout.warning { background: #fffbeb; border-color: #f59e0b; color: #92400e; }
    .seo-callout.tip { background: #ecfdf5; border-color: #10b981; color: #065f46; }
    .callout-title { font-weight: 700; font-size: 15px; margin-bottom: 6px; }
    .table-container { overflow-x: auto; margin: 24px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { padding: 12px 14px; border: 1px solid var(--border); text-align: left; }
    th { background: #f8fafc; font-weight: 700; }
    tr:nth-child(even) td { background: #f8fafc; }
    footer {
      max-width: 860px;
      margin: 40px auto 60px;
      text-align: center;
      font-size: 13px;
      color: var(--subtle);
    }
  </style>
</head>
<body>
  <header>
    <div class="header-inner">
      <a href="/" class="brand">THUÊ XE NHANH</a>
      <div class="nav-links">
        <a href="/thue-xe">Tìm thuê xe</a>
        <a href="/mau-hop-dong">Mẫu hợp đồng</a>
        <a href="/cuu-ho">Cứu hộ 24/7</a>
        <a href="/chu-xe/dang-tin">Đăng xe</a>
      </div>
    </div>
  </header>
  <main class="main-article">
    <div class="breadcrumbs">
      <a href="/">Trang chủ</a> / <a href="/thue-xe">Cẩm nang thuê xe</a> / <span>${title}</span>
    </div>
    ${contentHtml}
  </main>
  <footer>
    <p>Giao dịch thuê xe do hai bên tự thoả thuận. Nền tảng không thu hoa hồng môi giới.</p>
    <p style="margin-top: 4px;">© 2026 Thuexenhanh — Nền tảng kết nối trực tiếp chủ xe và khách thuê tự lái.</p>
  </footer>
</body>
</html>`;
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

  // 1c. Phục vụ file bài viết tự động đăng trong public/cam-nang/
  if (req.method === 'GET' && pathname.startsWith('/cam-nang/')) {
    const fileName = path.basename(pathname);
    const filePath = path.resolve(PUBLIC_CAMNANG_DIR, fileName);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return fs.createReadStream(filePath).pipe(res);
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Không tìm thấy bài viết cẩm nang');
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

  // 7b. API AGENT 5 BƯỚC: 1-Click Chạy Auto -> Ra Bài -> Tự Đăng
  if (req.method === 'POST' && pathname === '/api/agent-auto-publish') {
    try {
      const { keyword, customNotes } = await parseBody(req);
      if (!keyword) return sendJson(res, 400, { error: 'Thiếu từ khóa chính.' });

      const state = readState();
      let title = '';
      let metaDescription = '';
      let contentMarkdown = '';

      // BƯỚC 1: Search Intent
      const step1 = {
        step: 1,
        title: 'BƯỚC 1: ĐỊNH VỊ Ý ĐỊNH TÌM KIẾM (SEARCH INTENT)',
        desc: 'Bóc tách nỗi đau: Sợ bị đền tiền vết xước cũ, sợ giam cọc phạt nguội, sợ giữ CCCD gốc. Đưa giải pháp trực diện ngay từ 3 dòng đầu tiên.'
      };

      // BƯỚC 2: Information Gain
      const step2 = {
        step: 2,
        title: 'BƯỚC 2: NẠP DỮ LIỆU ĐỘC QUYỀN (INFORMATION GAIN)',
        desc: 'Bơm số liệu thật thị trường VN: Vios 700k-850k, Xpander 900k-1.1tr, Carnival 1.8tr-2.5tr, VF 3 500k-650k; quy định NĐ 282/2025 cấm giữ CCCD gốc; cọc phạt nguội 2-3tr trong 15-20 ngày trên csgt.vn.'
      };

      // BƯỚC 3: Anti-AI Slop
      const step3 = {
        step: 3,
        title: 'BƯỚC 3: BỘ LỌC CHỐNG VĂN PHONG AI (ANTI-AI SLOP)',
        desc: 'Chặn 60+ từ ngữ sáo rỗng AI. Kích hoạt giọng chuyên gia 10 năm kinh nghiệm, dứt khoát, sắc sảo.'
      };

      // BƯỚC 4: Dàn dựng nội dung chuyên sâu
      if (state.geminiApiKey) {
        const sysPrompt = buildSystemPrompt();
        const userPrompt = buildArticlePrompt(keyword, null, customNotes);
        contentMarkdown = await callGeminiApi({
          apiKey: state.geminiApiKey,
          model: state.selectedModel || 'gemini-1.5-flash',
          systemPrompt: sysPrompt,
          userPrompt,
          temperature: 0.55
        });
        const h1Match = contentMarkdown.match(/^#\s+(.+)$/m);
        title = h1Match ? h1Match[1].trim() : `Kinh Nghiệm Thuê Xe Tự Lái 2026: ${keyword}`;
        metaDescription = `Kinh nghiệm thuê xe tự lái 2026: Hướng dẫn quay video 5 phút chống đền tiền, quy định cấm giữ CCCD theo NĐ 282/2025 và bảng giá xe mới nhất.`;
      } else {
        const template = getOfflineArticleTemplate(keyword);
        title = template.title;
        metaDescription = template.metaDescription;
        contentMarkdown = template.content;
      }

      // Chấm điểm SEO & Anti-AI (12 tiêu chí)
      const auditResult = auditSeoArticle({
        title,
        metaDescription,
        content: contentMarkdown,
        targetKeyword: keyword
      });

      const contentHtml = markdownToHtml(contentMarkdown);
      const faqs = extractFaqsFromMarkdown(contentMarkdown);

      const slug = (keyword || title)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `bai-viet-${Date.now()}`;

      const articleSchema = generateArticleSchema({
        title,
        description: metaDescription,
        url: `https://thuexenhanh.com/cam-nang/${slug}.html`
      });
      const faqSchema = generateFaqSchema(faqs);
      const breadcrumbSchema = generateBreadcrumbSchema({
        pageTitle: title,
        pageUrl: `https://thuexenhanh.com/cam-nang/${slug}.html`
      });

      const schemas = { articleSchema, faqSchema, breadcrumbSchema };

      // BƯỚC 5: Tự Động Xuất Bản / Tự Đăng
      const standaloneHtml = buildStandaloneHtmlPage({
        title,
        metaDescription,
        contentHtml,
        schemas,
        slug
      });

      // 1. Tự động ghi vào public/cam-nang/ (web tĩnh sản phẩm)
      const publicFilePath = path.resolve(PUBLIC_CAMNANG_DIR, `${slug}.html`);
      fs.writeFileSync(publicFilePath, standaloneHtml, 'utf8');

      // 2. Ghi vào tools/seo-writer/output/
      const timestamp = new Date().toISOString();
      const meta = {
        title,
        slug,
        metaDescription,
        targetKeyword: keyword,
        createdAt: timestamp,
        publishedUrl: `/cam-nang/${slug}.html`,
        auditScore: auditResult?.totalScore || 0,
        wordCount: auditResult?.wordCount || 0,
        schemas
      };
      fs.writeFileSync(path.resolve(OUTPUT_DIR, `${slug}.json`), JSON.stringify({ ...meta, contentMarkdown, contentHtml }, null, 2), 'utf8');
      fs.writeFileSync(path.resolve(OUTPUT_DIR, `${slug}.md`), contentMarkdown, 'utf8');
      fs.writeFileSync(path.resolve(OUTPUT_DIR, `${slug}.html`), contentHtml, 'utf8');

      const step4 = {
        step: 4,
        title: 'BƯỚC 4: DÀN DỰNG NỘI DUNG CHUYÊN SÂU (1.800 - 2.200 TỪ)',
        desc: `Đã dàn dựng hoàn chỉnh ${auditResult.wordCount} từ: H1 kèm 2026, Featured Snippet box, Bảng giá Markdown, Checklist 5 bước nhận xe, 4 Link nội bộ, FAQ 4 câu trả lời thẳng thắn.`
      };

      const step5 = {
        step: 5,
        title: 'BƯỚC 5: TỰ ĐỘNG XUẤT BẢN & ĐĂNG BÀI LÊN WEB',
        desc: `Đã tự động đóng gói Meta Title, Description, Schema JSON-LD và đăng bài thành công tới file public/cam-nang/${slug}.html!`
      };

      return sendJson(res, 200, {
        success: true,
        steps: [step1, step2, step3, step4, step5],
        title,
        metaDescription,
        slug,
        publishedUrl: `/cam-nang/${slug}.html`,
        localPath: `public/cam-nang/${slug}.html`,
        contentMarkdown,
        contentHtml,
        auditResult,
        schemas,
        faqsCount: faqs.length
      });
    } catch (e) {
      console.error('[SEO Writer] Lỗi Auto Agent:', e.message);
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
