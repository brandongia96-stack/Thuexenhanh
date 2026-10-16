// discovery/chu-xe/chuXeApi — hồ sơ CÔNG KHAI của chủ xe.
//
// contracts/api.md mục 3g:
//   · View `owner_public` CHỈ trả 6 cột an toàn, CHỈ người đang có ≥1 tin hiển
//     thị. Null = không tồn tại HOẶC không còn tin nào — hai trường hợp gộp
//     chung một trạng thái rỗng, giống cách `chiTietApi.docTinChiTiet` đã làm
//     với tin hết hạn/bị ẩn/không tồn tại.
//   · CẤM đọc bảng `users` để lấy tên/ảnh người khác — RLS chặn, trả rỗng.
//   · CẤM hiện họ tên đầy đủ, email, SĐT, CCCD trên trang công khai.

import { getSupabase } from '../../../lib/supabase'
import { HAS_BACKEND } from '../../../lib/config'

// 6 cột DUY NHẤT view này cho phép (xem migration 0025) — không có cột nào
// khác để mà lộ, nhưng vẫn liệt kê rõ ràng thay vì `select *` cho nhất quán
// với luật chung (HIEU-NANG.md mục 2.1).
export const COT_CHU_XE = 'id,ten_hien_thi,avatar_url,da_xac_minh,tham_gia_tu,so_xe_dang_cho_thue'

/**
 * Hồ sơ công khai của một chủ xe.
 * @returns {Promise<{id,ten_hien_thi,avatar_url,da_xac_minh,tham_gia_tu,so_xe_dang_cho_thue}|null>}
 */
export async function docChuXeCongKhai(ownerId) {
  if (!HAS_BACKEND || !ownerId) return null
  try {
    const sb = await getSupabase()
    const { data, error } = await sb.from('owner_public').select(COT_CHU_XE).eq('id', ownerId).maybeSingle()
    if (error) throw error
    return data ?? null
  } catch {
    // Mạng chập chờn thì ẩn khối chủ xe — đây là thông tin phụ, không được
    // phép làm hỏng cả trang xe (CLAUDE.md mục 1.3, graceful degradation).
    return null
  }
}

// Cùng hình dạng với `search/searchApi.js` COT_THE — nguồn dữ liệu duy nhất
// vẫn là view `listing_card`. Không thêm owner_ten/owner_avatar: trang này
// đã biết chủ là ai rồi, nhét lại vào từng thẻ chỉ tốn băng thông.
const COT_THE =
  'id,status,brand_text,model_text,year,seats,transmission,fuel,price_per_day,' +
  'province_id,district_id,is_verified,published_at,expires_at,owner_id,' +
  'ev_range_km,charge_policy,collateral_required,' +
  'cover_thumb,cover_blur,cover_width,cover_height'

const TRANG_THAI_HIEN = ['dang_hien_thi', 'sap_het_han']
const CO_TRANG = 20

/**
 * Xe đang hiển thị của một chủ xe — keyset theo "mới nhất", y hệt luật phân
 * trang của trang tìm kiếm (HIEU-NANG.md mục 2.2): cấm OFFSET, không đếm tổng.
 */
export async function danhSachXeCuaChu(ownerId, { cursor = null } = {}) {
  const sb = await getSupabase()
  let q = sb
    .from('listing_card')
    .select(COT_THE)
    .eq('owner_id', ownerId)
    .in('status', TRANG_THAI_HIEN)
    // Hết hạn là không hiện, kể cả khi cron chưa kịp đổi trạng thái.
    .gt('expires_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(CO_TRANG + 1)

  if (cursor) {
    q = q.or(
      `published_at.lt.${cursor.published_at},` +
      `and(published_at.eq.${cursor.published_at},id.lt.${cursor.id})`,
    )
  }

  const { data, error } = await q
  if (error) throw error

  const conNua = data.length > CO_TRANG
  const items = data.slice(0, CO_TRANG)
  const cuoi = items[items.length - 1]
  return {
    items,
    conNua,
    cursor: cuoi ? { published_at: cuoi.published_at, id: cuoi.id } : null,
  }
}

/** "MM/YYYY" từ cột `tham_gia_tu` (luôn là ngày 1 đầu tháng, xem migration 0025). */
export function thangNamThamGia(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}
