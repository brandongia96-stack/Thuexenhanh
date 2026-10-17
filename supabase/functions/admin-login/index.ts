// POST /admin-login — đăng nhập QUẢN TRỊ ở /admin (0030_dang_nhap_admin_rieng.sql)
//
// Vào:  { username, password }
// Ra:   { access_token, refresh_token }  hoặc  { error, message }
//
// Tách khỏi đăng nhập Google/email của người dùng:
//   · Tên đăng nhập ("admin") → user trong admin_accounts. Email thật của user
//     tra từ CSDL lúc chạy, không nằm trong code (repo công khai).
//   · Mật khẩu do Supabase Auth kiểm và băm — hàm này không lưu, không ghi log.
//   · Mọi lần thử được ghi + đếm TRƯỚC khi kiểm mật khẩu (admin_login_bat_dau):
//     sai nhiều lần → tạm khoá 15 phút.
//   · Đúng → ghi session_id vào admin_sessions. Chỉ phiên có ở đó mới có quyền
//     quản trị (has_role / admin-ops), sống 8 giờ.
//   · Thông báo lỗi chung chung: không nói sai tên hay sai mật khẩu.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { preflight, docBody, json, loi } from '../_shared/http.ts'
import { admin } from '../_shared/db.ts'

const URL = Deno.env.get('SUPABASE_URL')!
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!

const SAI = 'Tên đăng nhập hoặc mật khẩu không đúng'

function ipNguoiGoi(req: Request) {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'khong_ro'
  ).slice(0, 64)
}

// Đọc claim session_id trong access token vừa do Supabase Auth cấp (đã tin
// được — không phải token client gửi lên).
function sessionId(accessToken: string): string | null {
  try {
    const b64 = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const claims = JSON.parse(atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '=')))
    return typeof claims.session_id === 'string' ? claims.session_id : null
  } catch {
    return null
  }
}

// Mọi lần sai chờ thêm một chút, để thời gian trả lời không lộ "tên có tồn
// tại hay không" (tên không tồn tại thì không gọi Supabase Auth).
const cho = () => new Promise((r) => setTimeout(r, 400 + Math.random() * 400))

Deno.serve(async (req) => {
  const p = preflight(req)
  if (p) return p

  const b = (await docBody<{ username?: unknown; password?: unknown }>(req)) ?? {}
  const username = typeof b.username === 'string' ? b.username.trim().toLowerCase() : ''
  const password = typeof b.password === 'string' ? b.password : ''
  if (!username || !password || username.length > 64 || password.length > 200) {
    return loi('sai_dang_nhap', SAI)
  }

  const ip = ipNguoiGoi(req)
  const sv = admin()

  const { data: batDau, error: e1 } = await sv.rpc('admin_login_bat_dau', {
    p_username: username, p_ip: ip,
  })
  if (e1 || !batDau) {
    console.error('admin-login bat_dau', e1)
    return loi('loi_he_thong', 'Không đăng nhập được lúc này, thử lại sau')
  }
  const attempt = batDau.attempt as number
  const ketThuc = (ok: boolean, user: string | null = null, session: string | null = null) =>
    sv.rpc('admin_login_ket_thuc', {
      p_attempt: attempt, p_ok: ok, p_user: user, p_session: session, p_ip: ip,
    })

  if (batDau.khoa) {
    await cho()
    return loi('tam_khoa', 'Đăng nhập sai quá nhiều lần. Tạm khoá 15 phút, thử lại sau.')
  }

  if (!batDau.user_id || !batDau.email) {
    await ketThuc(false)
    await cho()
    return loi('sai_dang_nhap', SAI)
  }

  // Client riêng bằng anon key, không lưu phiên: chỉ để Supabase Auth kiểm
  // mật khẩu và cấp phiên mới cho tài khoản quản trị.
  const auth = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await auth.auth.signInWithPassword({
    email: batDau.email as string, password,
  })
  const s = data?.session
  if (error || !s || s.user.id !== batDau.user_id) {
    await ketThuc(false)
    await cho()
    return loi('sai_dang_nhap', SAI)
  }

  const sid = sessionId(s.access_token)
  if (!sid) {
    console.error('admin-login: token không có session_id')
    await sv.auth.admin.signOut(s.access_token).catch(() => {})
    await ketThuc(false)
    return loi('loi_he_thong', 'Không đăng nhập được lúc này, thử lại sau')
  }

  const { error: e2 } = await ketThuc(true, s.user.id, sid)
  if (e2) {
    console.error('admin-login ket_thuc', e2)
    await sv.auth.admin.signOut(s.access_token).catch(() => {})
    return loi('loi_he_thong', 'Không đăng nhập được lúc này, thử lại sau')
  }

  return json({ access_token: s.access_token, refresh_token: s.refresh_token })
})
