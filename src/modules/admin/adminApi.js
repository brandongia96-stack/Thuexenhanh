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

/**
 * Ghép `contact_phone` / `contact_zalo` / `plate` vào danh sách tin, tại chỗ.
 *
 * Ba cột đó không select thẳng được (xem `0010_bao_ve_sdt.sql`). Một lần gọi
 * cho cả trang, không phải mỗi tin một vòng mạng.
 *
 * Không ném lỗi: thiếu số thì màn duyệt hiện thiếu ô đó, còn hơn trắng cả
 * hàng chờ. Hàm SQL tự lọc theo quyền nên tin không được phép xem sẽ vắng mặt.
 */
async function ghepCotRieng(sb, tins) {
  if (!tins?.length) return tins
  try {
    const { data, error } = await sb.rpc('listing_private_many', { p_ids: tins.map((t) => t.id) })
    if (error) return tins
    const bang = new Map((data ?? []).map((r) => [r.id, r]))
    for (const t of tins) Object.assign(t, bang.get(t.id) ?? {})
  } catch {
    /* bỏ qua: xem chú thích trên */
  }
  return tins
}

// ─── HÀNG ĐỢI DUYỆT TIN ───

// `plate` và `contact_phone` KHÔNG select thẳng được nữa: anon/authenticated đã
// bị hạ quyền đọc 3 cột nhạy cảm ở `0010_bao_ve_sdt.sql`. Người kiểm duyệt vẫn
// cần chúng để đối chiếu giấy tờ, nên lấy qua `listing_private_many` bên dưới.
const COT_TIN_CHO =
  'id,owner_id,brand_text,model_text,year,color,seats,transmission,fuel,' +
  'price_per_day,price_anomaly,description,province_id,address_text,created_at,' +
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
  await ghepCotRieng(sb, chuaDuyet)
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

/** Đối soát sổ ví (chỉ admin, chỉ đọc). Trả { items: [{van_de, user_id, chi_tiet}] } — rỗng là tốt. */
export const doiSoatVi = () => op('doi_soat_vi')

// ─── GIÁ SÀN, GIÁ NHIÊN LIỆU, CỨU HỘ ───
// Đọc thẳng bảng (RLS công khai đọc). Ghi đi qua admin-ops.

export async function giaSan() {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('price_floors').select('seats,min_price_per_day,note,updated_at').order('seats')
  if (error) throw error
  return data ?? []
}

export const suaGiaSan = ({ seats, minPricePerDay, note }) =>
  op('set_price_floor', { seats, min_price_per_day: minPricePerDay, note })

/** Mọi dòng giá (kể cả lịch sử) để admin thấy dòng nào đang áp dụng. */
export async function giaNhienLieu() {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('reference_prices')
    .select('id,code,label,unit,price,source,source_url,effective_date,updated_at')
    .is('deleted_at', null)
    .order('code').order('effective_date', { ascending: false }).limit(100)
  if (error) throw error
  return data ?? []
}

/** Giá đang áp dụng, lấy từ view (có checked_at). */
export async function giaDangApDung() {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('reference_price_now').select('code,label,unit,price,source,effective_date,checked_at')
  if (error) throw error
  return data ?? []
}

export const nhapGiaNhienLieu = (fields) => op('set_reference_price', fields)

export async function danhBaCuuHo() {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('rescue_contacts')
    .select('id,province_id,name,phone,service,note,sort_order')
    .is('deleted_at', null).order('province_id').order('sort_order').limit(200)
  if (error) throw error
  return data ?? []
}

export const luuCuuHo = (fields) => op('upsert_rescue', fields)
export const xoaCuuHo = (id, reason) => op('delete_rescue', { id, reason })

/** Link ký 60 giây tới ảnh/PDF bằng chứng. Gọi lại mỗi lần bấm xem: link hết hạn nhanh. */
export const bangChungCuaBaoCao = (reportId) => op('evidence_urls', { report_id: reportId })

// ─── KHIẾU NẠI, GỠ TIN, CUNG CẤP DỮ LIỆU, XOÁ TÀI KHOẢN (0023) ───
//
// Bốn bảng này có RLS riêng cho kiểm duyệt/admin ghi trực tiếp (0023_tuan_thu_phap_ly.sql)
// — khác billing/ví, KHÔNG đi qua admin-ops. Ngoại lệ: nút "Ẩn ngay" của yêu cầu
// gỡ cần hai việc trong một transaction (ẩn đối tượng + đóng hàng đợi), nên đó
// vẫn là một hàm server gọi qua admin-ops (action `execute_takedown`).

const COT_KHIEU_NAI =
  'id,code,kind,content,status,due_at,resolution,created_at,resolved_at,' +
  'user:users!complaints_user_id_fkey(full_name,phone),' +
  'listing:listings(brand_text,model_text)'

/** Hàng đợi khiếu nại, hạn gần nhất lên trước. `status` null = mọi trạng thái chưa đóng. */
export async function hangDoiKhieuNai({ status = null } = {}) {
  const sb = await getSupabase()
  let q = sb.from('complaints').select(COT_KHIEU_NAI).order('due_at').limit(TRANG)
  q = status ? q.eq('status', status) : q.neq('status', 'dong')
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function tinNhanKhieuNai(complaintId) {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('complaint_messages').select('id,author_id,is_staff,body,created_at')
    .eq('complaint_id', complaintId).order('created_at')
  if (error) throw error
  return data ?? []
}

/** Đổi trạng thái + ghi kết quả. RLS `complaints_staff` chặn ai không phải kiểm duyệt/admin. */
export async function xuLyKhieuNai(complaintId, { status, resolution, actorId }) {
  const sb = await getSupabase()
  const patch = { status }
  if (resolution !== undefined) patch.resolution = resolution
  if (status === 'da_giai_quyet' || status === 'dong') {
    patch.handled_by = actorId
    patch.resolved_at = new Date().toISOString()
  }
  const { error } = await sb.from('complaints').update(patch).eq('id', complaintId)
  if (error) throw error
}

export async function traLoiKhieuNai(complaintId, body, actorId) {
  const sb = await getSupabase()
  const { error } = await sb.from('complaint_messages')
    .insert({ complaint_id: complaintId, author_id: actorId, is_staff: true, body })
  if (error) throw error
}

const COT_GO_TIN =
  'id,source,requester,doc_ref,target_type,target_id,reason,received_at,deadline_at,' +
  'status,handled_by,handled_at,note'

/** Hàng đợi yêu cầu gỡ, hạn gần nhất lên trước. */
export async function hangDoiYeuCauGo() {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('takedown_requests').select(COT_GO_TIN).order('deadline_at').limit(TRANG)
  if (error) throw error
  return data ?? []
}

export async function themYeuCauGo(fields) {
  const sb = await getSupabase()
  const { error } = await sb.from('takedown_requests').insert(fields)
  if (error) throw error
}

/** Từ chối gỡ (không phải vi phạm thật) — ghi lý do, KHÔNG đụng đối tượng. */
export async function tuChoiYeuCauGo(id, note, actorId) {
  const sb = await getSupabase()
  const { error } = await sb.from('takedown_requests')
    .update({ status: 'tu_choi', note, handled_by: actorId, handled_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

/** "Ẩn ngay": ẩn đối tượng + đóng hàng đợi trong một transaction (xem ghi chú đầu mục). */
export const anNgayYeuCauGo = (id) => op('execute_takedown', { id })

/** Sổ cung cấp dữ liệu cho cơ quan chức năng. Bắt buộc số văn bản (RLS không chặn nhưng form phải ép). */
export async function soCungCapDuLieu() {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('authority_requests').select('id,agency,doc_number,doc_date,scope,delivered_at,note,created_at')
    .order('created_at', { ascending: false }).limit(TRANG)
  if (error) throw error
  return data ?? []
}

export async function themYeuCauCoQuan(fields, actorId) {
  const sb = await getSupabase()
  const { error } = await sb.from('authority_requests').insert({ ...fields, handled_by: actorId })
  if (error) throw error
}

/** Yêu cầu xoá tài khoản. Chỉ đọc — xoá thật do cron `thuc_hien_xoa_tai_khoan` làm. */
export async function yeuCauXoaTaiKhoan() {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('account_deletion_requests')
    .select('id,user_id,requested_at,execute_after,status,done_at,' +
      'user:users!account_deletion_requests_user_id_fkey(full_name,phone,email)')
    .order('requested_at', { ascending: false }).limit(TRANG)
  if (error) throw error
  return data ?? []
}
