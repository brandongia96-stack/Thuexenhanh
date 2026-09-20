// discovery/search/searchApi — truy vấn danh sách tin cho trang tìm kiếm.
//
// Luật cứng (HIEU-NANG.md mục 2, contracts/api.md mục 2):
//   · đọc view `listing_card`, LIỆT KÊ CỘT, cấm select *
//   · phân trang KEYSET, cấm OFFSET, KHÔNG đếm tổng — chỉ biết "còn nữa hay hết"
//   · chỉ tin đang hiển thị và còn hạn
//   · gõ tiếp thì huỷ request cũ (AbortSignal)

import { getSupabase } from '../../../lib/supabase'
import { dungTsQuery } from './chuanHoa'
import { idDiaGioi } from './idDiaGioi'

export const CO_TRANG = 20

// Cố ý KHÔNG có search_tsv / amenity_codes: hai cột đó chỉ để LỌC, kéo về là
// phí băng thông cho mỗi thẻ xe.
const COT_THE =
  'id,status,brand_text,model_text,year,seats,transmission,fuel,price_per_day,' +
  'province_id,district_id,is_verified,published_at,expires_at,owner_id,' +
  'cover_thumb,cover_blur,cover_width,cover_height'

// `sap_het_han` vẫn còn hiển thị (chủ xe đã trả phí tới hết hạn).
const TRANG_THAI_HIEN = ['dang_hien_thi', 'sap_het_han']

/** Cột dùng để sắp xếp + làm cursor. `id` luôn là khoá phụ để keyset không lệch. */
const KIEU_XEP = {
  moi:      { cot: 'published_at',  tang: false },
  gia_tang: { cot: 'price_per_day', tang: true },
  gia_giam: { cot: 'price_per_day', tang: false },
}

/**
 * @param {ReturnType<import('../filter/loc').locHieuLuc>} loc  bộ lọc ĐÃ gộp phần đoán
 * @param {{cursor?: object|null, signal?: AbortSignal}} opt
 * @returns {Promise<{items: object[], conNua: boolean, cursor: object|null}>}
 */
export async function timTheXe(loc, { cursor = null, signal } = {}) {
  const sb = await getSupabase()
  const xep = KIEU_XEP[loc.xep] ?? KIEU_XEP.moi

  // Đổi tên tỉnh/quận sang id. Có chọn mà không tra ra id thì trả RỖNG chứ không
  // lặng lẽ bỏ bộ lọc — bỏ đi là khách ở Huế thấy xe Hà Nội mà không biết vì sao.
  let ids = { province_id: null, district_id: null }
  if (loc.tinh) {
    ids = await idDiaGioi(loc.tinh, loc.quan)
    if (!ids.province_id || (loc.quan && !ids.district_id)) {
      return { items: [], conNua: false, cursor: null }
    }
  }

  let q = sb
    .from('listing_card')
    .select(COT_THE)
    .in('status', TRANG_THAI_HIEN)
    // Hết hạn là không hiện, kể cả khi cron chưa kịp đổi trạng thái.
    .gt('expires_at', new Date().toISOString())

  if (ids.province_id) q = q.eq('province_id', ids.province_id)
  if (ids.district_id) q = q.eq('district_id', ids.district_id)
  if (loc.giaMin != null) q = q.gte('price_per_day', loc.giaMin)
  if (loc.giaMax != null) q = q.lte('price_per_day', loc.giaMax)
  if (loc.cho?.length) q = q.in('seats', loc.cho)
  if (loc.so) q = q.eq('transmission', loc.so)
  if (loc.nl) q = q.eq('fuel', loc.nl)
  // brand_text là chữ tự do chủ xe nhập ("vinfast", "VinFast") → so không phân biệt hoa thường.
  // Tên hãng trong danh mục không có ký tự đặc biệt của ilike (% _).
  if (loc.hang) q = q.ilike('brand_text', loc.hang)
  if (loc.tn?.length) q = q.contains('amenity_codes', loc.tn)

  const tsq = dungTsQuery(loc.q)
  // Cấu hình 'simple' PHẢI khớp với to_tsvector('simple', unaccent(...)) lúc ghi
  // (contracts/schema.sql, hàm listings_tsv), không thì không ra kết quả nào.
  if (tsq) q = q.textSearch('search_tsv', tsq, { config: 'simple' })

  q = q.order(xep.cot, { ascending: xep.tang }).order('id', { ascending: xep.tang })

  // Keyset: (cột, id) so với dòng cuối của trang trước.
  if (cursor) {
    const toan = xep.tang ? 'gt' : 'lt'
    q = q.or(
      `${xep.cot}.${toan}.${cursor.gia_tri},` +
      `and(${xep.cot}.eq.${cursor.gia_tri},id.${toan}.${cursor.id})`,
    )
  }

  q = q.limit(CO_TRANG + 1) // lấy dư 1 dòng để biết còn nữa hay hết
  if (signal) q = q.abortSignal(signal)

  const { data, error } = await q
  if (error) throw error

  const conNua = data.length > CO_TRANG
  const items = data.slice(0, CO_TRANG)
  const cuoi = items[items.length - 1]
  return {
    items,
    conNua,
    cursor: cuoi ? { gia_tri: cuoi[xep.cot], id: cuoi.id } : null,
  }
}
