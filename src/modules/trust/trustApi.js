// trust/trustApi — gọi server cho OTP, báo cáo, giấy tờ xác minh.
//
// Client KHÔNG tự ghi được huy hiệu (RLS + trigger chặn). Mọi thứ ở đây chỉ
// là "xin" server làm; server quyết định.

import { callFunction, getSupabase } from '../../lib/supabase'
import { toE164 } from '../../lib/phone'

export const LY_DO_BAO_CAO = [
  { code: 'khong_lien_lac_duoc', label: 'Số điện thoại không liên lạc được' },
  { code: 'xe_khong_co_that', label: 'Xe không có thật' },
  { code: 'gia_sai', label: 'Giá sai so với thực tế' },
  { code: 'lua_coc', label: 'Có dấu hiệu lừa đặt cọc' },
  { code: 'khac', label: 'Lý do khác' },
]

/** Gửi mã OTP tới số điện thoại. Server giới hạn 5 lần/số/ngày. */
export async function guiOtp(phone) {
  const e164 = toE164(phone)
  if (!e164) throw Object.assign(new Error('Số điện thoại không hợp lệ'), { code: 'du_lieu_khong_hop_le' })
  return callFunction('send-otp', { phone: e164 })
}

/** Xác thực mã OTP. Thành công thì server tự ghi `phone_verified_at`. */
export async function xacThucOtp(phone, code) {
  return callFunction('verify-otp', { phone: toE164(phone), code: String(code).trim() })
}

/** Khách báo cáo một tin. Một người chỉ báo một tin một lần (unique index). */
export async function baoCaoTin({ listingId, reasonCode, detail }) {
  const sb = await getSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw Object.assign(new Error('Cần đăng nhập để báo cáo'), { code: 'chua_dang_nhap' })
  const { error } = await sb.from('reports').insert({
    listing_id: listingId,
    reporter_id: user.id,
    reason_code: reasonCode,
    detail: detail?.trim() || null,
  })
  if (error?.code === '23505') {
    throw Object.assign(new Error('Anh/chị đã báo cáo tin này rồi'), { code: 'da_bao_cao' })
  }
  if (error) throw error
}

/**
 * Gửi ảnh cà vẹt xét "Đã xác minh giấy tờ xe". Bucket `verify-docs` riêng tư,
 * đường dẫn bắt đầu bằng user id. Admin xoá ảnh sau khi duyệt xong.
 */
export async function guiGiayTo(userId, file) {
  const sb = await getSupabase()
  const path = `${userId}/${crypto.randomUUID()}.${(file.name.split('.').pop() || 'jpg').toLowerCase()}`
  const { error } = await sb.storage.from('verify-docs').upload(path, file, { upsert: false })
  if (error) throw error
  return callFunction('request-verify', { doc_path: path })
}
