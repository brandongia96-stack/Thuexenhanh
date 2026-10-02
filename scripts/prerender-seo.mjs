// scripts/prerender-seo — sinh HTML tĩnh cho trang SEO dòng xe × tỉnh,
// và sinh `sitemap.xml` theo đúng những tổ hợp có thật.
//
// Chạy SAU `vite build` (xem script `build` trong package.json).
//
// ─── Vì sao không dùng trình duyệt ───
// Trang SEO này toàn chữ: tiêu đề, một câu mô tả, danh sách thẻ xe. Thứ máy
// quét cần là <title>, <meta description>, <link canonical> và một <h1> có
// chữ thật. Dựng cả Chromium (~300 MB, build chậm, thêm một chỗ dễ vỡ trên
// CI) chỉ để lấy mấy dòng đó là không đáng. Script này đọc dữ liệu qua REST
// rồi bơm thẳng vào bản sao `index.html`. React vẫn hydrate đè lên như
// thường, nên khách thấy trang động đầy đủ.
//
// ─── Chống lệch nội dung ───
// Toàn bộ câu chữ lấy từ `src/modules/shell/seo-xe/noiDungSeo.js` — đúng
// module mà `TrangDongXe.jsx` dùng. Không chép lại chuỗi ở đây.
//
// ─── Không có dữ liệu thì không sinh gì ───
// Thiếu biến môi trường, mạng hỏng, hay chưa tổ hợp nào đủ tin: script in ra
// lý do rồi THOÁT SẠCH (exit 0). Build vẫn ra một SPA chạy được như cũ.
// Dựng SEO mà làm vỡ cả lần deploy là lỗ nặng hơn nhiều so với thiếu vài
// trang tĩnh.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { slugHoa, duongDanDongXe } from '../src/modules/shell/seo-xe/slugXe.js'
import { NGUONG_INDEX, titleTrang, moTaTrang, tieuDeTrang, cauMoTa }
  from '../src/modules/shell/seo-xe/noiDungSeo.js'
import { formatVndShort } from '../src/lib/format.js'
import { PROVINCES } from '../src/data/provinces.js'

const goc = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = resolve(goc, 'dist')
const MIEN = process.env.SEO_ORIGIN ?? 'https://thuexenhanh.com'

// Cho phép hạ ngưỡng khi chạy thử, để chứng minh script hoạt động trên dữ
// liệu thật dù chưa tổ hợp nào đạt ngưỡng thật. KHÔNG dùng khi build thật.
const NGUONG = Number(process.env.SEO_NGUONG ?? NGUONG_INDEX)

/**
 * Bỏ qua phần SEO nhưng VẪN ghi sitemap trang tĩnh rồi thoát sạch.
 *
 * Trước đây `public/sitemap.xml` là file gõ tay nên luôn có mặt. Giờ sitemap
 * sinh ở đây, nên nếu thoát sớm mà không ghi gì thì site mất sạch sitemap —
 * tệ hơn trạng thái cũ. Thiếu trang SEO thì chấp nhận được, mất cả sitemap
 * thì không.
 */
function thoat(ly_do) {
  console.log(`[prerender] BỎ QUA — ${ly_do}`)
  try { viet_sitemap([]) } catch { /* dist chưa có thì thôi */ }
  process.exit(0)
}

// ─── 1. Biến môi trường ───
// Đọc .env thủ công: script chạy bằng Node, không qua Vite nên không có
// `import.meta.env`. Trên Cloudflare Pages thì biến nằm sẵn ở process.env.
function docEnv() {
  const f = resolve(goc, '.env')
  if (existsSync(f)) {
    for (const dong of readFileSync(f, 'utf8').split('\n')) {
      const m = dong.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
    }
  }
  return {
    url: process.env.VITE_SUPABASE_URL,
    key: process.env.VITE_SUPABASE_ANON_KEY,
  }
}

// ─── 2. Đọc tin thật ───
async function taiTin({ url, key }) {
  // Chỉ 4 cột: script chỉ cần đếm và lấy khoảng giá. Lấy thừa là tải thừa
  // (HIEU-NANG.md mục 2.1), và `select=*` trên listings nay luôn lỗi 42501.
  const q = `${url}/rest/v1/listing_card` +
    '?select=brand_text,model_text,province_id,price_per_day' +
    '&status=eq.dang_hien_thi'
  const r = await fetch(q, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
  if (!r.ok) throw new Error(`REST ${r.status} ${(await r.text()).slice(0, 160)}`)
  const d = await r.json()
  if (!Array.isArray(d)) throw new Error(`REST trả về không phải mảng: ${JSON.stringify(d).slice(0, 160)}`)
  return d
}

// ─── 3. Gom tổ hợp ───
// province_id -> tên tỉnh. `provinces` được seed theo đúng thứ tự PROVINCES
// (0003_seed_static.sql sinh từ cùng mảng này), id chạy từ 1.
const TEN_TINH = new Map(PROVINCES.map((p, i) => [i + 1, p]))

function gomToHop(tins) {
  const bang = new Map()
  const them = (khoa, meta, tin) => {
    if (!bang.has(khoa)) bang.set(khoa, { ...meta, tins: [] })
    bang.get(khoa).tins.push(tin)
  }
  for (const t of tins) {
    const { brand_text: hang, model_text: dong, province_id: tinhId } = t
    if (!hang || !dong) continue
    them(`${hang}|${dong}`, { hang, dong, tenTinh: null }, t)
    const tenTinh = TEN_TINH.get(tinhId)
    if (tenTinh) them(`${hang}|${dong}|${tenTinh}`, { hang, dong, tenTinh }, t)
  }
  // Trả về MỌI tổ hợp có ít nhất 1 tin, kèm cờ `duTin`.
  //
  // Vì sao không lọc thẳng theo ngưỡng: tổ hợp chưa đủ tin mà không có file
  // tĩnh sẽ rơi vào SPA fallback, tức Googlebot nhận `index.html` gốc — mà
  // file đó ghi sẵn `robots: index, follow`. `useMeta` có đổi sang `noindex`
  // nhưng đó là sau khi React chạy, Googlebot không chắc chờ tới lúc đó.
  // Kết quả: đúng những trang mỏng mà ngưỡng sinh ra để chặn lại bị index.
  // Nên vẫn sinh file cho chúng, chỉ khác ở thẻ robots.
  return [...bang.values()]
    .map((x) => ({ ...x, duTin: x.tins.length >= NGUONG }))
    .sort((a, b) => b.tins.length - a.tins.length)
}

// ─── 4. Bơm nội dung vào HTML ───
const thoatHtml = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

function dungTrang(mau, { hang, dong, tenTinh, tins, duTin }) {
  const gia = tins.map((x) => x.price_per_day).filter((x) => x != null)
  const min = gia.length ? formatVndShort(Math.min(...gia)) : null
  const max = gia.length ? formatVndShort(Math.max(...gia)) : null

  const duongDan = duongDanDongXe(hang, dong, tenTinh)
  const title = titleTrang(hang, dong, tenTinh)
  const mota  = moTaTrang(hang, dong, tenTinh, tins.length)
  const h1    = tieuDeTrang(hang, dong, tenTinh)
  const cau   = cauMoTa(hang, dong, tenTinh, tins.length, min, max)
  const canonical = `${MIEN}${duongDan}`

  let html = mau
    .replace(/<meta name="robots"[^>]*>/,
      `<meta name="robots" content="${duTin ? 'index, follow' : 'noindex, follow'}" />`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${thoatHtml(title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${thoatHtml(mota)}" />`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${thoatHtml(title)}" />`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${thoatHtml(mota)}" />`)
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${canonical}" />`)

  // Nội dung cho máy quét đọc trước khi React chạy. React sẽ thay sạch khối
  // này khi hydrate, nên không sợ hiện hai lần.
  // Chỉ chữ: KHÔNG nhúng ảnh xe hay số điện thoại — ảnh thì nặng mà máy quét
  // không cần, còn số điện thoại thì phải đi qua `reveal-phone` để còn đếm
  // lượt lấy số (xem CLAUDE.md §0 ngày 23/09).
  const than = `<div id="root"><main class="page stack"><h1>${thoatHtml(h1)}</h1>` +
    `<p>${thoatHtml(cau)}</p>` +
    `<p>Giao dịch thuê xe do hai bên tự thoả thuận.</p></main></div>`
  html = html.replace(/<div id="root"><\/div>/, than)

  return { duongDan, html, canonical }
}

// ─── 5. Chạy ───
async function main() {
  const mauFile = resolve(DIST, 'index.html')
  if (!existsSync(mauFile)) thoat('chưa có dist/index.html — chạy `vite build` trước')

  const env = docEnv()
  if (!env.url || !env.key) thoat('thiếu VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')

  let tins
  try {
    tins = await taiTin(env)
  } catch (e) {
    thoat(`không đọc được listing_card: ${e.message}`)
  }

  const toHop = gomToHop(tins)
  const soDu = toHop.filter((x) => x.duTin).length
  console.log(`[prerender] ${tins.length} tin đang hiển thị · ngưỡng ≥${NGUONG}`)
  console.log(`[prerender] ${toHop.length} tổ hợp có tin · ${soDu} đủ ngưỡng (index) · ${toHop.length - soDu} chưa đủ (noindex)`)

  const mau = readFileSync(mauFile, 'utf8')
  const duongDans = []
  for (const th of toHop) {
    const { duongDan, html } = dungTrang(mau, th)
    const thuMuc = resolve(DIST, duongDan.replace(/^\//, ''))
    mkdirSync(thuMuc, { recursive: true })
    writeFileSync(resolve(thuMuc, 'index.html'), html)
    if (th.duTin) duongDans.push(duongDan)
    console.log(`  ${th.duTin ? '+' : '·'} ${duongDan}  (${th.tins.length} xe)${th.duTin ? '' : '  noindex'}`)
  }

  viet_sitemap(duongDans)

  if (soDu === 0) {
    console.log('[prerender] Chưa tổ hợp nào đủ ngưỡng — sitemap chỉ có trang tĩnh. Bình thường khi tin còn ít.')
  }
}

// ─── 6. Sitemap ───
// Trước đây là file tĩnh gõ tay trong `public/`. Gõ tay thì mỗi lần thêm
// trang lại quên cập nhật, và không thể liệt kê trang SEO vì danh sách đổi
// theo dữ liệu. Sinh ở đây để luôn khớp với trang thật sự tồn tại.
const TRANG_TINH = ['/', '/thue-xe', '/gioi-thieu', '/quy-che', '/dieu-khoan', '/bao-mat', '/hoan-token', '/khieu-nai', '/thue', '/tro-giup', '/lien-he']

function viet_sitemap(duongDanSeo) {
  const hom_nay = new Date().toISOString().slice(0, 10)
  const url = (p, uuTien) =>
    `  <url><loc>${MIEN}${p === '/' ? '/' : p}</loc>` +
    `<lastmod>${hom_nay}</lastmod><priority>${uuTien}</priority></url>`

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    TRANG_TINH.map((p) => url(p, p === '/' ? '1.0' : '0.7')).join('\n') + '\n' +
    // Trang SEO ưu tiên thấp hơn trang chủ nhưng cao hơn trang pháp lý:
    // chúng có nội dung thật và là cửa vào từ tìm kiếm.
    duongDanSeo.map((p) => url(p, '0.8')).join(duongDanSeo.length ? '\n' : '') +
    (duongDanSeo.length ? '\n' : '') +
    '</urlset>\n'

  writeFileSync(resolve(DIST, 'sitemap.xml'), xml)
  console.log(`[prerender] sitemap.xml: ${TRANG_TINH.length} trang tĩnh + ${duongDanSeo.length} trang SEO`)
}

main().catch((e) => {
  // Vẫn không làm vỡ build: in lỗi rồi thoát sạch.
  console.log(`[prerender] BỎ QUA — lỗi không lường trước: ${e.message}`)
  process.exit(0)
})
