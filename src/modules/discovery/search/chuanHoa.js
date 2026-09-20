// discovery/search/chuanHoa — bỏ dấu tiếng Việt + dựng tsquery.
//
// CSDL đánh chỉ mục bằng  to_tsvector('simple', unaccent(...))  — xem
// contracts/schema.sql, hàm listings_tsv(). Token đã lưu là chữ KHÔNG DẤU,
// chữ thường. Nên phía client bắt buộc bỏ dấu y hệt trước khi gửi tsquery,
// nếu không khách gõ "Huế" sẽ không khớp token "hue" đang nằm trong index.

/**
 * Bỏ dấu + hạ chữ thường, GIỮ LẠI mốc chỉ số trỏ về chuỗi gốc.
 *
 * Vì sao cần mốc: bộ đoán bộ lọc phải cắt đúng đoạn chữ ra khỏi câu GỐC
 * ("xe 7 chỗ" → bỏ "7 chỗ", còn "xe"). Sau khi bỏ dấu, độ dài chuỗi đã khác
 * nên không thể dùng chỉ số của chuỗi đã chuẩn hoá để cắt chuỗi gốc.
 *
 * @returns {{ text: string, moc: number[] }} moc[i] = vị trí trong chuỗi gốc
 */
export function chuanHoaCoMoc(s) {
  const raKy = []
  const moc = []
  const goc = String(s ?? '')

  for (let i = 0; i < goc.length; i++) {
    const thuong = goc[i].toLowerCase()
    // NFD tách dấu thành ký tự tổ hợp rồi xoá. Riêng 'đ' không tách được,
    // phải đổi tay.
    const khongDau = thuong.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const ra = khongDau === 'đ' ? 'd' : khongDau
    for (const ky of ra) {
      raKy.push(ky)
      moc.push(i)
    }
  }

  return { text: raKy.join(''), moc }
}

export function boDau(s) {
  return chuanHoaCoMoc(s).text
}

// Chữ đệm khách hay gõ mà không mang nghĩa tìm kiếm. Giữ lại chỉ làm tsquery
// chặt thêm một điều kiện & vô ích rồi trả về 0 kết quả.
const CHU_DEM = new Set([
  'xe', 'oto', 'o', 'to', 'thue', 'can', 'muon', 'tim', 'kiem', 'co', 'khong',
  'gia', 're', 'dep', 'moi', 'cu', 'chiec', 'con', 'nao', 'tai', 'khu', 'vuc',
  'nay', 'day', 'gan', 'toi', 'minh', 'di', 'va', 'voi', 'cho', 'la', 'cua',
])

const TOI_DA_TU = 8

/**
 * Dựng tsquery cho cột `search_tsv`.
 *
 * Mọi token đều thêm `:*` để khớp tiền tố — khách gõ "inno" vẫn ra "Innova".
 * Các token AND với nhau: gõ thêm chữ là thu hẹp kết quả, đúng kỳ vọng.
 *
 * @returns {string|null} null = không có gì để tìm, bỏ hẳn điều kiện FTS
 */
export function dungTsQuery(cau) {
  const tu = boDau(cau)
    .split(/[^a-z0-9]+/)
    .filter((t) => t && !CHU_DEM.has(t))
    .slice(0, TOI_DA_TU)

  if (!tu.length) return null
  return tu.map(motTu).join(' & ')
}

function motTu(t) {
  const manh = t.match(/[a-z]+|[0-9]+/g) ?? [t]
  if (manh.length < 2) return `${t}:*`

  // "vf8": chủ xe có thể đã gõ liền ("VF8" → token 'vf8') hoặc gõ rời
  // ("VF 8" → hai token 'vf' và '8'). Chấp cả hai, nếu không thì khách gõ
  // thiếu dấu cách là mất sạch kết quả. Tương tự "i10" ↔ "i 10", "mazda3".
  const roi = manh.map((m) => `${m}:*`).join(' & ')
  return `(${t}:* | (${roi}))`
}
