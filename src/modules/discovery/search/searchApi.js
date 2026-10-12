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
// ev_range_km/charge_policy/collateral_required: đúng 3 cột xe điện mà
// listing_card có (NGHIEN-CUU-XE-DIEN.md mục 3) — dùng cho huy hiệu "Free sạc"
// + quãng đường trên thẻ, và cho 3 bộ lọc dưới. Không thêm cột nào khác.
const COT_THE =
  'id,status,brand_text,model_text,year,seats,transmission,fuel,price_per_day,' +
  'province_id,district_id,is_verified,published_at,expires_at,owner_id,' +
  'ev_range_km,charge_policy,collateral_required,' +
  'cover_thumb,cover_blur,cover_width,cover_height'

// `sap_het_han` vẫn còn hiển thị (chủ xe đã trả phí tới hết hạn).
const TRANG_THAI_HIEN = ['dang_hien_thi', 'sap_het_han']

/** Cột dùng để sắp xếp + làm cursor. `id` luôn là khoá phụ để keyset không lệch. */
const KIEU_XEP = {
  moi:      { cot: 'published_at',  tang: false },
  gia_tang: { cot: 'price_per_day', tang: true },
  gia_giam: { cot: 'price_per_day', tang: false },
  // "Gần bạn nhất" (contracts/api.md §3f) — chỉ dùng khi có toạ độ, xem dungGan bên dưới.
  gan:      { cot: 'distance_km',   tang: true },
}

/**
 * @param {ReturnType<import('../filter/loc').locHieuLuc>} loc  bộ lọc ĐÃ gộp phần đoán
 * @param {{cursor?: object|null, signal?: AbortSignal, viTri?: {lat:number,lng:number}|null}} opt
 * @returns {Promise<{items: object[], conNua: boolean, cursor: object|null}>}
 */
export async function timTheXe(loc, { cursor = null, signal, viTri = null } = {}) {
  const sb = await getSupabase()
  // Chọn "Gần bạn nhất" mà chưa có toạ độ (link chia sẻ, chưa cấp quyền) thì lùi
  // về "Mới cập nhật" — im lặng, không báo lỗi (TrangTimKiem.jsx đã tự xin quyền
  // trước khi đặt xep='gan' vào URL, nên đây chỉ là lưới an toàn).
  const dungGan = loc.xep === 'gan' && viTri?.lat != null && viTri?.lng != null
  const xepKey = loc.xep === 'gan' && !dungGan ? 'moi' : loc.xep
  const xep = KIEU_XEP[xepKey] ?? KIEU_XEP.moi

  // Đổi tên tỉnh/quận sang id. Có chọn mà không tra ra id thì trả RỖNG chứ không
  // lặng lẽ bỏ bộ lọc — bỏ đi là khách ở Huế thấy xe Hà Nội mà không biết vì sao.
  let ids = { province_id: null, district_id: null }
  if (loc.tinh) {
    ids = await idDiaGioi(loc.tinh, loc.quan)
    if (!ids.province_id || (loc.quan && !ids.district_id)) {
      return { items: [], conNua: false, cursor: null }
    }
  }

  // RPC trả mọi cột của listing_card + distance_km, gắn tiếp bộ lọc/sắp xếp/
  // keyset y như đọc thẳng view (contracts/api.md §3f) — select phải có `id`.
  let q = dungGan
    ? sb.rpc('listing_card_gan', { p_lat: viTri.lat, p_lng: viTri.lng }).select(`${COT_THE},distance_km`)
    : sb.from('listing_card').select(COT_THE)

  q = q
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
  // "Free sạc" = chủ xe miễn phí toàn bộ hoặc miễn phí trong giới hạn km.
  // charge_policy null ở xe xăng nên tự động không khớp, khỏi cần ép nl='dien'.
  if (loc.sac) q = q.in('charge_policy', ['mien_phi', 'mien_phi_gioi_han'])
  // "Miễn thế chấp" là cột chung cho mọi xe (không riêng xe điện) — xem
  // contracts/schema.sql, cột collateral_required.
  if (loc.khongTheChap) q = q.eq('collateral_required', false)
  // ev_range_km null ở xe xăng nên tự loại, khỏi cần ép nl='dien' ở đây.
  if (loc.kmMin != null) q = q.gte('ev_range_km', loc.kmMin)

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
  let items = data.slice(0, CO_TRANG)
  // TheXe.jsx đọc the.khoangCach để hiện huy hiệu — chỉ RPC gan mới có số thật
  // từ server, ưu tiên hơn số gần đúng client tự tính (toadoDiaGioi.js).
  if (dungGan) items = items.map((r) => ({ ...r, khoangCach: Number(r.distance_km) }))
  const cuoi = items[items.length - 1]
  return {
    items,
    conNua,
    cursor: cuoi ? { gia_tri: cuoi[xep.cot], id: cuoi.id } : null,
  }
}
