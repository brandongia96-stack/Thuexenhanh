// admin — đăng nhập quản trị riêng ở /admin (0030_dang_nhap_admin_rieng.sql).
//
// Tên đăng nhập + mật khẩu đi thẳng tới Edge Function `admin-login`; server
// kiểm mật khẩu (Supabase Auth), đếm lần sai, tạm khoá, rồi cấp phiên. Client
// chỉ nhận phiên và gắn vào supabase-js. Không lưu mật khẩu, không lưu "đã là
// admin" ở localStorage — mỗi lần mở /admin đều hỏi lại server.

import { callFunction, getSupabase } from '../../lib/supabase'

export async function dangNhapQuanTri(username, password) {
  const tok = await callFunction('admin-login', { username, password })
  const sb = await getSupabase()
  const { error } = await sb.auth.setSession({
    access_token: tok.access_token,
    refresh_token: tok.refresh_token,
  })
  if (error) throw error
}

/** Phiên hiện tại có phải phiên quản trị còn hạn không — server trả lời. */
export async function kiemPhienQuanTri() {
  const sb = await getSupabase()
  const { data: s } = await sb.auth.getSession()
  if (!s.session) return { hopLe: false, hetHanLuc: null }
  const { data, error } = await sb.rpc('toi_la_quan_tri')
  if (error) throw error
  const hopLe = Boolean(data?.admin || data?.kiem_duyet)
  return { hopLe, hetHanLuc: hopLe && data.het_han_luc ? new Date(data.het_han_luc) : null }
}

/** Huỷ phiên quản trị ở server. Nơi gọi signOut() ngay sau đó. */
export async function huyPhienQuanTri() {
  try {
    const sb = await getSupabase()
    await sb.rpc('thoat_quan_tri')
  } catch {
    // signOut phía sau vẫn thu hồi refresh token; phiên cũ hết hạn sau 8 giờ.
  }
}
