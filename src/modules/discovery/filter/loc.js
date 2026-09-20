// discovery/filter/loc — trạng thái bộ lọc tìm kiếm (logic thuần, không React).
//
// DÙNG CHUNG: trang tìm kiếm (luồng 04) và ô tìm kiếm trang chủ (luồng 14).
// Import thẳng file này, KHÔNG qua discovery/index.js — cửa chung kéo cả module
// vào gói đầu, vỡ ngân sách JS (HIEU-NANG.md mục 3).
//
// URL là nguồn sự thật duy nhất: mọi bộ lọc nằm trong query string nên chia sẻ
// link được, bấm Quay lại là về đúng bộ lọc cũ.
//
//   ?q=innova&tinh=TP.HCM&quan=Quận 7&gia_tu=500000&gia_den=1000000
//   &cho=5,7&so=so_tu_dong&nl=xang&hang=Toyota&tn=ghe_da,cam_lui&xep=gia_tang
//
// `tinh` / `quan` là TÊN hiển thị (trang chủ luồng 14 đã dùng đúng dạng này).

import { chuanHoaCoMoc, boDau, dungTsQuery } from '../search/chuanHoa'
import { PROVINCES, DISTRICTS, districtsOf } from '../../../data/provinces'
import { BRANDS } from '../../../data/brands'
import { AMENITY_BY_CODE } from '../../../data/amenities'
import { SEAT_OPTIONS, TRANSMISSIONS, FUELS } from '../../../data/options'
import { formatVndShort } from '../../../lib/format'

export const SAP_XEP = [
  { value: 'moi', label: 'Mới cập nhật' },
  { value: 'gia_tang', label: 'Giá thấp trước' },
  { value: 'gia_giam', label: 'Giá cao trước' },
]

export const KHOANG_GIA = [
  { label: 'Dưới 500K', min: null, max: 500_000 },
  { label: '500K – 1 triệu', min: 500_000, max: 1_000_000 },
  { label: '1 – 2 triệu', min: 1_000_000, max: 2_000_000 },
  { label: 'Trên 2 triệu', min: 2_000_000, max: null },
]

export const locRong = () => ({
  q: '', tinh: '', quan: '',
  giaMin: null, giaMax: null,
  cho: [], so: '', nl: '', hang: '', tn: [],
  xep: 'moi',
})

// ─────────────────────────────────────────────
// URL ↔ bộ lọc. Mọi giá trị đọc từ URL đều bị kiểm lại với danh mục tĩnh:
// link do người lạ gửi không được mang giá trị lạ vào truy vấn.
// ─────────────────────────────────────────────
const soDuong = (v) => {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null
}
const tach = (v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [])

export function urlSangLoc(sp) {
  const tinh = PROVINCES.includes(sp.get('tinh')) ? sp.get('tinh') : ''
  const quan = tinh && districtsOf(tinh).includes(sp.get('quan')) ? sp.get('quan') : ''
  const so = sp.get('so')
  const nl = sp.get('nl')
  const xep = sp.get('xep')
  const hang = sp.get('hang')

  return {
    q: (sp.get('q') ?? '').slice(0, 100),
    tinh, quan,
    giaMin: soDuong(sp.get('gia_tu')),
    giaMax: soDuong(sp.get('gia_den')),
    cho: tach(sp.get('cho')).map(Number).filter((n) => SEAT_OPTIONS.includes(n)),
    so: TRANSMISSIONS.some((x) => x.value === so) ? so : '',
    nl: FUELS.some((x) => x.value === nl) ? nl : '',
    hang: BRANDS.includes(hang) ? hang : '',
    tn: tach(sp.get('tn')).filter((c) => AMENITY_BY_CODE[c]),
    xep: SAP_XEP.some((x) => x.value === xep) ? xep : 'moi',
  }
}

/** Bộ lọc → URLSearchParams. Giá trị mặc định KHÔNG ghi ra URL cho link ngắn. */
export function locSangUrl(loc) {
  const sp = new URLSearchParams()
  if (loc.q?.trim()) sp.set('q', loc.q.trim())
  if (loc.tinh) sp.set('tinh', loc.tinh)
  if (loc.tinh && loc.quan) sp.set('quan', loc.quan)
  if (loc.giaMin != null) sp.set('gia_tu', String(loc.giaMin))
  if (loc.giaMax != null) sp.set('gia_den', String(loc.giaMax))
  if (loc.cho?.length) sp.set('cho', [...loc.cho].sort((a, b) => a - b).join(','))
  if (loc.so) sp.set('so', loc.so)
  if (loc.nl) sp.set('nl', loc.nl)
  if (loc.hang) sp.set('hang', loc.hang)
  if (loc.tn?.length) sp.set('tn', [...loc.tn].sort().join(','))
  if (loc.xep && loc.xep !== 'moi') sp.set('xep', loc.xep)
  return sp
}

/**
 * Đường dẫn sang trang tìm kiếm — luồng 14 dùng cho ô tìm kiếm trang chủ:
 *   navigate(duongDanTimKiem('xe so tu dong quan 7'))
 *   navigate(duongDanTimKiem('', { tinh: 'Hà Nội' }))
 * Có câu chữ thì đoán bộ lọc luôn, khách khỏi phải bấm từng ô.
 */
export function duongDanTimKiem(cau = '', locSan = {}) {
  const loc = chotCauTimKiem({ ...locRong(), ...locSan }, cau)
  const s = locSangUrl(loc).toString()
  return s ? `/thue-xe?${s}` : '/thue-xe'
}

// ─────────────────────────────────────────────
// Đoán bộ lọc từ câu chữ ("xe so tu dong quan 7")
// Cắt đoạn đã hiểu ra khỏi câu GỐC (còn dấu) nhờ mốc từ chuanHoaCoMoc.
// ─────────────────────────────────────────────
const thoat = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const chuoiTuKhoa = (s) => boDau(s).replace(/[^a-z0-9]+/g, ' ').trim()
const reTuKhoa = (s) => new RegExp(`\\b${thoat(chuoiTuKhoa(s)).replace(/ /g, '\\s+')}\\b`)

const BI_DANH_TINH = [
  [/\b(?:tp\.?\s*hcm|tphcm|hcm|sai\s*gon|ho\s*chi\s*minh)\b/, 'TP.HCM'],
  [/\b(?:hn|ha\s*noi)\b/, 'Hà Nội'],
]

// Dựng một lần, dùng mãi. Xếp dài trước để "Bà Rịa - Vũng Tàu" thắng tên ngắn.
const DS_TINH = PROVINCES.map((t) => ({ ten: t, re: reTuKhoa(t), dai: chuoiTuKhoa(t).length }))
  .filter((t) => t.dai >= 4)
  .sort((a, b) => b.dai - a.dai)

const DS_QUAN = Object.entries(DISTRICTS)
  .flatMap(([tinh, ds]) => ds.map((q) => ({ tinh, ten: q, re: reTuKhoa(q), dai: chuoiTuKhoa(q).length })))
  .sort((a, b) => b.dai - a.dai)

const DS_HANG = BRANDS.map((h) => ({ ten: h, re: reTuKhoa(h), dai: chuoiTuKhoa(h).length }))
  .sort((a, b) => b.dai - a.dai)

/**
 * @param {string} cau
 * @param {{tinh?: string}} boiCanh  tỉnh khách đã chọn, để phân xử tên quận trùng
 * @returns {{ loc: Partial<ReturnType<typeof locRong>>, conLai: string }}
 */
export function doanBoLoc(cau, boiCanh = {}) {
  const { text, moc } = chuanHoaCoMoc(cau)
  const goc = String(cau ?? '')
  const loc = {}
  const cat = []
  let mat = text // bản để dò; chỗ đã hiểu được che bằng dấu cách để không dò lại

  const lay = (re, xuLy) => {
    const m = re.exec(mat)
    if (!m) return false
    if (xuLy(m) === false) return false
    cat.push([m.index, m.index + m[0].length])
    mat = mat.slice(0, m.index) + ' '.repeat(m[0].length) + mat.slice(m.index + m[0].length)
    return true
  }

  // Số chỗ: chỉ nhận số nằm trong danh mục thật, "99 chỗ" thì để yên cho FTS.
  lay(/\b(\d{1,2})\s*(?:cho|ch)\b/, (m) => {
    const n = Number(m[1])
    if (!SEAT_OPTIONS.includes(n)) return false
    loc.cho = [n]
  })

  // Giá — phải làm SAU số chỗ, không thì "dưới 7 chỗ" bị đọc thành 7.000đ.
  const doiGia = (n, don) => {
    const x = Number(String(n).replace(',', '.'))
    if (!Number.isFinite(x)) return null
    if (don === 'trieu' || don === 'tr') return Math.round(x * 1_000_000)
    if (don) return Math.round(x * 1000)
    return x < 1000 ? Math.round(x * 1000) : Math.round(x)
  }
  const reGia = (tu) => new RegExp(`\\b(?:${tu})\\s*(\\d+(?:[.,]\\d+)?)\\s*(trieu|tr|k|nghin|ngan)?\\b`)
  lay(reGia('duoi|toi da|khong qua|nho hon'), (m) => {
    const g = doiGia(m[1], m[2])
    if (g == null) return false
    loc.giaMax = g
  })
  lay(reGia('tren|it nhat|lon hon'), (m) => {
    const g = doiGia(m[1], m[2])
    if (g == null) return false
    loc.giaMin = g
  })

  if (!lay(/\b(?:so\s+)?tu\s+dong\b/, () => { loc.so = 'so_tu_dong' })) {
    lay(/\bso\s+san\b/, () => { loc.so = 'so_san' })
  }

  // Nhiên liệu: thử lần lượt, trúng cái nào dừng cái đó.
  lay(/\bhybrid\b/, () => { loc.nl = 'hybrid' }) ||
    lay(/\b(?:diesel|dau)\b/, () => { loc.nl = 'dau' }) ||
    lay(/\bxang\b/, () => { loc.nl = 'xang' }) ||
    lay(/\bdien\b/, () => { loc.nl = 'dien' })

  for (const h of DS_HANG) {
    if (lay(h.re, () => { loc.hang = h.ten })) break
  }

  // Tỉnh: bí danh trước (TP.HCM viết trăm kiểu), rồi tên chuẩn.
  for (const [re, ten] of BI_DANH_TINH) {
    if (lay(re, () => { loc.tinh = ten })) break
  }
  if (!loc.tinh) {
    for (const t of DS_TINH) {
      if (lay(t.re, () => { loc.tinh = t.ten })) break
    }
  }

  // Quận: tên trùng giữa các tỉnh thì phân xử theo tỉnh đã biết; vẫn mơ hồ thì
  // BỎ QUA, đoán bừa còn tệ hơn không đoán.
  const tinhBiet = loc.tinh || boiCanh.tinh || ''
  for (const q of DS_QUAN) {
    if (tinhBiet && q.tinh !== tinhBiet) continue
    const ung = lay(q.re, () => {
      const trung = DS_QUAN.filter((x) => x.ten === q.ten).length
      if (!tinhBiet && trung > 1) return false
      loc.quan = q.ten
      loc.tinh = q.tinh
    })
    if (ung) break
  }

  // Cắt phần đã hiểu khỏi câu gốc.
  const xoa = new Array(goc.length).fill(false)
  for (const [s, e] of cat) for (let i = s; i < e; i++) xoa[moc[i]] = true
  const conLai = [...goc].filter((_, i) => !xoa[i]).join('').replace(/\s+/g, ' ').trim()

  return { loc, conLai }
}

const nhieuHon = (a, b) => (a?.length ? a : b ?? [])

/** Gộp phần đoán vào bộ lọc. Khách chọn tay thì thắng phần đoán. */
function gop(loc, doan) {
  const d = doan.loc
  const tinh = loc.tinh || d.tinh || ''
  return {
    ...loc,
    q: doan.conLai,
    tinh,
    // Quận chỉ hợp lệ khi đi cùng đúng tỉnh nó thuộc về.
    quan: loc.quan || (d.quan && d.tinh === tinh ? d.quan : ''),
    giaMin: loc.giaMin ?? d.giaMin ?? null,
    giaMax: loc.giaMax ?? d.giaMax ?? null,
    cho: nhieuHon(loc.cho, d.cho),
    so: loc.so || d.so || '',
    nl: loc.nl || d.nl || '',
    hang: loc.hang || d.hang || '',
  }
}

/**
 * Bộ lọc THỰC SỰ dùng để truy vấn: bộ lọc trong URL + phần đoán từ ô tìm kiếm.
 * Tính lại mỗi lần từ URL nên link chia sẻ ra đúng kết quả mà không cần ghi
 * phần đoán vào URL.
 */
export function locHieuLuc(loc) {
  if (!loc.q?.trim()) return loc
  return gop(loc, doanBoLoc(loc.q, { tinh: loc.tinh }))
}

/**
 * Khách bấm Enter / nút Tìm: đổi phần đoán được thành bộ lọc thật (hiện thành
 * chip, tắt được), phần chữ còn lại giữ làm từ khoá.
 */
export function chotCauTimKiem(loc, cau) {
  const g = gop({ ...loc, q: cau }, doanBoLoc(cau, { tinh: loc.tinh }))
  // Còn lại toàn chữ đệm ("xe") thì bỏ luôn, khỏi để chữ vô nghĩa trong ô.
  if (!dungTsQuery(g.q)) g.q = ''
  return g
}

// ─────────────────────────────────────────────
// Chip bộ lọc đang bật
// ─────────────────────────────────────────────
const nhanGia = (min, max) => {
  if (min != null && max != null) return `${formatVndShort(min)} – ${formatVndShort(max)}/ngày`
  if (max != null) return `Dưới ${formatVndShort(max)}/ngày`
  return `Từ ${formatVndShort(min)}/ngày`
}

/** @returns {{key:string, label:string, xoa:(loc)=>object}[]} */
export function danhSachChip(loc) {
  const chips = []
  if (loc.q?.trim()) chips.push({ key: 'q', label: `“${loc.q.trim()}”`, xoa: (l) => ({ ...l, q: '' }) })
  if (loc.tinh) chips.push({ key: 'tinh', label: loc.tinh, xoa: (l) => ({ ...l, tinh: '', quan: '' }) })
  if (loc.quan) chips.push({ key: 'quan', label: loc.quan, xoa: (l) => ({ ...l, quan: '' }) })
  if (loc.giaMin != null || loc.giaMax != null) {
    chips.push({ key: 'gia', label: nhanGia(loc.giaMin, loc.giaMax), xoa: (l) => ({ ...l, giaMin: null, giaMax: null }) })
  }
  for (const n of loc.cho) {
    chips.push({ key: `cho${n}`, label: `${n} chỗ`, xoa: (l) => ({ ...l, cho: l.cho.filter((x) => x !== n) }) })
  }
  if (loc.so) {
    chips.push({ key: 'so', label: TRANSMISSIONS.find((x) => x.value === loc.so)?.label ?? loc.so, xoa: (l) => ({ ...l, so: '' }) })
  }
  if (loc.nl) {
    chips.push({ key: 'nl', label: FUELS.find((x) => x.value === loc.nl)?.label ?? loc.nl, xoa: (l) => ({ ...l, nl: '' }) })
  }
  if (loc.hang) chips.push({ key: 'hang', label: loc.hang, xoa: (l) => ({ ...l, hang: '' }) })
  for (const c of loc.tn) {
    chips.push({ key: `tn${c}`, label: AMENITY_BY_CODE[c]?.name ?? c, xoa: (l) => ({ ...l, tn: l.tn.filter((x) => x !== c) }) })
  }
  return chips
}

/** Số bộ lọc đang bật, không tính từ khoá và sắp xếp — hiện trên nút "Bộ lọc". */
export function demBoLoc(loc) {
  return danhSachChip(loc).filter((c) => c.key !== 'q').length
}
