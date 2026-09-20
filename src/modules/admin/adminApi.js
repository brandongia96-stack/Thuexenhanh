// admin/adminApi — cửa duy nhất để giao diện quản trị chạm vào dữ liệu.
//
// Hai loại hàm, tách bạch (giống billingApi):
//   · ĐỌC  -> PostgREST, RLS quyết định ai thấy gì (admin/kiem_duyet đọc được listings,
//             moderation_queue, reports; chỉ admin đọc users, admin_actions)
//   · GHI  -> Edge Function `admin-ops`, chạy service_role, mỗi thao tác là một hàm
//             Postgres đã tự ghi `admin_actions` trong cùng transaction
// Không có hàm nào ở đây `insert`/`update`/`delete` thẳng vào bảng.
//
// Trang admin không cần tối ưu hiệu năng mạnh (HIEU-NANG.md mục 7) nhưng vẫn:
// phân trang, cấm tải hết, cấm `select *`.

import { getSupabase, callFunction } from '../../lib/supabase'

export const TRANG = 20
const nhay = (v) => `"${v}"`

const op = (action, body = {}) => callFunction('admin-ops', { action, ...body })

// Cursor keyset trên (created_at, id). `huong` = 'asc' cho hàng đợi (cũ nhất trước).
function phanTrang(q, cursor, huong) {
  const asc = huong === 'asc'
  q = q.order('created_at', { ascending: asc }).order('id', { ascending: asc })
  if (!cursor) return q
  const so = asc ? 'gt' : 'lt'
  return q.or(
    `created_at.${so}.${nhay(cursor.created_at)},` +
      `and(created_at.eq.${nhay(cursor.created_at)},id.${so}.${nhay(cursor.id)})`,
  )
}

function goiTrang(data, limit) {
  const hang = data ?? []
  const conNua = hang.length > limit
  const items = conNua ? hang.slice(0, limit) : hang
  const cuoi = items[items.length - 1]
  return { items, conNua, cursor: cuoi ? { created_at: cuoi.created_at, id: cuoi.id } : null }
}

// Bỏ ký tự làm hỏng bộ lọc PostgREST `or`/`ilike`.
const lamSach = (s) => String(s ?? '').replace(/[%,()"\\]/g, ' ').trim().slice(0, 60)

// ─── HÀNG ĐỢI DUYỆT TIN ───

const COT_TIN_CHO =
  'id,owner_id,brand_text,model_text,year,plate,color,seats,transmission,fuel,' +
  'price_per_day,description,contact_phone,province_id,address_text,created_at,' +
  'owner:users!listings_owner_id_fkey(full_name,phone,verify_status),' +
  'listing_images(url_thumb,url_medium,sort_order,deleted_at),' +
  'moderation_queue(status,created_at)'

/**
 * Tin `cho_duyet` CHƯA được duyệt, cũ nhất trước — người gửi trước được duyệt trước.
 *
 * Duyệt xong tin vẫn ở `cho_duyet` (chờ chủ xe trả phí mới lên `dang_hien_thi`),
 * nên phải loại những tin mà dòng hàng đợi MỚI NHẤT đã là `da_duyet`, nếu không
 * tin đã duyệt cứ hiện lại. Lọc sau khi tải nên một trang có thể ít hơn `limit`.
 */
export async function hangDuyet({ cursor = null, limit = TRANG } = {}) {
  const sb = await getSupabase()
  const q = phanTrang(
    sb.from('listings').select(COT_TIN_CHO).eq('status', 'cho_duyet').is('deleted_at', null).limit(limit + 1),
    cursor, 'asc',
  )
  const { data, error } = await q
  if (error) throw error
  const chuaDuyet = (data ?? []).filter((t) => {
    const moi = [...(t.moderation_queue ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
    return moi?.status !== 'da_duyet'
  })
  return goiTrang(chuaDuyet, limit)
}

export const canhBaoTrungBienSo = (listingId) => op('plate_conflicts', { listing_id: listingId })
export const duyetTin = (listingId) => op('moderate_listing', { listing_id: listingId, decision: 'duyet' })
export const tuChoiTin = (listingId, reason) =>
  op('moderate_listing', { listing_id: listingId, decision: 'tu_choi', reason })

// ─── NGƯỜI DÙNG ───

const COT_USER = 'id,full_name,phone,email,verify_status,verified_at,deleted_at,created_at'

/** Tìm theo SĐT / email / tên. Bỏ trống = người dùng mới nhất. */
export async function timNguoiDung(tuKhoa, { cursor = null, limit = TRANG } = {}) {
  const sb = await getSupabase()
  let q = sb.from('users').select(COT_USER).limit(limit + 1)
  const k = lamSach(tuKhoa)
  if (k) q = q.or(`phone.ilike.*${k}*,email.ilike.*${k}*,full_name.ilike.*${k}*`)
  q = phanTrang(q, cursor, 'desc')
  const { data, error } = await q
  if (error) throw error
  return goiTrang(data, limit)
}

/** Người dùng đã gửi giấy tờ, đang chờ xét tích xanh. */
export async function choXetTichXanh() {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('users').select(COT_USER).eq('verify_status', 'cho_xet').order('created_at').limit(TRANG)
  if (error) throw error
  return data ?? []
}

export async function tinCuaNguoiDung(userId) {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('listings')
    .select('id,status,brand_text,model_text,expires_at,published_at')
    .eq('owner_id', userId).is('deleted_at', null)
    .order('created_at', { ascending: false }).limit(TRANG)
  if (error) throw error
  return data ?? []
}

/** Nhật ký thao tác của admin lên một đối tượng (người dùng, tin, ví...). */
export async function nhatKyDoiTuong(targetId) {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('admin_actions')
    .select('id,admin_id,action,after_data,created_at')
    .eq('target_id', targetId).order('created_at', { ascending: false }).limit(20)
  if (error) throw error
  return data ?? []
}

export const khoaNguoiDung = (userId, reason) => op('set_user_lock', { user_id: userId, lock: true, reason })
export const moKhoaNguoiDung = (userId, reason) => op('set_user_lock', { user_id: userId, lock: false, reason })
export const xetTichXanh = (userId, verifyStatus, note) =>
  op('set_verified', { user_id: userId, verify_status: verifyStatus, note })

// ─── VÍ (chỉ admin) ───

export const viCuaNguoiDung = (userId) => op('user_wallet', { user_id: userId })

/**
 * Cộng / trừ / hoàn token tay. `kind`: 'tang' | 'hoan' | 'thu_hoi'. `tokens` luôn DƯƠNG.
 * `idemKey` do form giữ ổn định cho tới khi thao tác thành công — bấm đúp không ghi hai dòng.
 */
export const dieuChinhVi = ({ userId, kind, tokens, reason, idemKey }) =>
  op('adjust_wallet', { user_id: userId, kind, tokens, reason, idem_key: idemKey })

// ─── BÁO CÁO ───

export async function baoCaoChuaXuLy() {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('reports')
    .select('id,listing_id,reason_code,detail,status,created_at,' +
      'listing:listings!reports_listing_id_fkey(brand_text,model_text,status)')
    .in('status', ['moi', 'dang_xu_ly']).is('deleted_at', null)
    .order('created_at', { ascending: false }).limit(TRANG)
  if (error) throw error
  return data ?? []
}

export const xuLyBaoCao = (reportId, status, note) =>
  op('handle_report', { report_id: reportId, status, note })

// ─── BÁO CÁO SỐ LIỆU ───

export const doanhThu = (from, to) => op('revenue', { from, to })
export const sucKhoeHeThong = (days = 14) => op('health', { days })
