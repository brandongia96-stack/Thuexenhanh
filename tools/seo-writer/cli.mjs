/**
 * tools/seo-writer/cli.mjs
 * 
 * GIAO DIỆN DÒNG LỆNH (CLI) TỰ ĐỘNG HÓA VIẾT BÀI SEO
 * Sử dụng:
 *   node tools/seo-writer/cli.mjs --keyword "kinh nghiệm thuê xe tự lái"
 *   node tools/seo-writer/cli.mjs --list-keywords
 *   node tools/seo-writer/cli.mjs --audit ./tools/seo-writer/output/bai-viet.md
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { KEYWORD_CLUSTERS } from './engine/keywordsBank.js';
import { buildSystemPrompt, buildArticlePrompt, getOfflineArticleTemplate } from './engine/seoPrompt.js';
import { auditSeoArticle } from './engine/seoAudit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE = path.resolve(__dirname, '.state.json');
const OUTPUT_DIR = path.resolve(__dirname, 'output');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const args = process.argv.slice(2);

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

const hasFlag = (flag) => args.includes(flag);

async function main() {
  if (hasFlag('--help') || args.length === 0) {
    console.log(`
🚀 THUEXENHANH SEO TOP 3 CLI
------------------------------------------------------
Cú pháp:
  node tools/seo-writer/cli.mjs [lựa chọn]

Lựa chọn:
  --keyword <từ khóa>      Viết bài viết mới theo từ khóa
  --list-keywords           Liệt kê 40+ từ khóa vàng đã nghiên cứu
  --audit <đường dẫn file>  Chấm điểm 12 tiêu chí SEO bài viết có sẵn
  --save                    Tự động lưu file vào tools/seo-writer/output/
`);
    process.exit(0);
  }

  if (hasFlag('--list-keywords')) {
    console.log('\n🎯 KHO TỪ KHÓA VÀNG NGÀNH THUÊ XE TỰ LÁI:');
    KEYWORD_CLUSTERS.forEach(c => {
      console.log(`\n📌 ${c.name}:`);
      c.keywords.forEach(k => {
        console.log(`   - "${k.keyword}" [${k.difficulty}] -> Dự kiến Top 3: ${k.targetDays}`);
      });
    });
    process.exit(0);
  }

  const auditPath = getArg('--audit');
  if (auditPath) {
    if (!fs.existsSync(auditPath)) {
      console.error(`[Lỗi] Không tìm thấy file: ${auditPath}`);
      process.exit(1);
    }
    const content = fs.readFileSync(auditPath, 'utf8');
    const kw = getArg('--keyword') || '';
    const h1Match = content.match(/^#\s+(.+)$/m);
    const title = h1Match ? h1Match[1] : path.basename(auditPath);

    console.log(`\n🔍 Đang chấm điểm SEO cho file: ${auditPath}...`);
    const res = auditSeoArticle({
      title,
      content,
      targetKeyword: kw
    });

    console.log(`\n======================================================`);
    console.log(`📊 ĐIỂM SỐ SEO: ${res.totalScore} / 100 điểm`);
    console.log(`🏷️ Trạng thái: ${res.rankReadiness}`);
    console.log(`📝 Số từ: ${res.wordCount} từ | Mật độ từ khóa: ${res.density}%`);
    console.log(`======================================================`);
    res.criteria.forEach(c => {
      console.log(`[${c.score}/${c.maxScore}đ] ${c.name}: ${c.feedback}`);
    });
    process.exit(0);
  }

  const keyword = getArg('--keyword');
  if (keyword) {
    console.log(`\n🚀 Đang tạo bài viết chuẩn SEO Top 3 cho từ khóa: "${keyword}"...`);
    
    // Đọc state
    let apiKey = process.env.GEMINI_API_KEY || '';
    let model = 'gemini-1.5-flash';
    if (fs.existsSync(STATE_FILE)) {
      try {
        const s = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        if (s.geminiApiKey) apiKey = s.geminiApiKey;
        if (s.selectedModel) model = s.selectedModel;
      } catch {}
    }

    let title, metaDescription, contentMarkdown;

    if (apiKey) {
      console.log(`⚡ Kết nối Gemini API (${model})...`);
      const sys = buildSystemPrompt();
      const prompt = buildArticlePrompt(keyword);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${sys}\n\n---\n\n${prompt}` }] }]
        })
      });
      const j = await r.json();
      contentMarkdown = j.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const h1Match = contentMarkdown.match(/^#\s+(.+)$/m);
      title = h1Match ? h1Match[1].trim() : `Kinh nghiệm thuê xe: ${keyword}`;
      metaDescription = `${title}. Hướng dẫn chi tiết chuẩn SEO.`;
    } else {
      console.log(`⚠️ Chưa cấu hình GEMINI_API_KEY. Dùng mẫu chuyên sâu Offline...`);
      const tmpl = getOfflineArticleTemplate(keyword);
      title = tmpl.title;
      metaDescription = tmpl.metaDescription;
      contentMarkdown = tmpl.content;
    }

    const audit = auditSeoArticle({
      title,
      metaDescription,
      content: contentMarkdown,
      targetKeyword: keyword
    });

    console.log(`\n✅ ĐÃ TẠO XONG BÀI VIẾT!`);
    console.log(`- Tiêu đề: ${title}`);
    console.log(`- Điểm SEO: ${audit.totalScore}/100 [${audit.rankReadiness}]`);
    console.log(`- Dung lượng: ${audit.wordCount} từ`);

    const slug = keyword
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const outPath = path.resolve(OUTPUT_DIR, `${slug}.md`);
    fs.writeFileSync(outPath, contentMarkdown, 'utf8');
    console.log(`\n💾 Đã lưu bài viết vào: ${outPath}`);
  }
}

main().catch(e => {
  console.error('[CLI Lỗi]:', e.message);
  process.exit(1);
});
