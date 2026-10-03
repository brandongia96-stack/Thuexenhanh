// gia-nhien-lieu — lấy giá bán lẻ xăng/dầu (Petrolimex, vùng 1) mỗi ngày.
//
// Gọi bởi pg_cron (0019_gia_nhien_lieu.sql), header `x-cron-secret` = CRON_SECRET.
//
// Vì sao không lấy thẳng petrolimex.com.vn: trang đó tải giá bằng JS có mã hoá
// RSA (cố tình chống cào). Vì sao không quét Google: cấm cào, hay captcha.
// Hai nguồn dưới đây đăng lại bảng giá Petrolimex dạng HTML thường:
//   1. giaxanghomnay.com  — có xăng E10 + ngày điều chỉnh giá   (CHÍNH)
//   2. webgia.com         — chậm hơn, không có E10              (DỰ PHÒNG, chỉ dầu)
//
// Đây là trang của người khác — họ đổi giao diện là đọc sai. Nên:
//   · giá phải trong khoảng 15.000–50.000đ/lít
//   · lệch quá 15% so với giá đang lưu → KHÔNG ghi, báo lỗi (giữ giá cũ)
//   · không đọc được gì → giữ giá cũ. Giao diện tự ẩn giá quá 10 ngày chưa
//     kiểm lại được (giaThamChieuApi.js), nên không bao giờ hiện số cũ mãi.
// Cấm bịa giá dự phòng trong code (CLAUDE.md 1.2).

import { json } from '../_shared/http.ts'
import { admin } from '../_shared/db.ts'

const CRON_SECRET = Deno.env.get('CRON_SECRET')
const GIA_MIN = 15_000
const GIA_MAX = 50_000
const LECH_TOI_DA = 0.15

type SanPham = { code: string; label: string; khop: RegExp }

// Mã đã chốt ở contracts/api.md mục 2.
const SAN_PHAM: SanPham[] = [
  { code: 'xang_e10', label: 'Xăng E10 RON95-III', khop: /E10\s*RON\s*95.*(Mức\s*3|-III)/i },
  { code: 'dau_do', label: 'Dầu DO 0,05S', khop: /^DO\s*0[,.]05S/i },
]

type Nguon = { ten: string; url: string; chiDung?: string[] }
const NGUON: Nguon[] = [
  { ten: 'giaxanghomnay.com', url: 'https://giaxanghomnay.com/' },
  { ten: 'webgia.com', url: 'https://webgia.com/gia-xang-dau/petrolimex/', chiDung: ['dau_do'] },
]

const boThe = (s: string) =>
  s.replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ').trim()

/** Bảng giá đầu tiên trong trang → các hàng ô chữ. */
function docBang(html: string): string[][] {
  const i = html.indexOf('<table')
  if (i < 0) return []
  const bang = html.slice(i, html.indexOf('</table>', i))
  return [...bang.matchAll(/<tr[\s\S]*?<\/tr>/g)].map((tr) =>
    [...tr[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => boThe(c[1])),
  )
}

/** Ngày điều chỉnh giá ghi trên trang (dd/mm/yyyy) → 'yyyy-mm-dd'. */
function docNgay(html: string, nguon: string): string | null {
  const t = boThe(html)
  const m = nguon === 'giaxanghomnay.com'
    ? t.match(/Lịch sử thay đổi giá xăng dầu\D{0,20}(\d{1,2})\/(\d{1,2})\/(20\d\d)/)
    : t.match(/Cập nhật lúc [\d:]+ (\d{1,2})\/(\d{1,2})\/(20\d\d)/)
  if (!m) return null
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
}

function homNayVN() {
  return new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)
}

async function docNguon(n: Nguon) {
  const r = await fetch(n.url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (thuexenhanh gia tham chieu)' },
    signal: AbortSignal.timeout(15_000),
  })
  if (!r.ok) throw new Error(`${n.ten} HTTP ${r.status}`)
  const html = await r.text()
  const hang = docBang(html)
  // Cột "vùng 1" tìm theo tiêu đề, không đoán vị trí.
  const tieuDe = hang.find((h) => h.some((c) => /vùng\s*1/i.test(c))) ?? []
  const cot = tieuDe.findIndex((c) => /vùng\s*1/i.test(c))
  if (cot < 0) throw new Error(`${n.ten}: không thấy cột vùng 1`)

  const ketQua: Record<string, number> = {}
  for (const sp of SAN_PHAM) {
    if (n.chiDung && !n.chiDung.includes(sp.code)) continue
    const h = hang.find((x) => sp.khop.test(x[0] ?? ''))
    const so = Number((h?.[cot] ?? '').replace(/[^\d]/g, ''))
    if (so) ketQua[sp.code] = so
  }
  return { gia: ketQua, ngay: docNgay(html, n.ten) ?? homNayVN() }
}

Deno.serve(async (req) => {
  if (!CRON_SECRET || req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return json({ error: 'khong_co_quyen' }, 401)
  }
  const db = admin()
  const baoCao: Record<string, string> = {}

  for (const sp of SAN_PHAM) {
    const { data: cu } = await db
      .from('reference_prices')
      .select('price')
      .eq('code', sp.code).is('deleted_at', null)
      .order('effective_date', { ascending: false }).limit(1).maybeSingle()

    let ghi = false
    for (const n of NGUON) {
      if (n.chiDung && !n.chiDung.includes(sp.code)) continue
      let doc
      try {
        doc = await docNguon(n)
      } catch (e) {
        baoCao[`${sp.code}@${n.ten}`] = `lỗi: ${(e as Error).message}`
        continue
      }
      const gia = doc.gia[sp.code]
      if (!gia) { baoCao[`${sp.code}@${n.ten}`] = 'không thấy dòng giá'; continue }
      if (gia < GIA_MIN || gia > GIA_MAX) { baoCao[`${sp.code}@${n.ten}`] = `giá lạ ${gia}`; continue }
      if (cu?.price && Math.abs(gia - cu.price) / cu.price > LECH_TOI_DA) {
        baoCao[`${sp.code}@${n.ten}`] = `lệch >15% so với ${cu.price} (${gia}) — giữ giá cũ, cần admin xem`
        continue
      }

      // Một dòng cho mỗi kỳ điều chỉnh. Cùng kỳ thì chỉ chạm updated_at —
      // đó là mốc "đã kiểm lại lần cuối" để giao diện biết giá còn tươi.
      const { error } = await db.from('reference_prices').upsert({
        code: sp.code,
        label: sp.label,
        unit: 'lít',
        price: gia,
        source: `Petrolimex vùng 1 (qua ${n.ten})`,
        source_url: n.url,
        effective_date: doc.ngay,
        deleted_at: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'code,effective_date' })
      baoCao[sp.code] = error ? `ghi lỗi: ${error.message}` : `${gia} ngày ${doc.ngay} (${n.ten})`
      ghi = !error
      break
    }
    if (!ghi) console.error('[gia-nhien-lieu] không cập nhật được', sp.code, baoCao)
  }

  return json({ ok: true, ket_qua: baoCao })
})
